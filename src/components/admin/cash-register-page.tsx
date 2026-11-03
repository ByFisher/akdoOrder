"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  Banknote,
  CircleCheck,
  Clock3,
  CreditCard,
  ReceiptText,
  RotateCw,
  Wallet,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import type { AdminBranch } from "@/lib/branch-types";
import { formatPrice } from "@/lib/format";

interface CashOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paidAt: string | null;
  paidBy: string | null;
  table: { name: string };
  branch: { name: string };
  member: { firstName: string; lastName: string; memberNumber: string } | null;
  items: { id: string; name: string; price: number; quantity: number }[];
}

interface PendingBalanceRequest {
  id: string;
  amount: number;
  createdAt: string;
  member: {
    firstName: string;
    lastName: string;
    memberNumber: string;
    isActive: boolean;
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function orderStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Yeni";
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

function paymentMethodLabel(method: string | null) {
  switch (method) {
    case "MEMBER_BALANCE":
      return "AkdoKasa";
    case "CASH":
      return "Nakit";
    case "EXTERNAL_POS":
      return "Harici POS";
    default:
      return "Ödeme bekliyor";
  }
}

function getError(body: unknown) {
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
}

export function CashRegisterPage({
  activeBranch,
  branches,
  orders,
  pendingRequests,
  collectedLastDay,
  collectedOrderCount,
}: {
  activeBranch: AdminBranch;
  branches: AdminBranch[];
  orders: CashOrder[];
  pendingRequests: PendingBalanceRequest[];
  collectedLastDay: number;
  collectedOrderCount: number;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const unpaidOrders = orders.filter(
    (order) => order.paymentStatus !== "PAID",
  );

  async function reviewBalanceRequest(
    request: PendingBalanceRequest,
    status: "APPROVED" | "REJECTED",
  ) {
    const action =
      status === "APPROVED"
        ? `Kasada ${formatPrice(request.amount)} tahsil edildiğini doğrulayıp üyenin bakiyesine eklemek`
        : "Bu bakiye yükleme talebini reddetmek";
    if (!window.confirm(`${action}?`)) return;

    setBusyId(request.id);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/cash/requests/${encodeURIComponent(request.id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getError(body));
      router.refresh();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Bakiye talebi güncellenemedi.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function recordOrderPayment(
    order: CashOrder,
    paymentMethod: "CASH" | "EXTERNAL_POS",
  ) {
    const methodName =
      paymentMethod === "CASH" ? "nakit" : "harici POS";
    if (!window.confirm(`${formatPrice(order.total)} ${methodName} tahsilatını kaydet?`)) {
      return;
    }

    setBusyId(order.id);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/cash/orders/${encodeURIComponent(order.id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod }),
        },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getError(body));
      router.refresh();
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Sipariş ödemesi kaydedilemedi.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout
      activeBranchId={activeBranch.id}
      activePath="/login/kasa"
      branches={branches}
    >
      <section className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#96743c]">
            <Banknote size={15} />
            AKDOKASA · {activeBranch.name}
          </div>
          <h1 className="font-editorial mt-2 text-4xl tracking-tight text-[#34241e]">
            Kasa ve hareketler
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#756a5e]">
            Masa siparişlerini ve üyelerin bakiye yükleme taleplerini kayıt
            altına alın.
          </p>
        </div>
        <Button
          className="h-10 gap-2 rounded-xl border-[#ded5c9] bg-[#fbf8f2] text-xs text-[#59483d] hover:bg-[#f1e9de]"
          onClick={() => router.refresh()}
          type="button"
          variant="outline"
        >
          <RotateCw size={14} />
          Yenile
        </Button>
      </section>

      <div className="mb-7 grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<CreditCard size={17} />}
          label="Tahsil edilen · son 24 saat"
          value={formatPrice(collectedLastDay)}
          detail={`${collectedOrderCount} sipariş`}
        />
        <SummaryCard
          icon={<ReceiptText size={17} />}
          label="Ödeme bekleyen siparişler"
          value={formatPrice(
            unpaidOrders.reduce((sum, order) => sum + order.total, 0),
          )}
          detail={`${unpaidOrders.length} sipariş`}
        />
        <SummaryCard
          icon={<Wallet size={17} />}
          label="Bekleyen bakiye talepleri"
          value={formatPrice(
            pendingRequests.reduce((sum, request) => sum + request.amount, 0),
          )}
          detail={`${pendingRequests.length} talep`}
        />
      </div>

      <section className="mb-7 border border-[#e5dccf] bg-[#fcfaf5] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center border border-[#e2d4c1] bg-[#f5ecde] text-[#97734b]">
            <ArrowDownLeft size={17} />
          </span>
          <div>
            <h2 className="font-editorial text-2xl text-[#392a22]">
              Bakiye yükleme onayı
            </h2>
            <p className="mt-1 text-[10px] leading-5 text-[#81766a]">
              Yalnızca kasada tahsilatı gerçekten doğruladıktan sonra onaylayın.
              Onay, üye bakiyesini ve değiştirilemeyen hareket kaydını birlikte
              oluşturur.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 border border-[#e8c9c1] bg-[#f8eeeb] px-4 py-3 text-xs text-[#985448]" role="alert">
            {error}
          </p>
        )}

        {pendingRequests.length > 0 ? (
          <div className="mt-5 space-y-3">
            {pendingRequests.map((request) => (
              <article
                className="grid gap-4 border border-[#e8dfd3] bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                key={request.id}
              >
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-editorial text-xl text-[#392a22]">
                      {request.member.firstName} {request.member.lastName}
                    </h3>
                    <span className="font-mono text-[10px] tracking-wider text-[#86796b]">
                      {request.member.memberNumber}
                    </span>
                    {!request.member.isActive && (
                      <span className="text-[9px] font-semibold text-[#a63e35]">
                        Pasif üye
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#84786b]">
                    <Clock3 size={12} />
                    {formatDate(request.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <strong className="font-editorial mr-1 text-2xl text-[#8f693e]">
                    {formatPrice(request.amount)}
                  </strong>
                  <Button
                    className="h-9 rounded-lg bg-[#38533e] px-3 text-[10px] text-white hover:bg-[#2e4634]"
                    disabled={busyId === request.id || !request.member.isActive}
                    onClick={() =>
                      void reviewBalanceRequest(request, "APPROVED")
                    }
                    type="button"
                  >
                    <CircleCheck size={14} />
                    Tahsilatı onayla
                  </Button>
                  <Button
                    className="h-9 rounded-lg border-[#e0d4c6] px-3 text-[10px] text-[#745c4b]"
                    disabled={busyId === request.id}
                    onClick={() =>
                      void reviewBalanceRequest(request, "REJECTED")
                    }
                    type="button"
                    variant="outline"
                  >
                    Reddet
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 border-t border-[#e9e0d5] pt-4 text-xs text-[#81766a]">
            Bekleyen bakiye yükleme talebi yok.
          </p>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold tracking-[0.18em] text-[#a07847]">
              MASA SİPARİŞLERİ
            </p>
            <h2 className="font-editorial mt-1 text-2xl text-[#392a22]">
              Sipariş ve tahsilat defteri
            </h2>
          </div>
          <span className="text-[10px] text-[#81766a]">
            Son {orders.length} kayıt · {activeBranch.name}
          </span>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <article
                className="border border-[#e5dccf] bg-[#fcfaf5] p-4 sm:p-5"
                key={order.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-editorial text-2xl text-[#392a22]">
                        {order.table.name} masası
                      </h3>
                      <span className="text-[10px] text-[#81766a]">
                        {order.branch.name}
                      </span>
                      <span className="text-[9px] font-semibold text-[#8d6a3e]">
                        {orderStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-[9px] text-[#897d70]">
                      {formatDate(order.createdAt)}
                      {order.member
                        ? ` · ${order.member.firstName} ${order.member.lastName} · ${order.member.memberNumber}`
                        : " · Üye hesabı ilişkilendirilmemiş"}
                    </p>
                  </div>
                  <strong className="font-editorial text-2xl text-[#8f693e]">
                    {formatPrice(order.total)}
                  </strong>
                </div>

                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-[#ebe3d8] pt-3">
                  {order.items.map((item) => (
                    <li
                      className="text-[10px] text-[#67594d]"
                      key={item.id}
                    >
                      {item.quantity} × {item.name}{" "}
                      <span className="text-[#8b7b6c]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[10px] text-[#766a5e]">
                    <span className="font-semibold text-[#58483b]">
                      {paymentMethodLabel(order.paymentMethod)}
                    </span>
                    {order.paidAt && (
                      <span>
                        {" "}
                        · {formatDate(order.paidAt)}
                        {order.paidBy ? ` · ${order.paidBy}` : ""}
                      </span>
                    )}
                  </div>
                  {order.paymentStatus === "PAID" ? (
                    <span className="inline-flex items-center gap-1.5 border border-[#cad5c2] bg-[#eef2e9] px-3 py-2 text-[9px] font-semibold text-[#506547]">
                      <CircleCheck size={13} />
                      Tahsilat kaydedildi
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="h-9 rounded-lg bg-[#35251f] px-3 text-[10px] text-[#fff9ef] hover:bg-[#51382d]"
                        disabled={busyId === order.id}
                        onClick={() =>
                          void recordOrderPayment(order, "CASH")
                        }
                        type="button"
                      >
                        <Banknote size={14} />
                        Nakit alındı
                      </Button>
                      <Button
                        className="h-9 rounded-lg border-[#dfd2c1] px-3 text-[10px] text-[#654e3d]"
                        disabled={busyId === order.id}
                        onClick={() =>
                          void recordOrderPayment(order, "EXTERNAL_POS")
                        }
                        type="button"
                        variant="outline"
                      >
                        <CreditCard size={14} />
                        Harici POS alındı
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#d8caba] bg-[#fcfaf5] p-10 text-center text-xs text-[#81766a]">
            Bu şubede henüz masa siparişi yok.
          </div>
        )}
      </section>

      <p className="mt-7 border-t border-[#e5dccf] pt-4 text-[9px] leading-5 text-[#897d70]">
        AkdoKasa bu uygulama içinde sipariş, tahsilat ve bakiye hareketlerini
        denetim iziyle kaydeder. Bu kayıtlar tek başına mali fiş/fatura değildir;
        e-Arşiv, e-Fatura ve ÖKC entegrasyonu bu sürümde bulunmaz.
      </p>
    </AdminLayout>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="border border-[#e5dccf] bg-[#fcfaf5] p-4">
      <div className="flex items-center gap-2 text-[#987347]">
        {icon}
        <span className="text-[9px] font-semibold tracking-[0.1em] text-[#81766a]">
          {label}
        </span>
      </div>
      <p className="font-editorial mt-3 text-3xl text-[#392a22]">{value}</p>
      <p className="mt-1 text-[9px] text-[#8a7f73]">{detail}</p>
    </article>
  );
}
