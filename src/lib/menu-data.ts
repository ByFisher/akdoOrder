import { prisma } from "@/lib/prisma";
import { getActiveBranch } from "@/lib/branches";
import type { MenuCategory, MenuProduct } from "@/lib/menu-types";

export async function getPublicMenu(branchId?: string | null): Promise<{
  branch: NonNullable<Awaited<ReturnType<typeof getActiveBranch>>>;
  categories: MenuCategory[];
  products: MenuProduct[];
}> {
  const branch = (await getActiveBranch(branchId)) ?? (await getActiveBranch());
  if (!branch) {
    throw new Error("Varsayılan şube bulunamadı.");
  }

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { branchId: branch.id, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        category: { branchId: branch.id, isActive: true },
      },
      include: { category: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return {
    branch,
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      isActive: category.isActive,
      productCount: products.filter(
        (product) => product.categoryId === category.id,
      ).length,
    })),
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      allergens: product.allergens
        .split(",")
        .map((allergen) => allergen.trim())
        .filter(Boolean),
      stock: product.stock,
      isActive: product.isActive,
      featured: product.featured,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        icon: product.category.icon,
        isActive: product.category.isActive,
      },
    })),
  };
}
