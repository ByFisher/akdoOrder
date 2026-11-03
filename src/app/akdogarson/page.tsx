import { Suspense } from "react";
import { connection } from "next/server";
import { StaffPortal } from "@/components/orders/staff-portal";
import { getStaffRole } from "@/lib/staff-auth";

export default function AkdoWaiterPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#f1f0e9]">
          <div className="size-9 animate-spin rounded-full border-2 border-[#eadfc9] border-t-[#a67a36]" />
        </main>
      }
    >
      <WaiterContent />
    </Suspense>
  );
}

async function WaiterContent() {
  await connection();
  return <StaffPortal role="waiter" authenticatedRole={await getStaffRole()} />;
}
