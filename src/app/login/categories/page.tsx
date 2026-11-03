import {
  AdminLoading,
  LoginSectionPage,
} from "@/app/login/section-page";
import { Suspense } from "react";

export default function CategoriesPage(
  props: PageProps<"/login/categories">,
) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <CategoriesContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function CategoriesContent({
  searchParams,
}: {
  searchParams: PageProps<"/login/categories">["searchParams"];
}) {
  const { branchId } = await searchParams;

  return (
    <LoginSectionPage
      path="/login/categories"
      requestedBranchId={
        typeof branchId === "string" ? branchId : undefined
      }
      section="categories"
    />
  );
}
