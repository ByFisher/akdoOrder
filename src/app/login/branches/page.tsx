import {
  AdminLoading,
  LoginSectionPage,
} from "@/app/login/section-page";
import { Suspense } from "react";

export default function BranchesPage(props: PageProps<"/login/branches">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <BranchesContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function BranchesContent({
  searchParams,
}: {
  searchParams: PageProps<"/login/branches">["searchParams"];
}) {
  const { branchId } = await searchParams;

  return (
    <LoginSectionPage
      path="/login/branches"
      requestedBranchId={
        typeof branchId === "string" ? branchId : undefined
      }
      section="branches"
    />
  );
}
