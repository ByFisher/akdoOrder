import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createMemberSession,
  MEMBER_COOKIE,
  memberCookieOptions,
  verifyMemberPassword,
} from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  memberNumber: z.string().regex(/^\d{8}$/),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "8 haneli üye numarası ve parolanızı girin." },
      { status: 400 },
    );
  }

  const member = await prisma.member.findUnique({
    where: { memberNumber: parsed.data.memberNumber },
  });
  if (
    !member ||
    !member.isActive ||
    !(await verifyMemberPassword(parsed.data.password, member.passwordHash))
  ) {
    return Response.json(
      { error: "Üye numarası veya parola hatalı." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    member: {
      id: member.id,
      memberNumber: member.memberNumber,
      firstName: member.firstName,
      lastName: member.lastName,
      balance: member.balance,
    },
  });
  response.cookies.set(
    MEMBER_COOKIE,
    createMemberSession(member.id),
    memberCookieOptions(),
  );
  return response;
}
