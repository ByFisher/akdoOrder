import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trackingToken: string }> },
) {
  const { trackingToken } = await params;
  const order = await prisma.diningOrder.findUnique({
    where: { trackingToken },
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
  });
  if (!order) {
    return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  return Response.json({ order });
}
