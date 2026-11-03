import { z } from "zod";
import { getCurrentMember } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

const codeSchema = z.string().regex(/^\d{6}$/);

export async function GET(request: Request) {
  const member = await getCurrentMember();
  if (!member) {
    return Response.json(
      { error: "Masa siparişi için üye girişi yapın.", loginUrl: "/uye" },
      { status: 401 },
    );
  }

  const code = new URL(request.url).searchParams.get("code") ?? "";
  if (!codeSchema.safeParse(code).success) {
    return Response.json({ error: "6 haneli masa kodunu girin." }, { status: 400 });
  }

  const table = await prisma.diningTable.findUnique({
    where: { code },
    include: { branch: { select: { id: true, name: true, isActive: true } } },
  });
  if (!table || !table.isActive || !table.branch.isActive) {
    return Response.json({ error: "Masa kodu bulunamadı veya kullanım dışı." }, { status: 404 });
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      category: { branchId: table.branchId, isActive: true },
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      imageUrl: true,
      stock: true,
      category: { select: { name: true } },
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return Response.json({
    table: { id: table.id, name: table.name },
    branchId: table.branchId,
    branchName: table.branch.name,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryName: product.category.name,
    })),
  });
}
