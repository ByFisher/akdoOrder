import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentMember } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  amount: z.number().int().min(10).max(100_000),
});

export async function POST(request: Request) {
  const member = await getCurrentMember();
  if (!member) {
    return Response.json({ error: "Üye girişi gerekli." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "10 ₺ ile 100.000 ₺ arasında tam sayı bir tutar girin." },
      { status: 400 },
    );
  }

  try {
    const balanceRequest = await prisma.memberBalanceRequest.create({
      data: {
        amount: parsed.data.amount,
        memberId: member.id,
        pendingMemberId: member.id,
      },
      select: { id: true, amount: true, status: true, createdAt: true },
    });

    return Response.json(
      {
        request: {
          ...balanceRequest,
          createdAt: balanceRequest.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "Bekleyen bir bakiye yükleme talebiniz zaten var." },
        { status: 409 },
      );
    }

    throw error;
  }
}
