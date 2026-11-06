"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ChefHat,
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRoundPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberDashboard } from "@/components/members/member-dashboard";
import type {
  MemberBalanceRecord,
  MemberBalanceRequestRecord,
  MemberOrderRecord,
  MemberProfile,
} from "@/lib/member-profile-types";

type Mode = "login" | "register";

function getError(body: unknown) {
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
}

export function MemberAccess({
  member,
  returnTo,
  balanceRequests,
  orders,
  transactions,
}: {
  member: MemberProfile | null;
  returnTo?: string;
  balanceRequests: MemberBalanceRequestRecord[];
  orders: MemberOrderRecord[];
  transactions: MemberBalanceRecord[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdMemberNumber, setCreatedMemberNumber] = useState("");
  const [createdUsername, setCreatedUsername] = useState("");

  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/members/logout", { method: "POST" });
      if (!response.ok) throw new Error("Üye oturumu kapatılamadı.");
      router.push("/uye");
      router.refresh();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Üye oturumu kapatılamadı.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCreatedMemberNumber("");
    setCreatedUsername("");
    const formData = new FormData(event.currentTarget);
    const data =
      mode === "login"
        ? {
            username: formData.get("username"),
            password: formData.get("password"),
          }
        : {
            username: formData.get("username"),
            firstName: formData.get("firstName"),
            lastName: formData.get("lastName"),
            phone: formData.get("phone"),
            password: formData.get("password"),
          };

    try {
      const response = await fetch(
        mode === "login" ? "/api/members/login" : "/api/members/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getError(body));
      if (mode === "register") {
        if (
          typeof body !== "object" ||
          body === null ||
          !("member" in body) ||
          typeof body.member !== "object" ||
          body.member === null ||
          !("memberNumber" in body.member) ||
          typeof body.member.memberNumber !== "string"
        ) {
          throw new Error("Üyelik oluşturuldu ancak üye numarası alınamadı.");
        }
        setCreatedMemberNumber(body.member.memberNumber);
        setCreatedUsername(String(formData.get("username") || ""));
      }
      router.push(returnTo || "/");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (member) {
    return (
      <MemberDashboard
        balanceRequests={balanceRequests}
        busy={busy}
        error={error}
        member={member}
        onLogout={logout}
        orders={orders}
        transactions={transactions}
      />
    );
  }

  if (returnTo && !member) {
    return (
      <main className="min-h-screen bg-[#f5f3ed] px-4 py-8 text-[#202c26] sm:px-8 sm:py-12">
        <section className="mx-auto max-w-md rounded-[26px] border border-[#e0e1d8] bg-[#fffefa] p-6 shadow-[0_16px_50px_#24372c10] sm:p-9">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-[#536454] hover:text-[#a67a32]"
            href="/uye"
          >
            <ArrowLeft size={16} />
            Giriş seçenekleri
          </Link>
          <span className="mt-6 grid size-12 place-items-center rounded-2xl bg-[#e9eee7] text-[#31513e]">
            {mode === "login" ? <KeyRound size={21} /> : <UserRoundPlus size={21} />}
          </span>
          <p className="mt-5 text-[10px] font-bold tracking-[0.2em] text-[#96743c]">
            AKDO ÜYELİK
          </p>
          <h1 className="font-editorial mt-2 text-3xl text-[#203d31]">
            {mode === "login" ? "Üye girişi" : "Üye ol"}
          </h1>
          <div className="mt-6 grid grid-cols-2 rounded-xl bg-[#f1f0e9] p-1">
            {(["login", "register"] as const).map((nextMode) => (
              <button
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  mode === nextMode
                    ? "bg-white text-[#203d31] shadow-sm"
                    : "text-[#737a70]"
                }`}
                key={nextMode}
                onClick={() => {
                  setMode(nextMode);
                  setError("");
                  setCreatedMemberNumber("");
                  setCreatedUsername("");
                }}
                type="button"
              >
                {nextMode === "login" ? "Giriş yap" : "Üye ol"}
              </button>
            ))}
          </div>
          {mode === "register" && createdMemberNumber && (
            <p className="mt-4 rounded-xl bg-[#e9eee7] px-4 py-3 text-sm text-[#31513e]">
              Üyeliğiniz oluşturuldu. Üye numaranız:{" "}
              <strong className="font-mono tracking-wider">{createdMemberNumber}</strong>
              {createdUsername && (
                <>
                  {" "}· Kullanıcı adınız:{" "}
                  <strong>{createdUsername}</strong>
                </>
              )}
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-xl bg-[#fff0ed] px-4 py-3 text-sm text-[#9c3d2d]" role="alert">
              {error}
            </p>
          )}
          <form className="mt-5 space-y-4" onSubmit={submit}>
            {mode === "register" ? (
              <>
                <label className="block space-y-2 text-sm font-medium text-[#405247]">
                  Ad
                  <Input className="h-11 rounded-xl border-[#dedfd5] bg-white px-4" maxLength={80} name="firstName" required />
                </label>
                <label className="block space-y-2 text-sm font-medium text-[#405247]">
                  Soyad
                  <Input className="h-11 rounded-xl border-[#dedfd5] bg-white px-4" maxLength={80} name="lastName" required />
                </label>
                <label className="block space-y-2 text-sm font-medium text-[#405247]">
                  Kullanıcı adı (en az 3 karakter)
                  <Input
                    autoComplete="username"
                    className="h-11 rounded-xl border-[#dedfd5] bg-white px-4"
                    maxLength={80}
                    minLength={3}
                    name="username"
                    required
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-[#405247]">
                  Telefon numarası <span className="text-[#8b9187]">(isteğe bağlı)</span>
                  <Input className="h-11 rounded-xl border-[#dedfd5] bg-white px-4" maxLength={30} name="phone" type="tel" />
                </label>
              </>
            ) : (
              <label className="block space-y-2 text-sm font-medium text-[#405247]">
                Kullanıcı adı
                <Input
                  autoComplete="username"
                  className="h-11 rounded-xl border-[#dedfd5] bg-white px-4"
                  maxLength={80}
                  name="username"
                  required
                />
              </label>
            )}
            <label className="block space-y-2 text-sm font-medium text-[#405247]">
              Parola{mode === "register" ? " (en az 8 karakter)" : ""}
              <Input
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="h-11 rounded-xl border-[#dedfd5] bg-white px-4"
                maxLength={200}
                minLength={mode === "register" ? 8 : undefined}
                name="password"
                required
                type="password"
              />
            </label>
            <Button className="h-11 w-full rounded-xl bg-[#203d31] text-[#fffaf2]" disabled={busy} type="submit">
              {busy ? "İşlem yapılıyor..." : mode === "login" ? "Giriş yap" : "Üye ol"}
            </Button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f3ed] px-4 py-8 text-[#202c26] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-[#536454] hover:text-[#a67a32]"
          href="/"
        >
          <ArrowLeft size={16} />
          Menüye dön
        </Link>
        <section className="mt-6">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#96743c]">AKDO SİPARİŞ SİSTEMİ</p>
          <h1 className="font-editorial mt-2 text-3xl text-[#203d31] sm:text-4xl">Üye alanı</h1>
        </section>
        <nav aria-label="Giriş seçenekleri" className="mt-6 grid gap-3">
          {[
            { href: "/uye?returnTo=%2F", label: "Misafir girişi", icon: Store },
            { href: "/akdosef", label: "AkdoŞef", icon: ChefHat },
            { href: "/akdogarson", label: "AkdoPersonel", icon: ShoppingBag },
            { href: "/login", label: "AkdoYönetim", icon: ShieldCheck },
            { href: "/login/kasa", label: "AkdoKasa", icon: LayoutDashboard },
          ].map((item) => {
            const Icon = item.icon;
            const destination =
              item.label === "Misafir girişi" && member ? "/" : item.href;
            return (
              <Link
                className="flex min-h-16 items-center justify-between rounded-2xl border border-[#dddcd2] bg-[#fffefa] px-5 text-base font-semibold text-[#405247] shadow-[0_8px_24px_#24372c0a] transition hover:-translate-y-0.5 hover:border-[#b6a274] hover:bg-white hover:shadow-[0_12px_30px_#24372c12]"
                href={destination}
                key={item.href}
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#edf0e8] text-[#96743c]">
                    <Icon size={19} />
                  </span>
                  {item.label}
                </span>
                <ArrowLeft className="rotate-180 text-[#a8aa9f]" size={17} />
              </Link>
            );
          })}
        </nav>
      </div>
    </main>
  );
}
