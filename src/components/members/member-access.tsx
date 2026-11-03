"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, KeyRound, UserRoundPlus } from "lucide-react";
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
  balanceRequests,
  orders,
  transactions,
}: {
  member: MemberProfile | null;
  balanceRequests: MemberBalanceRequestRecord[];
  orders: MemberOrderRecord[];
  transactions: MemberBalanceRecord[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdMemberNumber, setCreatedMemberNumber] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCreatedMemberNumber("");
    const formData = new FormData(event.currentTarget);
    const data =
      mode === "login"
        ? {
            memberNumber: formData.get("memberNumber"),
            password: formData.get("password"),
          }
        : {
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
      }
      router.push("/");
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

  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/members/logout", { method: "POST" });
      if (!response.ok) throw new Error("Üye oturumu kapatılamadı.");
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

  if (member) {
    return (
      <MemberDashboard
        balanceRequests={balanceRequests}
        busy={busy}
        error={error}
        member={member}
        onLogout={() => void logout()}
        orders={orders}
        transactions={transactions}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f3ed] px-4 py-8 text-[#202c26] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-lg">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-[#536454] hover:text-[#a67a32]"
          href="/"
        >
          <ArrowLeft size={16} />
          Menüye dön
        </Link>
        <section className="mt-6 rounded-[26px] border border-[#e0e1d8] bg-[#fffefa] p-6 shadow-[0_16px_50px_#24372c10] sm:p-9">
          <>
              <span className="grid size-12 place-items-center rounded-2xl bg-[#e9eee7] text-[#31513e]">
                {mode === "login" ? <KeyRound size={21} /> : <UserRoundPlus size={21} />}
              </span>
              <p className="mt-5 text-[10px] font-bold tracking-[0.2em] text-[#96743c]">
                AKDO ÜYELİK
              </p>
              <h1 className="font-editorial mt-2 text-3xl text-[#203d31]">
                {mode === "login" ? "Üye girişi" : "Üye ol"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#737a70]">
                Üye numaranızla giriş yapın; masadan sipariş verirken mevcut
                bakiyenizi kullanın.
              </p>
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
                  <strong className="font-mono tracking-wider">
                    {createdMemberNumber}
                  </strong>
                </p>
              )}
              <form className="mt-5 space-y-4" onSubmit={submit}>
                {mode === "register" ? (
                  <>
                    <label className="block space-y-2 text-sm font-medium text-[#405247]">
                      Ad
                      <Input
                        autoComplete="given-name"
                        className="h-11 rounded-xl border-[#dedfd5] bg-white px-4"
                        maxLength={80}
                        name="firstName"
                        required
                      />
                    </label>
                    <label className="block space-y-2 text-sm font-medium text-[#405247]">
                      Soyad
                      <Input
                        autoComplete="family-name"
                        className="h-11 rounded-xl border-[#dedfd5] bg-white px-4"
                        maxLength={80}
                        name="lastName"
                        required
                      />
                    </label>
                    <label className="block space-y-2 text-sm font-medium text-[#405247]">
                      Telefon numarası <span className="text-[#8b9187]">(isteğe bağlı)</span>
                      <Input
                        autoComplete="tel"
                        className="h-11 rounded-xl border-[#dedfd5] bg-white px-4"
                        maxLength={30}
                        name="phone"
                        type="tel"
                      />
                    </label>
                  </>
                ) : (
                  <label className="block space-y-2 text-sm font-medium text-[#405247]">
                    8 haneli üye numarası
                    <Input
                      autoComplete="username"
                      className="h-11 rounded-xl border-[#dedfd5] bg-white px-4 font-mono tracking-widest"
                      inputMode="numeric"
                      maxLength={8}
                      name="memberNumber"
                      pattern="\d{8}"
                      required
                    />
                  </label>
                )}
                <label className="block space-y-2 text-sm font-medium text-[#405247]">
                  Parola{mode === "register" ? " (en az 8 karakter)" : ""}
                  <Input
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    className="h-11 rounded-xl border-[#dedfd5] bg-white px-4"
                    maxLength={200}
                    minLength={mode === "register" ? 8 : undefined}
                    name="password"
                    required
                    type="password"
                  />
                </label>
                {error && <p className="text-sm text-[#a63e35]" role="alert">{error}</p>}
                <Button
                  className="h-12 w-full rounded-xl bg-[#203d31] text-white hover:bg-[#2d5542]"
                  disabled={busy}
                  type="submit"
                >
                  {busy
                    ? "İşleminiz yapılıyor..."
                    : mode === "login"
                      ? "Üye girişi yap"
                      : "Üyeliğimi oluştur"}
                </Button>
              </form>
          </>
        </section>
      </div>
    </main>
  );
}
