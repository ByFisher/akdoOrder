"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, Circle, LoaderCircle } from "lucide-react";
import { formatPrice } from "@/lib/format";

interface TrackedOrder {
  id: string;
  status: "PENDING" | "PREPARING" | "READY" | "SERVED";
  total: number;
  createdAt: string;
  table: { name: string };
  branch: { name: string };
  items: { id: string; name: string; price: number; quantity: number }[];
}

const stages = [
  { status: "PENDING", label: "Sipariş alındı" },
  { status: "PREPARING", label: "Hazırlanıyor" },
  { status: "READY", label: "Garson bekleniyor" },
  { status: "SERVED", label: "Teslim edildi" },
] as const;

export function OrderTracking({ trackingToken }: { trackingToken: string }) {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");

  const loadOrder = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(trackingToken)}`,
        { cache: "no-store" },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof body.error === "string"
            ? body.error
            : "Sipariş durumu alınamadı.";
        throw new Error(message);
      }
      if (
        typeof body !== "object" ||
        body === null ||
        !("order" in body) ||
        typeof body.order !== "object" ||
        body.order === null
      ) {
        throw new Error("Sipariş durumu okunamadı.");
      }
      setOrder(body.order as TrackedOrder);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Sipariş durumu alınamadı.");
    }
  }, [trackingToken]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadOrder(), 0);
    const timer = window.setInterval(() => void loadOrder(), 5000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadOrder]);

  const activeStage = order
    ? stages.findIndex((stage) => stage.status === order.status)
    : -1;

  return (
    <main className="min-h-screen bg-[#f5f3ed] px-4 py-8 text-[#202c26] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link className="font-editorial text-xl text-[#203d31]" href="/">
          AKDO
        </Link>
        <section className="mt-7 rounded-[26px] border border-[#e0e1d8] bg-[#fffefa] p-6 shadow-[0_16px_50px_#24372c10] sm:p-9">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#96743c]">
            SİPARİŞ TAKİBİ
          </p>
          <h1 className="font-editorial mt-2 text-3xl text-[#203d31]">
            Siparişinizin durumu
          </h1>
          {error && !order && (
            <p className="mt-5 rounded-xl bg-[#fbefed] px-4 py-3 text-sm text-[#a63e35]" role="alert">
              {error}
            </p>
          )}
          {!order && !error && (
            <div className="mt-8 flex items-center gap-3 text-sm text-[#737a70]">
              <LoaderCircle className="animate-spin" size={18} />
              Sipariş bilgisi yükleniyor...
            </div>
          )}
          {order && (
            <>
              <div className="mt-5 flex flex-wrap justify-between gap-3 rounded-xl bg-[#f7f6f0] p-4 text-sm">
                <span className="font-semibold text-[#39483d]">
                  {order.branch.name} · {order.table.name}
                </span>
                <span className="text-[#737a70]">
                  {new Date(order.createdAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <ol className="mt-8 space-y-5">
                {stages.map((stage, index) => {
                  const complete = index <= activeStage;
                  return (
                    <li className="flex items-center gap-3" key={stage.status}>
                      {complete ? (
                        <Check className="text-[#668c67]" size={19} />
                      ) : (
                        <Circle className="text-[#c9c8bf]" size={19} />
                      )}
                      <span className={complete ? "text-sm font-semibold text-[#31513e]" : "text-sm text-[#8b9187]"}>
                        {stage.label}
                      </span>
                      {index === activeStage && order.status !== "SERVED" && (
                        <span className="ml-auto rounded-full bg-[#e9eee7] px-2.5 py-1 text-[10px] font-semibold text-[#31513e]">
                          Güncel
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
              <div className="mt-8 border-t border-[#eeeae2] pt-5">
                <h2 className="text-sm font-semibold text-[#39483d]">Sipariş özeti</h2>
                <ul className="mt-3 space-y-2">
                  {order.items.map((item) => (
                    <li className="flex justify-between gap-3 text-sm" key={item.id}>
                      <span className="text-[#526055]">
                        {item.quantity} × {item.name}
                      </span>
                      <span className="font-medium text-[#39483d]">
                        {formatPrice(item.quantity * item.price)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-between border-t border-[#eeeae2] pt-4 text-sm font-bold">
                  <span>Toplam</span>
                  <span className="text-[#8c692f]">{formatPrice(order.total)}</span>
                </div>
              </div>
              {error && (
                <p className="mt-4 text-xs text-[#a45142]" role="status">
                  Durum yenilenemedi; mevcut bilgi gösteriliyor.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
