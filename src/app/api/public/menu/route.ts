import { prisma } from "@/lib/prisma";

export async function GET() {
  const branch = await prisma.branch.findFirst({
    where: { isActive: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  if (!branch) {
    return Response.json({
      branch: null,
      categories: [],
      products: [],
    });
  }

  const [categories, products] = await prisma.$transaction([
    prisma.category.findMany({
      where: { branchId: branch.id, isActive: true },
      select: { id: true, name: true, slug: true, icon: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        category: { branchId: branch.id, isActive: true },
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        featured: true,
        category: { select: { name: true, slug: true } },
      },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    }),
  ]);

  return Response.json({ branch, categories, products });
}
