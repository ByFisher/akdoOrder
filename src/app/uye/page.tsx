import { Suspense } from "react";
import { connection } from "next/server";
import { MemberAccess } from "@/components/members/member-access";
import { getCurrentMember } from "@/lib/member-auth";
import type {
  MemberBalanceRecord,
  MemberBalanceRequestRecord,
  MemberOrderRecord,
} from "@/lib/member-profile-types";
import { prisma } from "@/lib/prisma";

export default function MemberPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#f5f3ed]">
          <div className="size-9 animate-spin rounded-full border-2 border-[#eadfc9] border-t-[#a67a36]" />
        </main>
      }
    >
      <MemberContent />
    </Suspense>
  );
}

async function MemberContent() {
  await connection();
  const member = await getCurrentMember();
  const [transactions, orders, balanceRequests] = member
    ? await Promise.all([
        prisma.memberBalanceTransaction.findMany({
          where: { memberId: member.id },
          select: {
            id: true,
            amount: true,
            description: true,
            createdAt: true,
            orderId: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.diningOrder.findMany({
          where: { memberId: member.id },
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            paymentStatus: true,
            paymentMethod: true,
            paidAt: true,
            table: { select: { name: true } },
            branch: { select: { name: true } },
            items: {
              select: { id: true, name: true, price: true, quantity: true },
              orderBy: { id: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
        prisma.memberBalanceRequest.findMany({
          where: { memberId: member.id },
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            reviewedAt: true,
            reviewNote: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ])
    : [[], [], []];

  return (
    <MemberAccess
      member={
        member
          ? {
              memberNumber: member.memberNumber,
              firstName: member.firstName,
              lastName: member.lastName,
              balance: member.balance,
            }
          : null
      }
      balanceRequests={balanceRequests.map((item): MemberBalanceRequestRecord => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        reviewedAt: item.reviewedAt?.toISOString() ?? null,
      }))}
      orders={orders.map((order): MemberOrderRecord => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() ?? null,
      }))}
      transactions={transactions.map((transaction): MemberBalanceRecord => ({
        ...transaction,
        createdAt: transaction.createdAt.toISOString(),
      }))}
    />
  );
}
