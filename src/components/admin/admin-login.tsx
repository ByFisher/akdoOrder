"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import managementLogo from "../../../img/logo/akdoyonetim.jpg";

export function AdminLogin({
  configured,
  redirectTo = "/login",
}: {
  configured: boolean;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Giriş yapılamadı.";
        setError(message);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f1f0e9] px-4 py-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:py-8">
      <section className="admin-sidebar relative hidden min-h-[calc(100vh-4rem)] overflow-hidden rounded-[28px] border border-white/10 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute -right-24 top-14 size-[420px] rounded-full border border-[#e2c47e]/20" />
        <div className="pointer-events-none absolute -right-10 top-28 size-[300px] rounded-full border border-[#e2c47e]/20" />
        <Link href="/" className="relative flex items-center gap-3 text-white">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
            <Image
              alt="Akdo Yönetim"
              className="h-full w-full object-contain"
              priority
              src={managementLogo}
            />
          </div>
          <span>
            <span className="mt-1 block text-[9px] tracking-[0.2em] text-white/45">YÖNETİM PANELİ</span>
          </span>
        </Link>
        <div className="relative max-w-xl pb-8">
          <p className="mb-5 text-[10px] font-semibold tracking-[0.22em] text-[#e2c47e]">GELENEKSEL LEZZET · MODERN YÖNETİM</p>
          <h1 className="font-editorial text-5xl leading-[1.08] tracking-tight text-[#fffdf6] xl:text-6xl">
            Lezzetin
            <br />
            <span className="italic text-[#e2c47e]">mutfağı burada.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
            Akdo&apos;nun menüsünü, kategorilerini ve lezzetlerini tek bir
            güvenli yerden yönetin.
          </p>
          <div className="gold-divider mt-10 w-40 opacity-80" />
        </div>
        <p className="relative text-xs text-white/45">Akdo Dondurma · Kahramanmaraş</p>
      </section>

      <div className="mx-auto flex w-full max-w-[430px] flex-col justify-center">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-3 text-[#203d31] lg:hidden"
        >
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#e0e1d8] bg-white">
            <Image
              alt="Akdo Yönetim"
              className="h-full w-full object-contain"
              priority
              src={managementLogo}
            />
          </div>
          <span>
            <span className="mt-1 block text-[9px] tracking-[0.2em] text-[#8a8b80]">
              YÖNETİM PANELİ
            </span>
          </span>
        </Link>

        <section className="rounded-[26px] border border-[#e0e1d8] bg-[#fffefa] p-7 shadow-[0_18px_60px_#24372c12] sm:p-9">
          <div className="grid size-12 place-items-center rounded-2xl bg-[#e9eee7] text-[#31513e]">
            <LockKeyhole size={21} />
          </div>
          <h1 className="font-editorial mt-5 text-3xl tracking-tight">
            Hoş geldiniz
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#737a70]">
            Menüyü yönetmek için yönetici bilgilerinizle giriş yapın.
          </p>

          {configured ? (
            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2 text-sm font-medium text-[#405247]">
                Kullanıcı adı
                <Input
                  autoComplete="username"
                  className="h-12 rounded-xl border-[#dedfd5] bg-white px-4"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="E-posta veya kullanıcı adı"
                  required
                  value={username}
                />
              </label>
              <label className="block space-y-2 text-sm font-medium text-[#405247]">
                Parola
                <Input
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-[#dedfd5] bg-white px-4"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Parolanızı girin"
                  required
                  type="password"
                  value={password}
                />
              </label>
              {error && (
                <p className="rounded-xl bg-[#fbefed] px-4 py-3 text-sm text-[#a63e35]">
                  {error}
                </p>
              )}
              <Button
                className="h-12 w-full rounded-xl bg-[#203d31] text-white hover:bg-[#2d5542]"
                disabled={loading}
                type="submit"
              >
                {loading ? "Kontrol ediliyor..." : "Güvenli giriş yap"}
              </Button>
            </form>
          ) : (
            <div className="mt-7 rounded-2xl border border-[#eadfc9] bg-[#fffaf0] p-4 text-sm leading-6 text-[#725c36]">
              <p className="font-semibold">Yönetici erişimi henüz ayarlanmadı.</p>
              <p className="mt-1">
                Sunucuda <code>ADMIN_USERNAME</code>, <code>ADMIN_PASSWORD</code>{" "}
                ve <code>ADMIN_SESSION_SECRET</code> ortam değişkenlerini tanımlayın.
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 border-t border-[#e8e7df] pt-5 text-xs text-[#7c8379]">
            <ShieldCheck size={15} className="text-[#a67a32]" />
            Yönetim alanı kullanıcı adı ve parola ile korunur.
          </div>
        </section>

        <Link
          className="mt-6 block text-center text-sm text-[#70796f] transition hover:text-[#203d31]"
          href="/"
        >
          ← Menüye geri dön
        </Link>
      </div>
    </main>
  );
}
