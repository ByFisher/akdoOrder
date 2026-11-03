import Link from "next/link";
import {
  ArrowDownRight,
  CircleHelp,
  FolderKanban,
  IceCreamCone,
  PackageCheck,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { MenuAiAssistant } from "@/components/admin/menu-ai-assistant";
import type { AdminBranch } from "@/lib/branch-types";

interface AdminPanelProps {
  activeBranch: AdminBranch;
  branches: AdminBranch[];
  productCount: number;
  categoryCount: number;
  visibleCount: number;
  outOfStockCount: number;
}

export function AdminPanel({
  activeBranch,
  branches,
  productCount,
  categoryCount,
  visibleCount,
  outOfStockCount,
}: AdminPanelProps) {
  const statCards = [
    {
      label: "Toplam ürün",
      value: productCount,
      hint: "Menüdeki ürünler",
      icon: IceCreamCone,
      color: "bg-[#e9eee7] text-[#31513e]",
    },
    {
      label: "Kategoriler",
      value: categoryCount,
      hint: "Menü grupları",
      icon: FolderKanban,
      color: "bg-[#f3eddd] text-[#96743c]",
    },
    {
      label: "Yayında",
      value: visibleCount,
      hint: "Ziyaretçiler görebilir",
      icon: PackageCheck,
      color: "bg-[#e7efeb] text-[#4c7560]",
    },
    {
      label: "Stokta yok",
      value: outOfStockCount,
      hint: "Kontrol edilmesi gereken",
      icon: CircleHelp,
      color: "bg-[#f8ece8] text-[#b16f5c]",
    },
  ];

  return (
    <AdminLayout
      activeBranchId={activeBranch.id}
      activePath="/login"
      branches={branches}
    >
      <section className="relative overflow-hidden rounded-[26px] border border-[#31513e] bg-[#203d31] px-6 py-7 text-white shadow-[0_16px_40px_#203d3126] sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-10 -top-24 size-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-16 size-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-28 right-40 size-64 rounded-full bg-[#e2c47e]/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-semibold tracking-[0.13em] text-[#e2c47e]">
              AKDO YÖNETİM
            </div>
            <h1 className="font-editorial max-w-xl text-[32px] leading-tight tracking-[-0.025em] sm:text-[40px]">
              Menünüzün kontrolü
              <br className="hidden sm:block" />{" "}
              <span className="italic text-[#e2c47e]">elinizde.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/65">
              {activeBranch.name} şubesinin menü durumunu buradan takip edin.
            </p>
          </div>
          <Link
            className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-[#e2c47e] px-4 text-sm font-semibold text-[#203d31] shadow-[0_8px_24px_#101e1733] transition hover:bg-[#f1dfaa]"
            href={`/login/menu?branchId=${encodeURIComponent(activeBranch.id)}`}
          >
            <ArrowDownRight size={16} />
            Menüye git
          </Link>
        </div>
      </section>

      <section
        aria-label="Menü özeti"
        className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {statCards.map(({ label, value, hint, icon: Icon, color }) => (
          <article
            className="rounded-[20px] border border-[#e2e2d9] bg-[#fffefa] p-4 shadow-[0_3px_15px_#28372d0a] sm:p-5"
            key={label}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[#898579]">{label}</p>
                <p className="font-editorial mt-2 text-[32px] leading-none text-[#3d3a32]">
                  {value}
                </p>
              </div>
              <span
                className={`grid size-10 place-items-center rounded-[14px] ${color}`}
              >
                <Icon size={18} strokeWidth={1.8} />
              </span>
            </div>
            <p className="mt-3 text-[10px] text-[#a09a8e]">{hint}</p>
          </article>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <p className="text-[10px] font-bold tracking-[0.16em] text-[#a67a36]">
            HIZLI YARDIM
          </p>
          <h2 className="font-editorial mt-1.5 text-2xl text-[#39362f]">
            Menü asistanı
          </h2>
        </div>
        <MenuAiAssistant branchId={activeBranch.id} key={activeBranch.id} />
      </section>
    </AdminLayout>
  );
}
