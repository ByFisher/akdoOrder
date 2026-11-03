import { connection } from "next/server";
import { MenuPage } from "@/components/menu/menu-page";
import { getPublicBranches } from "@/lib/branches";
import { getPublicMenu } from "@/lib/menu-data";
import { getCurrentMember } from "@/lib/member-auth";

export async function MenuContent({
  searchParams,
}: {
  searchParams?: Promise<{ branchId?: string | string[] }>;
}) {
  await connection();
  const { branchId } = searchParams ? await searchParams : {};
  const selectedBranchId =
    typeof branchId === "string" ? branchId : undefined;
  const [{ branch, categories, products }, branches, member] = await Promise.all([
    getPublicMenu(selectedBranchId),
    getPublicBranches(),
    getCurrentMember(),
  ]);

  return (
    <MenuPage
      branches={branches}
      categories={categories}
      products={products}
      selectedBranchId={branch.id}
      member={
        member
          ? {
              firstName: member.firstName,
              lastName: member.lastName,
              memberNumber: member.memberNumber,
              balance: member.balance,
            }
          : null
      }
      key={branch.id}
    />
  );
}
