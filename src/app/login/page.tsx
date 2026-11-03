import { Suspense } from "react";
import { AdminContent } from "@/app/login/admin-content";
import { AdminLoading } from "@/app/login/section-page";

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <LoginContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { branchId } = await searchParams;

  return (
    <AdminContent
      redirectTo={
        typeof branchId === "string"
          ? `/login?branchId=${encodeURIComponent(branchId)}`
          : "/login"
      }
      requestedBranchId={
        typeof branchId === "string" ? branchId : undefined
      }
    />
  );
}
