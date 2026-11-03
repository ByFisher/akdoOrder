import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getActiveBranch } from "@/lib/branches";
import { isValidImageUrl } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";

const productUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    categoryId: z.string().min(1).optional(),
    price: z.number().int().positive().max(100000).optional(),
    description: z.string().trim().max(500).optional(),
    imageUrl: z
      .string()
      .trim()
      .max(2048)
      .refine(isValidImageUrl, "Görsel adresi geçerli değil.")
      .optional(),
    allergens: z.string().trim().max(500).optional(),
    stock: z.number().int().min(0).max(100000).optional(),
    isActive: z.boolean().optional(),
    featured: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const { productId } = await params;
  const branch = await getActiveBranch(
    new URL(request.url).searchParams.get("branchId"),
  );
  if (!branch) {
    return Response.json({ error: "Seçilen şube bulunamadı veya pasif." }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Ürün bilgilerini kontrol edip tekrar deneyin." },
      { status: 400 },
    );
  }

  const currentProduct = await prisma.product.findFirst({
    where: { id: productId, category: { branchId: branch.id } },
    select: { id: true, categoryId: true },
  });

  if (!currentProduct) {
    return Response.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  if (parsed.data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, branchId: branch.id },
      select: { id: true, isActive: true },
    });

    if (!category) {
      return Response.json(
        { error: "Seçilen kategori bulunamadı." },
        { status: 400 },
      );
    }

    if (
      !category.isActive &&
      parsed.data.categoryId !== currentProduct.categoryId
    ) {
      return Response.json(
        { error: "Ürün yalnızca aktif bir kategoriye taşınabilir." },
        { status: 400 },
      );
    }
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: parsed.data,
  });

  revalidatePath("/");
  revalidatePath("/login");

  return Response.json({ product });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const { productId } = await params;
  const branch = await getActiveBranch(
    new URL(request.url).searchParams.get("branchId"),
  );
  if (!branch) {
    return Response.json({ error: "Seçilen şube bulunamadı veya pasif." }, { status: 404 });
  }

  const result = await prisma.product.deleteMany({
    where: { id: productId, category: { branchId: branch.id } },
  });

  if (result.count === 0) {
    return Response.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  revalidatePath("/");
  revalidatePath("/login");

  return Response.json({ success: true });
}
