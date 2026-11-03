import { getStaffRole } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const role = await getStaffRole();
  if (!role) {
    return Response.json({ error: "Personel oturumu gerekli." }, { status: 401 });
  }

  const orders = await prisma.diningOrder.findMany({
    where: {
      status: role === "chef" ? { in: ["PENDING", "PREPARING"] } : "READY",
    },
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
      table: { select: { name: true } },
      branch: { select: { name: true } },
      items: {
        select: { id: true, name: true, price: true, quantity: true },
        orderBy: { id: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ role, orders });
}
