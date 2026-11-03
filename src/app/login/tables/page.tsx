import { Suspense } from "react";
import {
  AdminLoading,
  LoginSectionPage,
} from "@/app/login/section-page";

export default function TablesPage(props: PageProps<"/login/tables">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <TablesContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function TablesContent({
  searchParams,
}: {
  searchParams: PageProps<"/login/tables">["searchParams"];
}) {
  const { branchId } = await searchParams;
  return (
    <LoginSectionPage
      path="/login/tables"
      requestedBranchId={typeof branchId === "string" ? branchId : undefined}
      section="tables"
    />
  );
}
