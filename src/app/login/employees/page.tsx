import {
  AdminLoading,
  LoginSectionPage,
} from "@/app/login/section-page";
import { Suspense } from "react";

export default function EmployeesPage(props: PageProps<"/login/employees">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EmployeesContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function EmployeesContent({
  searchParams,
}: {
  searchParams: PageProps<"/login/employees">["searchParams"];
}) {
  const { branchId } = await searchParams;

  return (
    <LoginSectionPage
      path="/login/employees"
      requestedBranchId={
        typeof branchId === "string" ? branchId : undefined
      }
      section="employees"
    />
  );
}
