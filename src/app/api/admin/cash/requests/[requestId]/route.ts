import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().trim().max(200).default(""),
});

const inactiveMemberError = "AKDO_CASH_MEMBER_INACTIVE";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Bakiye talebi bilgilerini kontrol edin." }, { status: 400 });
  }

  const { requestId } = await params;
  const reviewedBy = process.env.ADMIN_USERNAME?.trim() || "Yönetim";

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const balanceRequest = await transaction.memberBalanceRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          amount: true,
          status: true,
          memberId: true,
          member: { select: { isActive: true } },
        },
      });
      if (!balanceRequest) return { status: "NOT_FOUND" as const };
      if (balanceRequest.status !== "PENDING") {
        return { status: "ALREADY_REVIEWED" as const };
      }

      const updatedRequest = await transaction.memberBalanceRequest.updateMany({
        where: { id: requestId, status: "PENDING" },
        data: {
          status: parsed.data.status,
          reviewedAt: new Date(),
          reviewedBy,
          reviewNote: parsed.data.reviewNote,
          pendingMemberId: null,
        },
      });
      if (updatedRequest.count === 0) {
        return { status: "ALREADY_REVIEWED" as const };
      }

      if (parsed.data.status === "APPROVED") {
        const memberUpdate = await transaction.member.updateMany({
          where: { id: balanceRequest.memberId, isActive: true },
          data: { balance: { increment: balanceRequest.amount } },
        });
        if (memberUpdate.count === 0) throw new Error(inactiveMemberError);

        await transaction.memberBalanceTransaction.create({
          data: {
            memberId: balanceRequest.memberId,
            amount: balanceRequest.amount,
            description: `AkdoKasa bakiye yükleme · Talep ${balanceRequest.id}`,
            balanceRequestId: balanceRequest.id,
          },
        });
      }

      return { status: "UPDATED" as const };
    });

    if (result.status === "NOT_FOUND") {
      return Response.json({ error: "Bakiye talebi bulunamadı." }, { status: 404 });
    }
    if (result.status === "ALREADY_REVIEWED") {
      return Response.json(
        { error: "Bu bakiye talebi daha önce değerlendirilmiş." },
        { status: 409 },
      );
    }

    return Response.json({ ok: true, status: parsed.data.status });
  } catch (error) {
    if (error instanceof Error && error.message === inactiveMemberError) {
      return Response.json(
        { error: "Pasif üyenin bakiye talebi onaylanamaz." },
        { status: 409 },
      );
    }
    throw error;
  }
}
