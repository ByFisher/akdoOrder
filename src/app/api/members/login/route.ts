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
  username: z.string().trim().min(1).max(80).optional(),
  memberNumber: z.string().regex(/^\d{8}$/).optional(),
  password: z.string().min(1).max(200),
}).refine((value) => Boolean(value.username || value.memberNumber));

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Kullanıcı adı ve parolanızı girin." },
      { status: 400 },
    );
  }

  const username = parsed.data.username?.toLocaleLowerCase("tr-TR");
  const member = username
    ? await prisma.member.findUnique({ where: { username } })
    : null;
  const legacyMemberNumber =
    parsed.data.memberNumber ??
    (username && /^\d{8}$/.test(username) ? username : undefined);
  const legacyMember =
    member || !legacyMemberNumber
      ? null
      : await prisma.member.findUnique({
          where: { memberNumber: legacyMemberNumber },
        });
  const authenticatedMember = member ?? legacyMember;
  if (
    !authenticatedMember ||
    !authenticatedMember.isActive ||
    !(await verifyMemberPassword(
      parsed.data.password,
      authenticatedMember.passwordHash,
    ))
  ) {
    return Response.json(
      { error: "Kullanıcı adı veya parola hatalı." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    member: {
      id: authenticatedMember.id,
      memberNumber: authenticatedMember.memberNumber,
      username: authenticatedMember.username,
      firstName: authenticatedMember.firstName,
      lastName: authenticatedMember.lastName,
      balance: authenticatedMember.balance,
    },
  });
  response.cookies.set(
    MEMBER_COOKIE,
    createMemberSession(authenticatedMember.id),
    memberCookieOptions(),
  );
  return response;
}
