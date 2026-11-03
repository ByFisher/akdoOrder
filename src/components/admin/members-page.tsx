"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, UserRound, Wallet } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminBranch } from "@/lib/branch-types";

interface MemberTransaction {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
  orderId: string | null;
}

interface MemberRecord {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
  transactions: MemberTransaction[];
}

function getError(body: unknown) {
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
}

export function MembersPage({
  activeBranch,
  branches,
  members,
}: {
  activeBranch: AdminBranch;
  branches: AdminBranch[];
  members: MemberRecord[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [createdNumber, setCreatedNumber] = useState("");

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");
    setCreatedNumber("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          phone: formData.get("phone"),
          password: formData.get("password"),
          initialBalance: Number(formData.get("initialBalance") || 0),
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getError(body));
      if (
        typeof body !== "object" ||
        body === null ||
        !("member" in body) ||
        typeof body.member !== "object" ||
        body.member === null ||
        !("memberNumber" in body.member) ||
        typeof body.member.memberNumber !== "string"
      ) {
        throw new Error("Üye oluşturuldu ancak üye numarası alınamadı.");
      }
      setCreatedNumber(body.member.memberNumber);
      form.reset();
      router.refresh();
    } catch (createError) {
      setMessage(createError instanceof Error ? createError.message : "Üye oluşturulamadı.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AdminLayout
      activeBranchId={activeBranch.id}
      activePath="/login/users"
      branches={branches}
    >
      <section className="mb-6">
        <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#96743c]">
          <UserRound size={14} />
          ÜYELİK YÖNETİMİ
        </div>
        <h1 className="font-editorial mt-2 text-4xl tracking-tight text-[#203d31]">
          Kullanıcılar
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#737a70]">
          Üyeleri oluşturun, bilgilerini yönetin ve bakiye yükleme veya düzeltme
          işlemlerini kaydedin.
        </p>
      </section>

      <section className="mb-6 rounded-[22px] border border-[#ebe8e0] bg-white p-5 shadow-[0_5px_20px_#3c32100a] sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#f5eddf] text-[#a67a36]">
            <Plus size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[#49443a]">Üye oluştur</h2>
            <p className="mt-1 text-xs text-[#837b70]">
              Telefon isteğe bağlıdır. Sistem benzersiz bir üye numarası verir.
            </p>
          </div>
        </div>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={createMember}>
          <Input
            autoComplete="given-name"
            className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
            maxLength={80}
            name="firstName"
            placeholder="Ad"
            required
          />
          <Input
            autoComplete="family-name"
            className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
            maxLength={80}
            name="lastName"
            placeholder="Soyad"
            required
          />
          <Input
            autoComplete="tel"
            className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
            maxLength={30}
            name="phone"
            placeholder="Telefon (isteğe bağlı)"
            type="tel"
          />
          <Input
            autoComplete="new-password"
            className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
            minLength={8}
            name="password"
            placeholder="Başlangıç parolası"
            required
            type="password"
          />
          <Input
            aria-label="Başlangıç bakiyesi"
            className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
            defaultValue={0}
            min={0}
            name="initialBalance"
            placeholder="Başlangıç bakiyesi (₺)"
            type="number"
          />
          <div className="sm:col-span-2 lg:col-span-5">
            {createdNumber && (
              <p className="mb-3 rounded-xl bg-[#e9eee7] px-4 py-3 text-sm text-[#31513e]">
                Üye oluşturuldu. Giriş için üye numarası:{" "}
                <strong className="font-mono tracking-wider">{createdNumber}</strong>
              </p>
            )}
            {message && (
              <p className="mb-3 text-sm text-[#a63e35]" role="alert">{message}</p>
            )}
            <Button
              className="h-11 rounded-xl bg-[#203d31] px-5 text-white hover:bg-[#2d5542]"
              disabled={creating}
              type="submit"
            >
              {creating ? <LoaderCircle className="animate-spin" /> : <Plus />}
              Üye oluştur
            </Button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-editorial text-2xl text-[#203d31]">Kayıtlı üyeler</h2>
          <span className="text-xs text-[#737a70]">{members.length} üye</span>
        </div>
        {members.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-[#d8d8cd] bg-[#fffefa] p-12 text-center text-sm text-[#737a70]">
            Henüz üye kaydı yok.
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}

function MemberCard({ member }: { member: MemberRecord }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function updateMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    try {
      const response = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          phone: formData.get("phone"),
          isActive: formData.get("isActive") === "on",
          ...(password ? { password } : {}),
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getError(body));
      setMessage("Üye bilgileri güncellendi.");
      router.refresh();
    } catch (updateError) {
      setMessage(updateError instanceof Error ? updateError.message : "Üye güncellenemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function changeBalance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch(
        `/api/admin/members/${member.id}/balance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            direction: formData.get("direction"),
            amount: Number(formData.get("amount")),
            description: formData.get("description"),
          }),
        },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getError(body));
      setMessage("Bakiye işlemi kaydedildi.");
      form.reset();
      router.refresh();
    } catch (balanceError) {
      setMessage(balanceError instanceof Error ? balanceError.message : "Bakiye işlemi yapılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-[22px] border border-[#e3dfd4] bg-[#fffefa] shadow-[0_5px_20px_#3c32100a]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eeeae2] px-5 py-4 sm:px-6">
        <div>
          <h3 className="font-semibold text-[#203d31]">
            {member.firstName} {member.lastName}
          </h3>
          <p className="mt-1 font-mono text-sm tracking-[0.14em] text-[#8c692f]">
            {member.memberNumber}
          </p>
          <p className="mt-1 text-xs text-[#737a70]">
            {member.phone || "Telefon eklenmemiş"} ·{" "}
            {new Date(member.createdAt).toLocaleDateString("tr-TR")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf2e9] px-3 py-1.5 text-xs font-semibold text-[#31513e]">
            <Wallet size={14} />
            {member.balance.toLocaleString("tr-TR")} ₺
          </span>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              member.isActive
                ? "bg-[#e9eee7] text-[#31513e]"
                : "bg-[#f8ece8] text-[#a45142]"
            }`}
          >
            {member.isActive ? "Aktif" : "Pasif"}
          </span>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
        <form className="space-y-3" onSubmit={updateMember}>
          <h4 className="text-xs font-bold tracking-[0.12em] text-[#96743c]">
            ÜYE BİLGİLERİ
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-medium text-[#675c4d]">
              Ad
              <Input
                className="h-10 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
                defaultValue={member.firstName}
                maxLength={80}
                name="firstName"
                required
              />
            </label>
            <label className="space-y-1.5 text-xs font-medium text-[#675c4d]">
              Soyad
              <Input
                className="h-10 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
                defaultValue={member.lastName}
                maxLength={80}
                name="lastName"
                required
              />
            </label>
          </div>
          <label className="block space-y-1.5 text-xs font-medium text-[#675c4d]">
            Telefon (isteğe bağlı)
            <Input
              className="h-10 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
              defaultValue={member.phone ?? ""}
              maxLength={30}
              name="phone"
              type="tel"
            />
          </label>
          <label className="block space-y-1.5 text-xs font-medium text-[#675c4d]">
            Yeni parola <span className="font-normal text-[#8b9187]">(değiştirmek için doldurun)</span>
            <Input
              autoComplete="new-password"
              className="h-10 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
              minLength={8}
              name="password"
              type="password"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-[#675c4d]">
            <input
              className="size-4 accent-[#31513e]"
              defaultChecked={member.isActive}
              name="isActive"
              type="checkbox"
            />
            Üyelik aktif
          </label>
          <Button
            className="h-10 rounded-xl bg-[#203d31] px-4 text-white hover:bg-[#2d5542]"
            disabled={busy}
            type="submit"
          >
            Bilgileri kaydet
          </Button>
        </form>

        <div className="space-y-4">
          <form
            className="space-y-3 rounded-2xl bg-[#f7f6f0] p-4"
            onSubmit={changeBalance}
          >
            <h4 className="text-xs font-bold tracking-[0.12em] text-[#96743c]">
              BAKİYE YÜKLE / DÜZELT
            </h4>
            <div className="grid gap-3 sm:grid-cols-[0.8fr_1fr]">
              <label className="space-y-1.5 text-xs font-medium text-[#675c4d]">
                İşlem
                <select
                  className="h-10 w-full rounded-xl border border-[#e8e1d6] bg-white px-3 text-sm"
                  name="direction"
                >
                  <option value="CREDIT">Bakiye yükle</option>
                  <option value="DEBIT">Bakiye düş</option>
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-medium text-[#675c4d]">
                Tutar (₺)
                <Input
                  className="h-10 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
                  min={1}
                  name="amount"
                  required
                  type="number"
                />
              </label>
            </div>
            <label className="block space-y-1.5 text-xs font-medium text-[#675c4d]">
              Açıklama
              <Input
                className="h-10 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
                maxLength={200}
                name="description"
                placeholder="Örn. Kasada bakiye yükleme"
                required
              />
            </label>
            <Button
              className="h-10 rounded-xl border-[#d8d8cd] bg-white px-4 text-[#405846]"
              disabled={busy}
              type="submit"
              variant="outline"
            >
              {busy ? <LoaderCircle className="animate-spin" /> : <Wallet />}
              Bakiye işlemini kaydet
            </Button>
          </form>
          <div>
            <h4 className="mb-2 text-xs font-bold tracking-[0.12em] text-[#96743c]">
              SON BAKİYE İŞLEMLERİ
            </h4>
            {member.transactions.length === 0 ? (
              <p className="text-xs text-[#8b9187]">Henüz bakiye işlemi yok.</p>
            ) : (
              <ul className="space-y-2">
                {member.transactions.map((transaction) => (
                  <li
                    className="flex items-start justify-between gap-3 text-xs"
                    key={transaction.id}
                  >
                    <span className="text-[#737a70]">
                      {transaction.description}
                      <time className="mt-1 block text-[10px]">
                        {new Date(transaction.createdAt).toLocaleString("tr-TR")}
                      </time>
                    </span>
                    <span
                      className={`shrink-0 font-semibold ${
                        transaction.amount > 0 ? "text-[#31513e]" : "text-[#a45142]"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount.toLocaleString("tr-TR")} ₺
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {message && (
            <p
              className={`text-xs ${message.includes("kaydedildi") || message.includes("güncellendi") ? "text-[#31513e]" : "text-[#a63e35]"}`}
              role="status"
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
