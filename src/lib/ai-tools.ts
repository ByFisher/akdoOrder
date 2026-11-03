import { tool } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

function normalizeText(value: string) {
  return value
    .replaceAll("I", "ı")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

async function findProduct(name: string, branchId: string) {
  const products = await prisma.product.findMany({
    where: { category: { branchId } },
    include: { category: true },
  });
  const normalizedName = normalizeText(name);
  const exactMatches = products.filter(
    (product) => normalizeText(product.name) === normalizedName,
  );
  const matches =
    exactMatches.length > 0
      ? exactMatches
      : products.filter((product) =>
          normalizeText(product.name).includes(normalizedName),
        );

  if (matches.length === 0) {
    throw new Error(`"${name}" adlı bir ürün bulunamadı.`);
  }

  if (matches.length > 1) {
    throw new Error(
      `"${name}" birden fazla ürünle eşleşiyor. Lütfen tam ürün adını belirtin.`,
    );
  }

  return matches[0];
}

async function findCategory(nameOrSlug: string, branchId: string) {
  const normalizedCategory = normalizeText(nameOrSlug);
  const categories = await prisma.category.findMany({
    where: { branchId },
  });
  const category = categories.find(
    (item) =>
      normalizeText(item.name) === normalizedCategory ||
      normalizeText(item.slug) === normalizedCategory,
  );

  if (!category) {
    throw new Error(
      `"${nameOrSlug}" kategorisi bulunamadı. Mevcut kategoriler: ${categories
        .map((item) => item.name)
        .join(", ")}.`,
    );
  }

  return category;
}

export function createMenuAdminTools(branchId: string) {
  return {
    listMenu: tool({
      description:
        "Mevcut kategorileri ve ürünleri; fiyat, stok ve görünürlük bilgileriyle listeler.",
      inputSchema: z.object({
        category: z.string().optional().describe("İsteğe bağlı kategori adı"),
      }),
      execute: async ({ category: categoryName }) => {
        const category = categoryName
          ? await findCategory(categoryName, branchId)
          : null;
        const products = await prisma.product.findMany({
          where: category
            ? { categoryId: category.id }
            : { category: { branchId } },
          include: { category: true },
          orderBy: { name: "asc" },
        });

        return {
          categories: category
            ? [category.name]
            : (await prisma.category.findMany({
                where: { branchId },
                orderBy: { sortOrder: "asc" },
              }))
                .map((item) => `${item.name} (${item.slug})`),
          products: products.map((product) => ({
            name: product.name,
            category: product.category.name,
            price: product.price,
            stock: product.stock,
            visible: product.isActive,
          })),
        };
      },
    }),
    addProduct: tool({
      description:
        "Menüye yeni bir ürün ekler. Kategori adı mevcut kategorilerden biri olmalıdır.",
      inputSchema: z.object({
        name: z.string().min(2).max(100),
        category: z.string().min(2),
        price: z.number().int().positive().max(100000),
        description: z.string().max(500).default(""),
        allergens: z.array(z.string().max(60)).max(12).default([]),
      }),
      execute: async ({ name, category: categoryName, price, description, allergens }) => {
        const category = await findCategory(categoryName, branchId);
        const product = await prisma.product.create({
          data: {
            name,
            categoryId: category.id,
            price,
            description,
            allergens: allergens.join(", "),
          },
        });

        revalidatePath("/");
        revalidatePath("/login");

        return {
          action: "add",
          summary: `${product.name}, ${category.name} kategorisine ${product.price} TL fiyatla eklendi.`,
          productName: product.name,
          price: product.price,
        };
      },
    }),
    updateProduct: tool({
      description:
        "Menüdeki mevcut bir ürünün fiyatını, açıklamasını, stok miktarını veya görünürlüğünü günceller.",
      inputSchema: z.object({
        name: z.string().min(2).max(100),
        price: z.number().int().positive().max(100000).optional(),
        description: z.string().max(500).optional(),
        stock: z.number().int().min(0).max(100000).optional(),
        isActive: z.boolean().optional(),
      }),
      execute: async ({ name, ...changes }) => {
        if (Object.values(changes).every((value) => value === undefined)) {
          throw new Error("Güncellenecek en az bir alan belirtilmelidir.");
        }

        const existing = await findProduct(name, branchId);
        const product = await prisma.product.update({
          where: { id: existing.id },
          data: changes,
        });
        const updatedFields = [
          changes.price !== undefined ? `fiyatı ${product.price} TL` : null,
          changes.stock !== undefined ? `stoğu ${product.stock}` : null,
          changes.description !== undefined ? "açıklaması güncellendi" : null,
          changes.isActive !== undefined
            ? product.isActive
              ? "menüde görünür yapıldı"
              : "menüden gizlendi"
            : null,
        ].filter((field): field is string => field !== null);

        revalidatePath("/");
        revalidatePath("/login");

        return {
          action: "update",
          summary: `${product.name} için ${updatedFields.join(", ")}.`,
          productName: product.name,
          price: product.price,
        };
      },
    }),
    hideOutOfStockDrinks: tool({
      description:
        "Stok miktarı sıfır olan ve İçecekler kategorisinde bulunan ürünleri menüden gizler.",
      inputSchema: z.object({}),
      execute: async () => {
        const category = await findCategory("icecekler", branchId);
        const result = await prisma.product.updateMany({
          where: {
            categoryId: category.id,
            stock: 0,
            isActive: true,
          },
          data: { isActive: false },
        });

        revalidatePath("/");
        revalidatePath("/login");

        return {
          action: "hide",
          summary:
            result.count > 0
              ? `${result.count} stokta olmayan içecek menüden gizlendi.`
              : "Stokta olmayan ve görünür durumda olan içecek bulunamadı.",
          count: result.count,
        };
      },
    }),
  };
}
