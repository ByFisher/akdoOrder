import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getActiveBranch } from "@/lib/branches";
import { isValidImageUrl } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  name: z.string().trim().min(2).max(100),
  categoryId: z.string().min(1),
  price: z.number().int().positive().max(100000),
  description: z.string().trim().max(500).default(""),
  imageUrl: z
    .string()
    .trim()
    .max(2048)
    .refine(isValidImageUrl, "Görsel adresi geçerli değil.")
    .default(""),
  allergens: z.string().trim().max(500).default(""),
  stock: z.number().int().min(0).max(100000).default(20),
  featured: z.boolean().default(false),
});

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const branch = await getActiveBranch(
    new URL(request.url).searchParams.get("branchId"),
  );
  if (!branch) {
    return Response.json({ error: "Seçilen şube bulunamadı veya pasif." }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Ürün bilgilerini kontrol edip tekrar deneyin." },
      { status: 400 },
    );
  }

  const { categoryId, ...productData } = parsed.data;
  const category = await prisma.category.findFirst({
    where: { id: categoryId, branchId: branch.id },
    select: { id: true, isActive: true },
  });

  if (!category) {
    return Response.json(
      { error: "Seçilen kategori bulunamadı. Önce bir kategori oluşturun." },
      { status: 400 },
    );
  }

  if (!category.isActive) {
    return Response.json(
      { error: "Pasif bir kategoriye yeni ürün eklenemez." },
      { status: 400 },
    );
  }

  const lastProduct = await prisma.product.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });
  const product = await prisma.product.create({
    data: {
      ...productData,
      categoryId,
      sortOrder: (lastProduct._max.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/");
  revalidatePath("/login");

  return Response.json({ product }, { status: 201 });
}
