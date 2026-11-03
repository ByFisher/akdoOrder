import { Suspense } from "react";
import {
  AdminLoading,
  LoginSectionPage,
} from "@/app/login/section-page";

export default function FinancialLedgerRoute(props: PageProps<"/login/defter">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <FinancialLedgerContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function FinancialLedgerContent({
  searchParams,
}: {
  searchParams: PageProps<"/login/defter">["searchParams"];
}) {
  const { branchId } = await searchParams;
  return (
    <LoginSectionPage
      path="/login/defter"
      requestedBranchId={typeof branchId === "string" ? branchId : undefined}
      section="ledger"
    />
  );
}
