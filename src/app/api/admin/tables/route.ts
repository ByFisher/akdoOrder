import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getActiveBranch } from "@/lib/branches";
import { prisma } from "@/lib/prisma";

const tableSchema = z.object({
  name: z.string().trim().min(1).max(40),
  branchId: z.string().min(1),
});

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const branch = await getActiveBranch(
    new URL(request.url).searchParams.get("branchId"),
  );
  if (!branch) {
    return Response.json({ error: "Seçilen şube bulunamadı veya pasif." }, { status: 404 });
  }

  const tables = await prisma.diningTable.findMany({
    where: { branchId: branch.id },
    orderBy: { name: "asc" },
  });
  return Response.json({ tables });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = tableSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Masa adı 1-40 karakter olmalıdır." }, { status: 400 });
  }

  const branch = await getActiveBranch(parsed.data.branchId);
  if (!branch) {
    return Response.json({ error: "Seçilen şube bulunamadı veya pasif." }, { status: 404 });
  }

  const existing = await prisma.diningTable.findUnique({
    where: {
      branchId_name: { branchId: branch.id, name: parsed.data.name },
    },
    select: { id: true },
  });
  if (existing) {
    return Response.json({ error: "Bu şubede aynı isimle bir masa zaten var." }, { status: 409 });
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const collision = await prisma.diningTable.findUnique({
      where: { code },
      select: { id: true },
    });
    if (collision) continue;

    try {
      const table = await prisma.diningTable.create({
        data: { name: parsed.data.name, code, branchId: branch.id },
      });
      revalidatePath("/login/tables");
      return Response.json({ table }, { status: 201 });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return Response.json(
          { error: "Masa adı veya kodu çakıştı. Lütfen yeniden deneyin." },
          { status: 409 },
        );
      }
      throw error;
    }
  }

  return Response.json(
    { error: "Benzersiz masa kodu üretilemedi. Lütfen tekrar deneyin." },
    { status: 503 },
  );
}
