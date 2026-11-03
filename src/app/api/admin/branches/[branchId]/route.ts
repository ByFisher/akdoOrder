import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { DEFAULT_BRANCH_ID } from "@/lib/branches";
import { prisma } from "@/lib/prisma";
import { isValidTurkeyLocation } from "@/lib/turkey-locations";

const branchUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    city: z.string().trim().max(80).optional(),
    district: z.string().trim().max(80).optional(),
    address: z.string().trim().max(200).optional(),
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
  { params }: { params: Promise<{ branchId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const { branchId } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = branchUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Şube bilgilerini kontrol edip tekrar deneyin." },
      { status: 400 },
    );
  }

  if (branchId === DEFAULT_BRANCH_ID && parsed.data.isActive === false) {
    return Response.json(
      { error: "Varsayılan şube pasif yapılamaz." },
      { status: 400 },
    );
  }

  const currentBranch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { id: true, city: true, district: true },
  });
  if (!currentBranch) {
    return Response.json({ error: "Şube bulunamadı." }, { status: 404 });
  }

  if (parsed.data.city !== undefined || parsed.data.district !== undefined) {
    const city = parsed.data.city ?? currentBranch.city;
    const district = parsed.data.district ?? currentBranch.district;
    if (!isValidTurkeyLocation(city, district)) {
      return Response.json(
        { error: "Geçerli bir şehir ve o şehre ait ilçe seçin." },
        { status: 400 },
      );
    }
  }

  const data = { ...parsed.data };
  if (data.name !== undefined) {
    const slug = createSlug(data.name);
    if (!slug) {
      return Response.json(
        { error: "Şube adı geçerli harf veya rakam içermelidir." },
        { status: 400 },
      );
    }

    const conflictingBranch = await prisma.branch.findFirst({
      where: { slug, id: { not: branchId } },
      select: { id: true },
    });
    if (conflictingBranch) {
      return Response.json(
        { error: "Bu isimde bir şube zaten mevcut." },
        { status: 409 },
      );
    }

    Object.assign(data, { slug });
  }

  const branch = await prisma.branch.update({
    where: { id: branchId },
    data,
  });
  revalidatePath("/login");

  return Response.json({ branch });
}
