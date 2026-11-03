import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createMemberNumber,
  createMemberSession,
  hashMemberPassword,
  MEMBER_COOKIE,
  memberCookieOptions,
} from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).default(""),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Ad, soyad ve en az 8 karakterli bir parola girin." },
      { status: 400 },
    );
  }

  const passwordHash = await hashMemberPassword(parsed.data.password);
  const memberData = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone: parsed.data.phone,
  };
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const memberNumber = createMemberNumber().toString().padStart(8, "0");
    try {
      const member = await prisma.member.create({
        data: {
          ...memberData,
          phone: memberData.phone || null,
          passwordHash,
          memberNumber,
        },
        select: {
          id: true,
          memberNumber: true,
          firstName: true,
          lastName: true,
          balance: true,
        },
      });
      const response = NextResponse.json({ member }, { status: 201 });
      response.cookies.set(
        MEMBER_COOKIE,
        createMemberSession(member.id),
        memberCookieOptions(),
      );
      return response;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  return Response.json(
    { error: "Üye numarası oluşturulamadı. Lütfen yeniden deneyin." },
    { status: 503 },
  );
}
