import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSession,
  isAdminConfigured,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçerli bir kullanıcı adı ve parola girin." },
      { status: 400 },
    );
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Yönetici kullanıcı adı ve parolası sunucuda yapılandırılmamış." },
      { status: 503 },
    );
  }

  if (
    !verifyAdminCredentials(parsed.data.username, parsed.data.password)
  ) {
    return NextResponse.json(
      { error: "Kullanıcı adı veya parola hatalı. Lütfen yeniden deneyin." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminSession(), adminCookieOptions());

  return response;
}
