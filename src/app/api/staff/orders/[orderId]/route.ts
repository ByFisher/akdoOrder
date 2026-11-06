import { z } from "zod";
import { getStaffRole } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum(["PREPARING", "READY", "SERVED", "CANCELLED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const role = await getStaffRole();
  if (!role) {
    return Response.json(
      { error: "Personel oturumu gerekli." },
      { status: 401 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Sipariş durumu geçersiz." },
      { status: 400 },
    );
  }

  let allowed: string[];
  if (parsed.data.status === "CANCELLED") {
    allowed = role === "chef" ? ["PENDING", "PREPARING"] : [];
  } else if (role === "chef") {
    allowed =
      parsed.data.status === "PREPARING"
        ? ["PENDING"]
        : parsed.data.status === "READY"
          ? ["PREPARING"]
          : [];
  } else {
    allowed = parsed.data.status === "SERVED" ? ["READY"] : [];
  }
  if (allowed.length === 0) {
    return Response.json(
      { error: "Bu işlem için yetkiniz yok." },
      { status: 403 },
    );
  }

  const { orderId } = await params;
  const updated = await prisma.$transaction(async (transaction) => {
    const order = await transaction.diningOrder.findUnique({
      where: { id: orderId },
      select: {
        memberId: true,
        total: true,
        paymentStatus: true,
        paymentMethod: true,
        table: { select: { name: true } },
      },
    });
    if (!order) return false;

    const result = await transaction.diningOrder.updateMany({
      where: { id: orderId, status: { in: allowed } },
      data: { status: parsed.data.status },
    });
    if (result.count === 0) return false;

    if (order.memberId) {
      const refunded =
        parsed.data.status === "CANCELLED" &&
        order.paymentStatus === "PAID" &&
        order.paymentMethod === "MEMBER_BALANCE";
      if (refunded) {
        await transaction.member.update({
          where: { id: order.memberId },
          data: { balance: { increment: order.total } },
        });
        await transaction.memberBalanceTransaction.create({
          data: {
            memberId: order.memberId,
            amount: order.total,
            orderId,
            description: `İptal edilen sipariş iadesi · ${order.table.name}`,
          },
        });
        await transaction.diningOrder.update({
          where: { id: orderId },
          data: { paymentStatus: "REFUNDED" },
        });
      }

      const statusCopy =
        parsed.data.status === "CANCELLED"
          ? {
              title: "Siparişiniz iptal edildi",
              body: refunded
                ? `${order.table.name} için siparişiniz iptal edildi; tutar bakiyenize iade edildi.`
                : `${order.table.name} için siparişiniz iptal edildi.`,
            }
          : {
              PREPARING: {
                title: "Siparişiniz hazırlanıyor",
                body: `${order.table.name} için siparişiniz hazırlanmaya başladı.`,
              },
              READY: {
                title: "Siparişiniz hazır",
                body: `${order.table.name} için siparişiniz hazır. Garsonumuz size ulaştıracak.`,
              },
              SERVED: {
                title: "Siparişiniz teslim edildi",
                body: `${order.table.name} için siparişiniz teslim edildi. Afiyet olsun!`,
              },
            }[parsed.data.status];

      await transaction.memberNotification.create({
        data: {
          memberId: order.memberId,
          orderId,
          type:
            parsed.data.status === "CANCELLED"
              ? "ORDER_CANCELLED"
              : "ORDER_STATUS",
          ...statusCopy,
        },
      });
    }

    return true;
  });
  if (!updated) {
    return Response.json(
      {
        error:
          "Sipariş bulunamadı veya durumu başka bir personel tarafından değiştirildi.",
      },
      { status: 409 },
    );
  }

  return Response.json({ ok: true, status: parsed.data.status });
}
