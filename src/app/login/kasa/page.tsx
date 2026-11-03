import { Suspense } from "react";
import {
  AdminLoading,
  LoginSectionPage,
} from "@/app/login/section-page";

export default function CashRegisterRoute(props: PageProps<"/login/kasa">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <CashRegisterContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function CashRegisterContent({
  searchParams,
}: {
  searchParams: PageProps<"/login/kasa">["searchParams"];
}) {
  const { branchId } = await searchParams;
  return (
    <LoginSectionPage
      path="/login/kasa"
      requestedBranchId={typeof branchId === "string" ? branchId : undefined}
      section="cash"
    />
  );
}
