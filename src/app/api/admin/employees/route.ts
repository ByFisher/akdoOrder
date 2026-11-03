import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { hashMemberPassword } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

const employeeSchema = z.object({
  username: z.string().trim().min(3).max(80),
  password: z.string().min(8).max(200),
  role: z.enum(["chef", "waiter"]),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const employees = await prisma.staffAccount.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { username: "asc" }],
  });
  return Response.json({ employees });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Kullanıcı adı en az 3, parola en az 8 karakter olmalıdır." },
      { status: 400 },
    );
  }

  try {
    const employee = await prisma.staffAccount.create({
      data: {
        username: parsed.data.username.toLocaleLowerCase("tr-TR"),
        role: parsed.data.role,
        passwordHash: await hashMemberPassword(parsed.data.password),
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    revalidatePath("/login/employees");
    return Response.json({ employee }, { status: 201 });
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
}
