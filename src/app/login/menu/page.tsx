import {
  AdminLoading,
  LoginSectionPage,
} from "@/app/login/section-page";
import { Suspense } from "react";

export default function MenuPage(props: PageProps<"/login/menu">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <MenuContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function MenuContent({
  searchParams,
}: {
  searchParams: PageProps<"/login/menu">["searchParams"];
}) {
  const { branchId } = await searchParams;

  return (
    <LoginSectionPage
      path="/login/menu"
      requestedBranchId={
        typeof branchId === "string" ? branchId : undefined
      }
      section="menu"
    />
  );
}
