"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { formatPrice } from "@/lib/format";
import type { MemberProfile } from "@/lib/member-profile-types";
import { MenuCart, type CartLine } from "@/components/menu/menu-cart";

function getError(body: unknown, fallback: string) {
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : fallback;
}

export function MenuOrderPanel({
  branchId,
  member,
  items,
  onChangeQuantity,
  onClear,
}: {
  branchId: string;
  member: MemberProfile;
  items: CartLine[];
  onChangeQuantity: (productId: string, delta: number) => void;
  onClear: () => void;
}) {
  const router = useRouter();
  const [tableCode, setTableCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [trackingToken, setTrackingToken] = useState<string | null>(null);

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      items.length === 0 ||
      tableCode.length !== 6 ||
      total > member.balance
    ) {
      return;
    }

    setSubmitting(true);
    setError("");
    setTrackingToken(null);

    try {
      const menuResponse = await fetch(
        `/api/orders/menu?code=${encodeURIComponent(tableCode)}`,
        { cache: "no-store" },
      );
      const tableMenu: unknown = await menuResponse.json().catch(() => null);
      if (menuResponse.status === 401) {
        router.replace("/uye");
        return;
      }
      if (!menuResponse.ok) {
        throw new Error(getError(tableMenu, "Masa kodu doğrulanamadı."));
      }
      if (
        typeof tableMenu !== "object" ||
        tableMenu === null ||
        !("branchId" in tableMenu) ||
        typeof tableMenu.branchId !== "string"
      ) {
        throw new Error("Masa bilgisi doğrulanamadı. Lütfen yeniden deneyin.");
      }
      if (tableMenu.branchId !== branchId) {
        throw new Error(
          "Masa kodu seçili şubeye ait değil. Önce masa kodunun bulunduğu şubeyi seçin.",
        );
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableCode,
          items: items.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.replace("/uye");
        return;
      }
      if (!response.ok) {
        throw new Error(getError(body, "Sipariş oluşturulamadı."));
      }
      if (
        typeof body !== "object" ||
        body === null ||
        !("trackingToken" in body) ||
        typeof body.trackingToken !== "string"
      ) {
        throw new Error("Sipariş alındı ancak takip bilgisi alınamadı.");
      }

      setTrackingToken(body.trackingToken);
      setTableCode("");
      onClear();
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Sipariş oluşturulamadı.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-10 border-t border-[#e5dbce] pt-9 sm:mt-14 sm:pt-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:gap-10">
        <MenuCart items={items} onChangeQuantity={onChangeQuantity} />

        <form
          className="h-fit rounded-2xl border border-[#e5dbce] bg-[#fcfaf5] p-5 sm:p-6"
          onSubmit={placeOrder}
        >
          <div className="flex items-center justify-between border-b border-[#e9e0d5] pb-4">
            <span className="text-xs text-[#827568]">
              {itemCount} ürün · Toplam
            </span>
            <span className="font-editorial text-2xl text-[#39271f]">
              {formatPrice(total)}
            </span>
          </div>
          <label className="mt-5 block text-[11px] font-semibold text-[#59483d]">
            6 haneli masa kodu
            <input
              autoComplete="one-time-code"
              className="mt-2 h-12 w-full rounded-lg border border-[#ddd0be] bg-white px-4 text-center font-mono text-lg tracking-[0.3em] outline-none focus:border-[#a87943]"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) =>
                setTableCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              pattern="\d{6}"
              placeholder="••••••"
              required
              value={tableCode}
            />
          </label>

          <div className="mt-4 rounded-lg bg-[#f1eee5] p-3 text-[11px] leading-5 text-[#59483d]">
            <span className="block font-semibold">AkdoKasa bakiyesi</span>
            <span className="text-[#827568]">
              Kullanılabilir bakiye: {formatPrice(member.balance)}
            </span>
          </div>
          {items.length > 0 && total > member.balance && (
            <p className="mt-3 text-[11px] leading-5 text-[#a14d3d]" role="alert">
              Sipariş toplamı bakiyenizi aşıyor. Sipariş verebilmek için kasadan
              hesabınıza bakiye yükleyin.
            </p>
          )}

          {error && (
            <p
              className="mt-4 rounded-lg bg-[#fbf0eb] px-3 py-2.5 text-xs leading-5 text-[#9b4939]"
              role="alert"
            >
              {error}
            </p>
          )}
          {trackingToken && (
            <div
              className="mt-4 rounded-lg bg-[#eaf0e7] px-3 py-3 text-xs leading-5 text-[#31513e]"
              role="status"
            >
              Siparişiniz alındı. Bu sayfada kalabilir veya{" "}
              <Link
                className="font-semibold underline underline-offset-2"
                href={`/siparis-takip/${encodeURIComponent(trackingToken)}`}
              >
                sipariş durumunu görüntüleyebilirsiniz
              </Link>
              .
            </div>
          )}
          <button
            className="mt-5 h-12 w-full rounded-full bg-[#34241e] px-5 text-xs font-semibold text-[#fffaf2] transition hover:bg-[#50382d] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={
              submitting ||
              items.length === 0 ||
              tableCode.length !== 6 ||
              total > member.balance
            }
            type="submit"
          >
            {submitting
              ? "Sipariş gönderiliyor..."
              : total > member.balance
                ? "Yetersiz bakiye"
                : "Bakiyemle sipariş ver"}
          </button>
          <p className="mt-3 text-center text-[10px] leading-5 text-[#8b8175]">
            Sipariş tutarı AkdoKasa bakiyenizden tahsil edilir.
          </p>
        </form>
      </div>
    </section>
  );
}
