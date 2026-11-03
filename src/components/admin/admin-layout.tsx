"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ExternalLink,
  Banknote,
  BookOpenText,
  FolderKanban,
  IceCreamCone,
  LayoutDashboard,
  LogOut,
  Menu,
  MapPinned,
  QrCode,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { Avatar, Chip } from "@heroui/react";
import managementLogo from "../../../img/logo/akdoyonetim.jpg";
import type { AdminBranch } from "@/lib/branch-types";

const navigation = [
  { label: "Genel Bakış", href: "/login", icon: LayoutDashboard },
  { label: "Şubeler", href: "/login/branches", icon: MapPinned },
  { label: "Kategoriler", href: "/login/categories", icon: FolderKanban },
  { label: "Menü", href: "/login/menu", icon: IceCreamCone },
  { label: "Masa kodları", href: "/login/tables", icon: QrCode },
  { label: "Kullanıcılar", href: "/login/users", icon: UserRound },
  { label: "AkdoKasa", href: "/login/kasa", icon: Banknote },
  { label: "Finans defteri", href: "/login/defter", icon: BookOpenText },
  { label: "Çalışanlar", href: "/login/employees", icon: Users },
];

export function AdminLayout({
  activePath,
  activeBranchId,
  branches,
  children,
}: {
  activePath: string;
  activeBranchId: string;
  branches: AdminBranch[];
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const router = useRouter();
  const activeBranch = branches.find((branch) => branch.id === activeBranchId);

  function branchHref(href: string) {
    return `${href}?branchId=${encodeURIComponent(activeBranchId)}`;
  }

  function selectBranch(branchId: string) {
    router.push(`${activePath}?branchId=${encodeURIComponent(branchId)}`);
  }

  async function handleLogout() {
    setLogoutError("");
    setLoggingOut(true);

    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });

      if (!response.ok) {
        throw new Error("Oturum kapatılamadı.");
      }

      router.push("/login");
      router.refresh();
    } catch {
      setLogoutError("Oturum kapatılamadı. Lütfen yeniden deneyin.");
      setLoggingOut(false);
    }
  }

  function renderNavigation() {
    return (
      <nav aria-label="Yönetim menüsü" className="space-y-1">
        <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.17em] text-white/35">
          ÇALIŞMA ALANI
        </p>
        {navigation.map(({ label, href, icon: Icon }) => {
          const isActive = activePath === href;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                isActive
                  ? "bg-[#e2c47e]/15 text-[#f0d998]"
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
              }`}
              href={branchHref(href)}
              key={label}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon
                className={
                  isActive
                    ? "text-[#e2c47e]"
                    : "text-white/40 group-hover:text-[#e2c47e]"
                }
                size={17}
                strokeWidth={1.8}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <main className="min-h-screen bg-[#f1f0e9] text-[#202c26]">
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-white/10 px-4 py-5 text-white lg:flex">
        <Link className="mb-9 flex items-center gap-3 px-2" href="/">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
            <Image
              alt="Akdo Yönetim"
              className="h-full w-full object-contain"
              priority
              src={managementLogo}
            />
          </div>
          <div className="leading-none">
            <p className="mt-1.5 text-[9px] tracking-[0.19em] text-white/45">
              YÖNETİM MERKEZİ
            </p>
          </div>
        </Link>

        {renderNavigation()}

        <div className="mt-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#e2c47e]">
              <span className="size-2 rounded-full bg-[#b7c58e]" />
              Her şey yolunda
            </div>
            <p className="mt-2 text-[11px] leading-5 text-white/50">
              Menü değişiklikleriniz anında yayına alınır.
            </p>
          </div>
          <button
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] text-white/60 transition hover:bg-white/[0.06] hover:text-[#f1c2ad]"
            disabled={loggingOut}
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={17} />
            {loggingOut ? "Çıkış yapılıyor" : "Oturumu kapat"}
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Menüyü kapat"
            className="absolute inset-0 bg-[#12231b]/55 backdrop-blur-[3px]"
            onClick={() => setSidebarOpen(false)}
            type="button"
          />
          <aside
            aria-label="Yönetim menüsü"
            className="admin-sidebar relative flex h-full w-[min(84vw,300px)] flex-col border-r border-white/10 px-4 py-5 text-white shadow-2xl"
            id="admin-mobile-sidebar"
          >
            <div className="mb-8 flex items-center justify-between">
              <Link className="flex items-center gap-3 px-2" href="/">
                <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
                  <Image
                    alt="Akdo Yönetim"
                    className="h-full w-full object-contain"
                    priority
                    src={managementLogo}
                  />
                </div>
                <span className="text-[9px] tracking-[0.19em] text-white/55">
                  YÖNETİM MERKEZİ
                </span>
              </Link>
              <button
                aria-label="Menüyü kapat"
                className="grid size-9 place-items-center rounded-full text-white/70 hover:bg-white/10"
                onClick={() => setSidebarOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            {renderNavigation()}
            <button
              className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/70 hover:bg-white/[0.06]"
              disabled={loggingOut}
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={17} />
              Oturumu kapat
            </button>
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-[264px]">
        <header className="sticky top-0 z-20 border-b border-[#e1e2d9] bg-[#faf9f5]/92 backdrop-blur-xl">
          <div className="flex min-h-[68px] flex-wrap items-center justify-between gap-y-2 px-3 py-2 sm:flex-nowrap sm:px-7 sm:py-0 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                aria-controls="admin-mobile-sidebar"
                aria-expanded={sidebarOpen}
                aria-label={sidebarOpen ? "Menüyü kapat" : "Menüyü aç"}
                className="grid size-9 place-items-center rounded-xl border border-[#dde0d6] bg-white text-[#3d5945] transition hover:border-[#bd9856] lg:hidden"
                onClick={() => setSidebarOpen((open) => !open)}
                type="button"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-[10px] font-medium tracking-[0.12em] text-[#8b9187]">
                  AKDO / YÖNETİM
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#273b30]">
                  {navigation.find((item) => item.href === activePath)?.label}
                </p>
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
              <label className="flex items-center gap-2">
                <span className="sr-only">Yönetilecek şube</span>
                <select
                  aria-label="Yönetilecek şube"
                  className="h-9 max-w-[min(62vw,220px)] rounded-xl border border-[#dde0d6] bg-white px-2 text-xs font-medium text-[#405846] sm:max-w-[220px] sm:px-3"
                  onChange={(event) => selectBranch(event.target.value)}
                  value={activeBranchId}
                >
                  {branches
                    .filter((branch) => branch.isActive)
                    .map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                </select>
                {activeBranch?.isDefault && (
                  <span className="hidden text-[10px] text-[#858b80] xl:inline">
                    Ziyaretçi menüsü
                  </span>
                )}
              </label>
              <Chip className="hidden rounded-full border border-[#dce4d8] bg-[#edf2e9] px-2.5 text-[#436149] sm:inline-flex" size="sm" variant="soft">
                <span className="mr-1 inline-block size-1.5 rounded-full bg-[#668c67]" />
                <Chip.Label className="text-[10px] font-medium">Sistem aktif</Chip.Label>
              </Chip>
              <div               className="hidden items-center gap-2 border-l border-[#e3e3da] pl-3 sm:flex">
                <Avatar
                  aria-label="Yönetici profili"
                  className="size-9 rounded-full border border-[#d6c18a] bg-[#eee5d0] text-xs text-[#304d3c]"
                  color="default"
                  size="sm"
                  variant="soft"
                >
                  <Avatar.Fallback>AK</Avatar.Fallback>
                </Avatar>
                <span className="text-xs font-medium text-[#526055]">Yönetici</span>
              </div>
              <Link
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#dfe1d7] bg-white px-3 text-xs font-semibold text-[#405846] transition hover:border-[#bd9856] hover:bg-[#fbf8f0]"
                href="/"
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">QR menüyü gör</span>
                <span className="sm:hidden">Menü</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] px-4 pb-10 pt-7 sm:px-7 sm:pt-9 lg:px-10 lg:pt-10">
          {children}
        </div>

        {logoutError && (
          <p
            className="px-4 pb-4 text-sm text-[#a63e35] sm:px-7 lg:px-10"
            role="alert"
          >
            {logoutError}
          </p>
        )}

        <footer className="border-t border-[#e0e1d8] px-4 py-5 text-center text-[10px] text-[#858b80] sm:px-7 lg:px-10">
          Akdo Dondurma · Kahramanmaraş
        </footer>
      </div>
    </main>
  );
}
