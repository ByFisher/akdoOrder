import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createStaffSession,
  isStaffConfigured,
  STAFF_COOKIE,
  staffCookieOptions,
  verifyStaffCredentials,
} from "@/lib/staff-auth";
import { verifyMemberPassword } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  role: z.enum(["chef", "waiter"]),
  username: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Kullanıcı adı ve parola girin." }, { status: 400 });
  }

  const { role, username, password } = parsed.data;
  const normalizedUsername = username.trim().toLocaleLowerCase("tr-TR");
  const employee = await prisma.staffAccount.findUnique({
    where: { username: normalizedUsername },
  });
  if (
    employee
      ? employee.role !== role ||
        !employee.isActive ||
        !(await verifyMemberPassword(password, employee.passwordHash))
      : !isStaffConfigured(role) ||
        !verifyStaffCredentials(role, username, password)
  ) {
    if (!employee && !isStaffConfigured(role)) {
      return Response.json(
        { error: "Bu personel alanı henüz yapılandırılmamış." },
        { status: 503 },
      );
    }
    return Response.json(
      { error: "Kullanıcı adı veya parola hatalı ya da çalışan hesabı pasif." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true, role });
  response.cookies.set(STAFF_COOKIE, createStaffSession(role), staffCookieOptions());
  return response;
}
