import { getCurrentMember } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return Response.json({ error: "Üye girişi gerekli." }, { status: 401 });
  }

  const orders = await prisma.diningOrder.findMany({
    where: { memberId: member.id },
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
      paymentStatus: true,
      paymentMethod: true,
      paidAt: true,
      table: { select: { name: true } },
      branch: { select: { name: true } },
      items: {
        select: { id: true, name: true, price: true, quantity: true },
        orderBy: { id: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({ member, orders });
}
