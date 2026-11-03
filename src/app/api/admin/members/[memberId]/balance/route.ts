import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const balanceSchema = z.object({
  direction: z.enum(["CREDIT", "DEBIT"]),
  amount: z.number().int().min(1).max(100_000_000),
  description: z.string().trim().min(1).max(200),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = balanceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Bakiye işlemi için geçerli tutar ve açıklama girin." },
      { status: 400 },
    );
  }

  const { memberId } = await params;
  const amount =
    parsed.data.direction === "CREDIT"
      ? parsed.data.amount
      : -parsed.data.amount;
  const result = await prisma.$transaction(async (transaction) => {
    const memberUpdate = await transaction.member.updateMany({
      where: {
        id: memberId,
        ...(amount < 0 ? { balance: { gte: -amount } } : {}),
      },
      data: { balance: { increment: amount } },
    });
    if (memberUpdate.count === 0) return null;

    await transaction.memberBalanceTransaction.create({
      data: {
        memberId,
        amount,
        description: parsed.data.description,
      },
    });
    return transaction.member.findUnique({
      where: { id: memberId },
      select: { balance: true },
    });
  });

  if (!result) {
    const memberExists = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });
    return memberExists
      ? Response.json({ error: "Bakiye yetersiz." }, { status: 409 })
      : Response.json({ error: "Üye bulunamadı." }, { status: 404 });
  }

  revalidatePath("/login/users");
  return Response.json({ balance: result.balance });
}
