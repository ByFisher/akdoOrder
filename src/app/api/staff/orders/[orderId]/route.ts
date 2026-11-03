import { z } from "zod";
import { getStaffRole } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum(["PREPARING", "READY", "SERVED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const role = await getStaffRole();
  if (!role) {
    return Response.json({ error: "Personel oturumu gerekli." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Sipariş durumu geçersiz." }, { status: 400 });
  }

  const allowed =
    role === "chef"
      ? parsed.data.status === "PREPARING"
        ? ["PENDING"]
        : parsed.data.status === "READY"
          ? ["PREPARING"]
          : []
      : parsed.data.status === "SERVED"
        ? ["READY"]
        : [];
  if (allowed.length === 0) {
    return Response.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }

  const { orderId } = await params;
  const result = await prisma.diningOrder.updateMany({
    where: { id: orderId, status: { in: allowed } },
    data: { status: parsed.data.status },
  });
  if (result.count === 0) {
    return Response.json(
      { error: "Sipariş bulunamadı veya durumu başka bir personel tarafından değiştirildi." },
      { status: 409 },
    );
  }

  return Response.json({ ok: true, status: parsed.data.status });
}
