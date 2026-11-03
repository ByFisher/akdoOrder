import { FolderKanban } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { CategoryManagement } from "@/components/admin/category-management";
import type { AdminBranch } from "@/lib/branch-types";
import type { MenuCategory } from "@/lib/menu-types";

export function CategoriesPage({
  activeBranch,
  branches,
  categories,
}: {
  activeBranch: AdminBranch;
  branches: AdminBranch[];
  categories: MenuCategory[];
}) {
  return (
    <AdminLayout
      activeBranchId={activeBranch.id}
      activePath="/login/categories"
      branches={branches}
    >
      <section className="mb-6">
        <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#96743c]">
          <FolderKanban size={14} />
          MENÜ DÜZENİ
        </div>
        <h1 className="font-editorial mt-2 text-4xl tracking-tight text-[#203d31]">
          Kategoriler
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#737a70]">
          {activeBranch.name} şubesinin ürünlerini gruplandırın ve menüsünü
          yönetin.
        </p>
      </section>
      <CategoryManagement branchId={activeBranch.id} categories={categories} />
    </AdminLayout>
  );
}
