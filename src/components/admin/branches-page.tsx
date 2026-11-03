import { MapPinned } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { BranchManagement } from "@/components/admin/branch-management";
import type { AdminBranch } from "@/lib/branch-types";

export function BranchesPage({
  activeBranchId,
  branches,
}: {
  activeBranchId: string;
  branches: AdminBranch[];
}) {
  return (
    <AdminLayout
      activeBranchId={activeBranchId}
      activePath="/login/branches"
      branches={branches}
    >
      <section className="mb-6">
        <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#96743c]">
          <MapPinned size={14} />
          İŞLETME YÖNETİMİ
        </div>
        <h1 className="font-editorial mt-2 text-4xl tracking-tight text-[#203d31]">
          Şubeler
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#737a70]">
          Şubelerinizi ekleyin ve her birinin kategori ve ürün menüsünü ayrı
          yönetin.
        </p>
      </section>
      <BranchManagement
        activeBranchId={activeBranchId}
        branches={branches}
      />
    </AdminLayout>
  );
}
