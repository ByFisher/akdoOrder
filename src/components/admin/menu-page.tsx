import { IceCreamCone } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { MenuManagement } from "@/components/admin/menu-management";
import type { AdminBranch } from "@/lib/branch-types";
import type { MenuCategory } from "@/lib/menu-types";

interface MenuProductSummary {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  allergens: string;
  price: number;
  stock: number;
  isActive: boolean;
  featured: boolean;
  category: { id: string; name: string };
}

export function MenuPage({
  activeBranch,
  branches,
  categories,
  products,
}: {
  activeBranch: AdminBranch;
  branches: AdminBranch[];
  categories: MenuCategory[];
  products: MenuProductSummary[];
}) {
  return (
    <AdminLayout
      activeBranchId={activeBranch.id}
      activePath="/login/menu"
      branches={branches}
    >
      <section className="mb-6">
        <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#96743c]">
          <IceCreamCone size={14} />
          ÜRÜN YÖNETİMİ
        </div>
        <h1 className="font-editorial mt-2 text-4xl tracking-tight text-[#203d31]">
          Menü
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#737a70]">
          {activeBranch.name} şubesinin ürünlerini ve menüsünü düzenleyin.
        </p>
      </section>
      <MenuManagement
        branchId={activeBranch.id}
        categories={categories}
        products={products}
      />
    </AdminLayout>
  );
}
