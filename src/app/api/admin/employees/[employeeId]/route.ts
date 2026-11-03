import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { hashMemberPassword } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

const employeeUpdateSchema = z
  .object({
    username: z.string().trim().min(3).max(80).optional(),
    password: z.string().min(8).max(200).optional(),
    role: z.enum(["chef", "waiter"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = employeeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Çalışan bilgilerini kontrol edin. Yeni parola en az 8 karakter olmalıdır." },
      { status: 400 },
    );
  }

  const { employeeId } = await params;
  const { password, ...employeeData } = parsed.data;
  try {
    const result = await prisma.staffAccount.updateMany({
      where: { id: employeeId },
      data: {
        ...employeeData,
        ...(employeeData.username
          ? {
              username: employeeData.username.toLocaleLowerCase("tr-TR"),
            }
          : {}),
        ...(password
          ? { passwordHash: await hashMemberPassword(password) }
          : {}),
      },
    });
    if (result.count === 0) {
      return Response.json({ error: "Çalışan bulunamadı." }, { status: 404 });
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "Bu kullanıcı adıyla bir çalışan zaten kayıtlı." },
        { status: 409 },
      );
    }
    throw error;
  }

  revalidatePath("/login/employees");
  return Response.json({ ok: true });
}
