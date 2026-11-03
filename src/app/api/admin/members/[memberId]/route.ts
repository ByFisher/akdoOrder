import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { hashMemberPassword } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

const memberUpdateSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    phone: z.string().trim().max(30).optional(),
    password: z.string().min(8).max(200).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = memberUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Üye bilgilerini kontrol edin. Yeni parola en az 8 karakter olmalıdır." },
      { status: 400 },
    );
  }

  const { memberId } = await params;
  const { password, phone, ...memberData } = parsed.data;
  const data = {
    ...memberData,
    ...(phone !== undefined ? { phone: phone || null } : {}),
    ...(password ? { passwordHash: await hashMemberPassword(password) } : {}),
  };
  const result = await prisma.member.updateMany({
    where: { id: memberId },
    data,
  });
  if (result.count === 0) {
    return Response.json({ error: "Üye bulunamadı." }, { status: 404 });
  }

  revalidatePath("/login/users");
  return Response.json({ ok: true });
}
