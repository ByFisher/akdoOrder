import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const tableSchema = z.object({ isActive: z.boolean() });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const { tableId } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = tableSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Masa durumunu kontrol edin." }, { status: 400 });
  }

  const result = await prisma.diningTable.updateMany({
    where: { id: tableId },
    data: { isActive: parsed.data.isActive },
  });
  if (result.count === 0) {
    return Response.json({ error: "Masa bulunamadı." }, { status: 404 });
  }

  revalidatePath("/login/tables");
  return Response.json({ ok: true });
}
