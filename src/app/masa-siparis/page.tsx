import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { TableOrderPage } from "@/components/orders/table-order-page";
import { getCurrentMember } from "@/lib/member-auth";

export default function TableOrderRoute() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#f5f3ed]">
          <div className="size-9 animate-spin rounded-full border-2 border-[#eadfc9] border-t-[#a67a36]" />
        </main>
      }
    >
      <TableOrderContent />
    </Suspense>
  );
}

async function TableOrderContent() {
  await connection();
  const member = await getCurrentMember();
  if (!member) {
    redirect("/uye?returnTo=%2Fmasa-siparis");
  }

  return (
    <TableOrderPage
      member={{
        memberNumber: member.memberNumber,
        firstName: member.firstName,
        lastName: member.lastName,
        balance: member.balance,
      }}
    />
  );
}
