"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import type {
  MemberBalanceRecord,
  MemberBalanceRequestRecord,
  MemberOrderRecord,
  MemberProfile,
} from "@/lib/member-profile-types";

function getError(body: unknown) {
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function orderStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Onay bekliyor";
    case "PREPARING":
      return "Hazırlanıyor";
    case "READY":
      return "Hazır";
    case "SERVED":
      return "Teslim edildi";
    default:
      return status;
  }
}

function paymentLabel(order: MemberOrderRecord) {
  if (order.paymentStatus !== "PAID") return "Ödeme bekliyor";
  switch (order.paymentMethod) {
    case "MEMBER_BALANCE":
      return "AkdoKasa bakiyesiyle ödendi";
    case "CASH":
      return "Nakit ödendi";
    case "EXTERNAL_POS":
      return "Harici POS üzerinden ödendi";
    default:
      return "Ödendi";
  }
}

function requestStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Kasada onay bekliyor";
    case "APPROVED":
      return "Onaylandı";
    case "REJECTED":
      return "Reddedildi";
    default:
      return status;
  }
}

export function MemberDashboard({
  member,
  balanceRequests,
  orders,
  transactions,
  busy,
  error,
  onLogout,
}: {
  member: MemberProfile;
  balanceRequests: MemberBalanceRequestRecord[];
  orders: MemberOrderRecord[];
  transactions: MemberBalanceRecord[];
  busy: boolean;
  error: string;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestError, setRequestError] = useState("");
  const hasPendingRequest = balanceRequests.some(
    (request) => request.status === "PENDING",
  );

  async function createBalanceRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestBusy(true);
    setRequestError("");
    try {
      const response = await fetch("/api/members/balance-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getError(body));
      setAmount("");
      router.refresh();
    } catch (submitError) {
      setRequestError(
        submitError instanceof Error
          ? submitError.message
          : "Bakiye talebi oluşturulamadı.",
      );
    } finally {
      setRequestBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3eb] px-4 py-8 text-[#35271f] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-[#69594c] transition hover:text-[#a87943]"
            href="/"
          >
            <ArrowLeft size={16} />
            Menüye dön
          </Link>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#594236] transition hover:text-[#a87943]"
            href="/masa-siparis"
          >
            Masadan sipariş ver <ArrowRight size={15} />
          </Link>
        </div>

        <section className="relative overflow-hidden border border-[#e4d8c8] bg-[#fbf8f2] p-6 shadow-[0_18px_48px_#38261b0b] sm:p-9">
          <div className="pointer-events-none absolute -right-10 -top-20 font-editorial text-[280px] leading-none text-[#b48b52]/[0.06]">
            A
          </div>
          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <span className="grid size-12 place-items-center border border-[#dfc9a8] bg-[#f5ecde] text-[#906c42]">
                <Wallet size={21} strokeWidth={1.5} />
              </span>
              <p className="mt-5 text-[9px] font-bold tracking-[0.22em] text-[#a07847]">
                AKDO ÜYELİK · AKDOKASA
              </p>
              <h1 className="font-editorial mt-2 text-4xl font-medium tracking-tight text-[#35271f] sm:text-5xl">
                Merhaba, {member.firstName}
              </h1>
              <p className="mt-2 text-xs text-[#807468]">
                Üye numaranız{" "}
                <strong className="font-mono tracking-wider text-[#594236]">
                  {member.memberNumber}
                </strong>
              </p>
            </div>
            <div className="md:min-w-[220px] md:border-l md:border-[#e6dccf] md:pl-8">
              <p className="text-[9px] font-semibold tracking-[0.17em] text-[#8c7d6d]">
                KULLANILABİLİR BAKİYE
              </p>
              <p className="font-editorial mt-1 text-5xl text-[#8f693e]">
                {formatPrice(member.balance)}
              </p>
            </div>
          </div>

          <div className="relative mt-8 flex flex-wrap gap-3 border-t border-[#e8dfd3] pt-5">
            <Link
              className="inline-flex min-h-11 items-center gap-2 bg-[#35251f] px-5 text-xs font-semibold text-[#fff9ef] transition hover:bg-[#51382d]"
              href="/masa-siparis"
            >
              Masadan sipariş ver <ArrowUpRight size={15} />
            </Link>
            <Button
              className="h-11 rounded-none border-[#ddcfbd] bg-transparent px-5 text-xs font-semibold text-[#5b483a] hover:bg-[#f4ece0]"
              disabled={busy}
              onClick={onLogout}
              type="button"
              variant="outline"
            >
              Üye oturumunu kapat
            </Button>
          </div>
          {error && (
            <p className="relative mt-3 text-sm text-[#a63e35]" role="alert">
              {error}
            </p>
          )}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.83fr_1.17fr]">
          <section className="border border-[#e4d8c8] bg-[#fbf8f2] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center border border-[#e2d4c1] text-[#97734b]">
                <ArrowDownLeft size={17} />
              </span>
              <div>
                <h2 className="font-editorial text-2xl text-[#392a22]">
                  Bakiyene ekle
                </h2>
                <p className="mt-1 text-[11px] leading-5 text-[#81766a]">
                  Yükleme talebiniz, şubede tahsilat doğrulandıktan sonra
                  bakiyenize yansıtılır.
                </p>
              </div>
            </div>
            <form className="mt-5 space-y-3" onSubmit={createBalanceRequest}>
              <label className="block space-y-2 text-xs font-medium text-[#5d4e42]">
                Yükleme tutarı (₺)
                <Input
                  className="h-12 rounded-none border-[#ded1c0] bg-[#fffdf8] px-4 text-sm focus-visible:ring-[#a87943]/30"
                  disabled={hasPendingRequest || requestBusy}
                  inputMode="numeric"
                  max={100000}
                  min={10}
                  onChange={(event) =>
                    setAmount(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Örn. 250"
                  required
                  type="number"
                  value={amount}
                />
              </label>
              {requestError && (
                <p className="text-xs text-[#a63e35]" role="alert">
                  {requestError}
                </p>
              )}
              <Button
                className="h-11 w-full rounded-none bg-[#35251f] text-xs font-semibold text-[#fff9ef] hover:bg-[#51382d]"
                disabled={
                  hasPendingRequest ||
                  requestBusy ||
                  !amount ||
                  Number(amount) < 10 ||
                  Number(amount) > 100000
                }
                type="submit"
              >
                {requestBusy
                  ? "Talep oluşturuluyor..."
                  : hasPendingRequest
                    ? "Bekleyen talebiniz var"
                    : "Kasada ödeme talebi oluştur"}
              </Button>
            </form>
            <p className="mt-4 border-t border-[#e8dfd3] pt-3 text-[10px] leading-5 text-[#887b6e]">
              Bu talep çevrim içi ödeme veya fiş değildir. Ödeme kasada
              doğrulanır; her işlem AkdoKasa kayıtlarına işlenir.
            </p>
            {balanceRequests.length > 0 && (
              <div className="mt-5 border-t border-[#e8dfd3] pt-4">
                <h3 className="text-[9px] font-bold tracking-[0.16em] text-[#8c7d6d]">
                  YÜKLEME TALEPLERİ
                </h3>
                <ul className="mt-3 space-y-3">
                  {balanceRequests.map((request) => (
                    <li
                      className="flex items-start justify-between gap-3 text-xs"
                      key={request.id}
                    >
                      <span>
                        <strong className="block font-semibold text-[#49382e]">
                          {formatPrice(request.amount)}
                        </strong>
                        <span className="mt-1 block text-[10px] text-[#85796d]">
                          {formatDate(request.createdAt)}
                        </span>
                        {request.reviewNote && (
                          <span className="mt-1 block text-[10px] text-[#85796d]">
                            {request.reviewNote}
                          </span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 border px-2 py-1 text-[9px] ${
                          request.status === "APPROVED"
                            ? "border-[#c9d5c1] bg-[#edf2e8] text-[#496243]"
                            : request.status === "REJECTED"
                              ? "border-[#e8c9c1] bg-[#f8eeeb] text-[#985448]"
                              : "border-[#e4d4b8] bg-[#f8f0e2] text-[#8d6a3e]"
                        }`}
                      >
                        {requestStatusLabel(request.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="border border-[#e4d8c8] bg-[#fbf8f2] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold tracking-[0.18em] text-[#a07847]">
                  HESAP HAREKETLERİ
                </p>
                <h2 className="font-editorial mt-1 text-2xl text-[#392a22]">
                  Bakiye geçmişi
                </h2>
              </div>
              <Clock3 className="text-[#a07847]" size={19} strokeWidth={1.5} />
            </div>
            {transactions.length > 0 ? (
              <ul className="mt-5 divide-y divide-[#e9e0d5]">
                {transactions.map((transaction) => (
                  <li
                    className="flex items-center justify-between gap-4 py-3"
                    key={transaction.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`grid size-8 shrink-0 place-items-center ${
                          transaction.amount > 0
                            ? "bg-[#edf1e8] text-[#5a7650]"
                            : "bg-[#f5ece3] text-[#9a6d46]"
                        }`}
                      >
                        {transaction.amount > 0 ? (
                          <ArrowDownLeft size={15} />
                        ) : (
                          <ArrowUpRight size={15} />
                        )}
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-[11px] font-medium text-[#514238]">
                          {transaction.description}
                        </strong>
                        <span className="mt-1 block text-[9px] text-[#8b8075]">
                          {formatDate(transaction.createdAt)}
                        </span>
                      </span>
                    </div>
                    <strong
                      className={`shrink-0 text-[11px] font-semibold ${
                        transaction.amount > 0
                          ? "text-[#58714c]"
                          : "text-[#875d43]"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {formatPrice(transaction.amount)}
                    </strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 border-t border-[#e9e0d5] pt-4 text-xs text-[#81766a]">
                Henüz bakiye hareketiniz bulunmuyor.
              </p>
            )}
          </section>
        </div>

        <section className="mt-6 border border-[#e4d8c8] bg-[#fbf8f2] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-bold tracking-[0.18em] text-[#a07847]">
                AKDOKASA
              </p>
              <h2 className="font-editorial mt-1 text-2xl text-[#392a22]">
                Sipariş geçmişi
              </h2>
            </div>
            <ReceiptText className="text-[#a07847]" size={20} strokeWidth={1.5} />
          </div>
          {orders.length > 0 ? (
            <div className="mt-5 space-y-3">
              {orders.map((order) => (
                <article
                  className="grid gap-4 border border-[#e9e0d5] bg-[#fffdf8] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  key={order.id}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="font-editorial text-xl text-[#392a22]">
                        {order.table.name} masası
                      </h3>
                      <span className="text-[10px] text-[#81766a]">
                        {order.branch.name}
                      </span>
                    </div>
                    <p className="mt-1 text-[9px] text-[#897d70]">
                      {formatDate(order.createdAt)}
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {order.items.map((item) => (
                        <li
                          className="text-[10px] text-[#67594d]"
                          key={item.id}
                        >
                          {item.quantity} × {item.name}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9px]">
                      <span className="text-[#766a5e]">
                        {orderStatusLabel(order.status)}
                      </span>
                      <span className="text-[#766a5e]">
                        {paymentLabel(order)}
                      </span>
                    </div>
                  </div>
                  <strong className="font-editorial text-2xl text-[#8f693e]">
                    {formatPrice(order.total)}
                  </strong>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 border-t border-[#e9e0d5] pt-4 text-xs text-[#81766a]">
              Henüz masadan sipariş geçmişiniz bulunmuyor.
            </p>
          )}
          <Link
            className="mt-5 inline-flex items-center gap-2 text-[10px] font-semibold text-[#755a3e] transition hover:text-[#a87943]"
            href="/masa-siparis"
          >
            Yeni sipariş oluştur <ArrowRight size={14} />
          </Link>
        </section>
      </div>
    </main>
  );
}
