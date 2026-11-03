import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { MenuCheckoutPage } from "@/components/menu/menu-checkout-page";
import { MenuSkeleton } from "@/components/menu/menu-skeleton";
import { getPublicMenu } from "@/lib/menu-data";
import { getCurrentMember } from "@/lib/member-auth";

export default function CartPage(props: PageProps<"/sepet">) {
  return (
    <Suspense fallback={<MenuSkeleton />}>
      <CartContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function CartContent({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string | string[] }>;
}) {
  await connection();
  const member = await getCurrentMember();
  if (!member) redirect("/uye");

  const { branchId } = await searchParams;
  const selectedBranchId =
    typeof branchId === "string" ? branchId : undefined;
  const { branch, products } = await getPublicMenu(selectedBranchId);

  return (
    <MenuCheckoutPage
      branchId={branch.id}
      branchName={branch.name}
      member={{
        firstName: member.firstName,
        lastName: member.lastName,
        memberNumber: member.memberNumber,
        balance: member.balance,
      }}
      products={products}
    />
  );
}
