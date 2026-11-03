import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getCurrentMember } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

const orderSchema = z.object({
  tableCode: z.string().regex(/^\d{6}$/),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(30)
    .refine(
      (items) => new Set(items.map((item) => item.productId)).size === items.length,
      "Aynı ürün siparişte bir kez bulunmalıdır.",
    ),
});

export async function POST(request: Request) {
  const currentMember = await getCurrentMember();
  if (!currentMember) {
    return Response.json(
      { error: "Masa siparişi için üye girişi yapın.", loginUrl: "/uye" },
      { status: 401 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Masa kodu ve ürün bilgilerini kontrol edin." }, { status: 400 });
  }

  const table = await prisma.diningTable.findUnique({
    where: { code: parsed.data.tableCode },
    include: { branch: { select: { isActive: true } } },
  });
  if (!table || !table.isActive || !table.branch.isActive) {
    return Response.json({ error: "Masa kodu bulunamadı veya kullanım dışı." }, { status: 404 });
  }

  const productIds = parsed.data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
      stock: { gt: 0 },
      category: { branchId: table.branchId, isActive: true },
    },
    select: { id: true, name: true, price: true },
  });
  if (products.length !== productIds.length) {
    return Response.json(
      { error: "Ürünlerden biri artık siparişe açık değil. Menüyü yenileyin." },
      { status: 409 },
    );
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const orderItems = parsed.data.items.map(({ productId, quantity }) => {
    const product = productById.get(productId)!;
    return { name: product.name, price: product.price, quantity };
  });
  const total = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  if (total <= 0) {
    return Response.json({ error: "Sipariş toplamı geçersiz." }, { status: 400 });
  }

  const trackingToken = randomBytes(32).toString("base64url");
  const order = await prisma.$transaction(async (transaction) => {
    const balanceUpdate = await transaction.member.updateMany({
      where: {
        id: currentMember.id,
        isActive: true,
        balance: { gte: total },
      },
      data: { balance: { decrement: total } },
    });
    if (balanceUpdate.count === 0) return null;

    const createdOrder = await transaction.diningOrder.create({
      data: {
        trackingToken,
        status: "PENDING",
        total,
        memberId: currentMember.id,
        branchId: table.branchId,
        tableId: table.id,
        paymentStatus: "PAID",
        paymentMethod: "MEMBER_BALANCE",
        paidAt: new Date(),
        paidBy: currentMember.memberNumber,
        items: { create: orderItems },
      },
      select: { id: true },
    });

    await transaction.memberBalanceTransaction.create({
      data: {
        memberId: currentMember.id,
        amount: -total,
        orderId: createdOrder.id,
        description: `Masadan sipariş · ${table.name}`,
      },
    });
    return createdOrder;
  });
  if (!order) {
    return Response.json(
      { error: "Bakiyeniz bu sipariş için yetersiz. Bakiye yüklemek için personele danışın." },
      { status: 402 },
    );
  }

  return Response.json({ orderId: order.id, trackingToken }, { status: 201 });
}
