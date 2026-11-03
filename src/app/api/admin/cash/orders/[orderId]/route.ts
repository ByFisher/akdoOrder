import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const paymentSchema = z.object({
  paymentMethod: z.enum(["CASH", "EXTERNAL_POS"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Ödeme yöntemini kontrol edin." }, { status: 400 });
  }

  const { orderId } = await params;
  const result = await prisma.diningOrder.updateMany({
    where: { id: orderId, paymentStatus: "UNPAID" },
    data: {
      paymentStatus: "PAID",
      paymentMethod: parsed.data.paymentMethod,
      paidAt: new Date(),
      paidBy: process.env.ADMIN_USERNAME?.trim() || "Yönetim",
    },
  });

  if (result.count === 0) {
    return Response.json(
      { error: "Sipariş bulunamadı veya ödeme daha önce kaydedilmiş." },
      { status: 409 },
    );
  }

  return Response.json({ ok: true });
}
