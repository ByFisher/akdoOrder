import { Suspense } from "react";
import {
  AdminLoading,
  LoginSectionPage,
} from "@/app/login/section-page";

export default function UsersPage(props: PageProps<"/login/users">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <UsersContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function UsersContent({
  searchParams,
}: {
  searchParams: PageProps<"/login/users">["searchParams"];
}) {
  const { branchId } = await searchParams;
  return (
    <LoginSectionPage
      path="/login/users"
      requestedBranchId={typeof branchId === "string" ? branchId : undefined}
      section="users"
    />
  );
}
