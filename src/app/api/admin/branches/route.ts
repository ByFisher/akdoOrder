import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminBranches } from "@/lib/branches";
import { prisma } from "@/lib/prisma";
import { isValidTurkeyLocation } from "@/lib/turkey-locations";

const branchSchema = z.object({
  name: z.string().trim().min(2).max(80),
  city: z.string().trim().min(1).max(80),
  district: z.string().trim().min(1).max(80),
  address: z.string().trim().max(200).default(""),
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

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  return Response.json({ branches: await getAdminBranches() });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = branchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error:
          "Şube adı 2-80, geçerli bir Türkiye şehri ve ilçesi seçilmelidir.",
      },
      { status: 400 },
    );
  }

  if (!isValidTurkeyLocation(parsed.data.city, parsed.data.district)) {
    return Response.json(
      { error: "Seçilen ilçe, seçilen şehre ait değil." },
      { status: 400 },
    );
  }

  const slug = createSlug(parsed.data.name);
  if (!slug) {
    return Response.json(
      { error: "Şube adı geçerli harf veya rakam içermelidir." },
      { status: 400 },
    );
  }

  if (await prisma.branch.findUnique({ where: { slug }, select: { id: true } })) {
    return Response.json(
      { error: "Bu isimde bir şube zaten mevcut." },
      { status: 409 },
    );
  }

  const branch = await prisma.branch.create({
    data: { ...parsed.data, slug },
  });

  revalidatePath("/login");
  return Response.json({ branch }, { status: 201 });
}
