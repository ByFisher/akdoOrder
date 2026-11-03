import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getActiveBranch } from "@/lib/branches";
import { prisma } from "@/lib/prisma";

const categoryUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    icon: z.string().trim().min(1).max(12).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);

function createSlug(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const { categoryId } = await params;
  const branch = await getActiveBranch(
    new URL(request.url).searchParams.get("branchId"),
  );
  if (!branch) {
    return Response.json({ error: "Seçilen şube bulunamadı veya pasif." }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = categoryUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Kategori adı, simgesi veya durumu geçersiz." },
      { status: 400 },
    );
  }

  const currentCategory = await prisma.category.findFirst({
    where: { id: categoryId, branchId: branch.id },
    select: { id: true, slug: true },
  });

  if (!currentCategory) {
    return Response.json({ error: "Kategori bulunamadı." }, { status: 404 });
  }

  const data = { ...parsed.data };

  if (data.name !== undefined) {
    const slug = createSlug(data.name);

    if (!slug) {
      return Response.json(
        { error: "Kategori adı geçerli harf veya rakam içermelidir." },
        { status: 400 },
      );
    }

    const conflictingCategory = await prisma.category.findFirst({
      where: { slug, branchId: branch.id, id: { not: categoryId } },
      select: { id: true },
    });

    if (conflictingCategory) {
      return Response.json(
        { error: "Bu isimde bir kategori zaten mevcut." },
        { status: 409 },
      );
    }

    Object.assign(data, { slug });
  }

  const category = await prisma.category.update({
    where: { id: categoryId },
    data,
  });

  revalidatePath("/");
  revalidatePath("/login");

  return Response.json({ category });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const { categoryId } = await params;
  const branch = await getActiveBranch(
    new URL(request.url).searchParams.get("branchId"),
  );
  if (!branch) {
    return Response.json({ error: "Seçilen şube bulunamadı veya pasif." }, { status: 404 });
  }

  const result = await prisma.$transaction(async (transaction) => {
    const category = await transaction.category.findFirst({
      where: { id: categoryId, branchId: branch.id },
      select: { id: true, _count: { select: { products: true } } },
    });

    if (!category) {
      return { status: "missing" as const };
    }

    if (category._count.products > 0) {
      return { status: "has-products" as const };
    }

    await transaction.category.delete({ where: { id: categoryId } });
    return { status: "deleted" as const };
  });

  if (result.status === "missing") {
    return Response.json({ error: "Kategori bulunamadı." }, { status: 404 });
  }

  if (result.status === "has-products") {
    return Response.json(
      {
        error:
          "Bu kategoride ürünler var. Önce ürünleri silin veya başka kategoriye taşıyın.",
      },
      { status: 409 },
    );
  }

  revalidatePath("/");
  revalidatePath("/login");

  return Response.json({ success: true });
}
