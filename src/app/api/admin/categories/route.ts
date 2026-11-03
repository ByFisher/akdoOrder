import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getActiveBranch } from "@/lib/branches";
import { prisma } from "@/lib/prisma";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  icon: z.string().trim().min(1).max(12).default("✦"),
});

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
  const parsed = categorySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Kategori adı 2-60 karakter arasında olmalıdır." },
      { status: 400 },
    );
  }

  const slug = createSlug(parsed.data.name);

  if (!slug) {
    return Response.json(
      { error: "Kategori adı geçerli harf veya rakam içermelidir." },
      { status: 400 },
    );
  }

  if (
    await prisma.category.findFirst({
      where: { branchId: branch.id, slug },
      select: { id: true },
    })
  ) {
    return Response.json(
      { error: "Bu isimde bir kategori zaten mevcut." },
      { status: 409 },
    );
  }

  const lastCategory = await prisma.category.aggregate({
    where: { branchId: branch.id },
    _max: { sortOrder: true },
  });
  const category = await prisma.category.create({
    data: {
      ...parsed.data,
      slug,
      branchId: branch.id,
      sortOrder: (lastCategory._max.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/");
  revalidatePath("/login");

  return Response.json({ category }, { status: 201 });
}
