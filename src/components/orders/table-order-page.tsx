"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";

interface TableMenu {
  table: { id: string; name: string };
  branchName: string;
  products: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    categoryName: string;
  }[];
}

function getError(body: unknown, fallback: string) {
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : fallback;
}

export function TableOrderPage({
  member,
}: {
  member: {
    memberNumber: string;
    firstName: string;
    lastName: string;
    balance: number;
  } | null;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [menu, setMenu] = useState<TableMenu | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const cartItems = useMemo(
    () =>
      menu?.products.flatMap((product) => {
        const quantity = quantities[product.id] ?? 0;
        return quantity > 0 ? [{ product, quantity }] : [];
      }) ?? [],
    [menu, quantities],
  );
  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  async function loadMenu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/orders/menu?code=${encodeURIComponent(code)}`,
        { cache: "no-store" },
      );
      const body: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.replace("/uye?returnTo=%2F");
        return;
      }
      if (!response.ok) throw new Error(getError(body, "Masa menüsü açılamadı."));
      setMenu(body as TableMenu);
      setQuantities({});
    } catch (loadError) {
      setMenu(null);
      setError(loadError instanceof Error ? loadError.message : "Masa menüsü açılamadı.");
    } finally {
      setLoading(false);
    }
  }

  function changeQuantity(productId: string, delta: number) {
    setQuantities((current) => {
      const next = Math.min(99, Math.max(0, (current[productId] ?? 0) + delta));
      const updated = { ...current };
      if (next === 0) delete updated[productId];
      else updated[productId] = next;
      return updated;
    });
  }

  async function placeOrder() {
    if (!member || cartItems.length === 0 || total > member.balance) {
      setError("Sipariş tutarı için yeterli AkdoKasa bakiyesi bulunmuyor.");
      return;
    }

    setPlacing(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableCode: code,
          items: cartItems.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.replace("/uye?returnTo=%2F");
        return;
      }
      if (!response.ok) throw new Error(getError(body, "Sipariş oluşturulamadı."));
      if (
        typeof body !== "object" ||
        body === null ||
        !("trackingToken" in body) ||
        typeof body.trackingToken !== "string"
      ) {
        throw new Error("Sipariş oluşturuldu ancak takip bilgisi alınamadı.");
      }
      router.push(`/siparis-takip/${encodeURIComponent(body.trackingToken)}`);
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : "Sipariş oluşturulamadı.");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f3ed] px-4 py-6 text-[#202c26] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link className="font-editorial text-xl text-[#203d31]" href="/">
            AKDO
          </Link>
          <div className="flex items-center gap-3">
            {member ? (
              <Link
                className="text-right text-xs font-medium text-[#536454] hover:text-[#a67a32]"
                href="/uye"
              >
                <span className="block font-semibold">{member.firstName} · {member.memberNumber}</span>
                <span className="mt-1 block">{member.balance.toLocaleString("tr-TR")} ₺ bakiye</span>
              </Link>
            ) : (
              <Link
                className="text-sm font-medium text-[#536454] hover:text-[#a67a32]"
                href="/uye"
              >
                Üye ol / giriş
              </Link>
            )}
            <Link
              className="text-sm font-medium text-[#536454] hover:text-[#a67a32]"
              href="/"
            >
              Menü
            </Link>
          </div>
        </header>

        {!menu ? (
          <section className="mx-auto mt-10 max-w-lg rounded-[26px] border border-[#e0e1d8] bg-[#fffefa] p-6 shadow-[0_16px_50px_#24372c10] sm:p-9">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#e9eee7] text-[#31513e]">
              <ShoppingBag size={21} />
            </div>
            <p className="mt-6 text-[10px] font-bold tracking-[0.2em] text-[#96743c]">
              MASADAN SİPARİŞ
            </p>
            <h1 className="font-editorial mt-2 text-3xl text-[#203d31]">
              Masa kodunuzu girin
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#737a70]">
              Masanızdaki altı haneli kodla doğru şubenin menüsünü açın.
            </p>
            <form className="mt-6 space-y-4" onSubmit={loadMenu}>
              <label className="block space-y-2 text-sm font-medium text-[#405247]">
                6 haneli masa kodu
                <Input
                  autoComplete="one-time-code"
                  className="h-14 rounded-xl border-[#dedfd5] bg-white px-4 text-center font-mono text-2xl tracking-[0.3em]"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  pattern="\d{6}"
                  placeholder="••••••"
                  required
                  value={code}
                />
              </label>
              {error && <p className="text-sm text-[#a63e35]" role="alert">{error}</p>}
              <Button
                className="h-12 w-full rounded-xl bg-[#203d31] text-white hover:bg-[#2d5542]"
                disabled={loading || code.length !== 6}
                type="submit"
              >
                {loading ? "Masa aranıyor..." : "Menüyü aç"}
              </Button>
            </form>
          </section>
        ) : (
          <>
            <section className="mb-6 rounded-[24px] bg-[#203d31] px-6 py-6 text-white sm:px-8">
              <p className="text-[10px] font-bold tracking-[0.18em] text-[#e2c47e]">
                {menu.branchName}
              </p>
              <h1 className="font-editorial mt-2 text-3xl">
                {menu.table.name} masası
              </h1>
              <p className="mt-2 text-sm text-white/65">
                Beğendiklerinizi sepete ekleyip siparişinizi mutfağa iletin.
              </p>
              <button
                className="mt-4 text-xs font-semibold text-[#e2c47e] underline underline-offset-4"
                onClick={() => {
                  setMenu(null);
                  setQuantities({});
                  setError("");
                }}
                type="button"
              >
                Masa kodunu değiştir
              </button>
            </section>

            {menu.products.length === 0 ? (
              <section className="rounded-2xl border border-dashed border-[#d8d8cd] bg-[#fffefa] p-10 text-center text-sm text-[#737a70]">
                Bu şubenin menüsünde şu anda siparişe açık ürün yok.
              </section>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {menu.products.map((product) => {
                  const quantity = quantities[product.id] ?? 0;
                  return (
                    <article
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[#e3dfd4] bg-[#fffefa] p-4"
                      key={product.id}
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-[0.12em] text-[#96743c]">
                          {product.categoryName}
                        </p>
                        <h2 className="mt-1 truncate font-semibold text-[#203d31]">
                          {product.name}
                        </h2>
                        {product.description && (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#737a70]">
                            {product.description}
                          </p>
                        )}
                        <p className="mt-2 text-sm font-bold text-[#8c692f]">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {quantity > 0 && (
                          <>
                            <button
                              aria-label={`${product.name} miktarını azalt`}
                              className="grid size-9 place-items-center rounded-full border border-[#dedfd5] text-[#405846]"
                              onClick={() => changeQuantity(product.id, -1)}
                              type="button"
                            >
                              <Minus size={15} />
                            </button>
                            <span className="min-w-5 text-center text-sm font-semibold">
                              {quantity}
                            </span>
                          </>
                        )}
                        <button
                          aria-label={`${product.name} ekle`}
                          className="grid size-9 place-items-center rounded-full bg-[#203d31] text-white"
                          onClick={() => changeQuantity(product.id, 1)}
                          type="button"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <section className="mt-6 rounded-2xl border border-[#e3dfd4] bg-[#fffefa] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#39483d]">
                    Sepet · {cartItems.reduce((sum, item) => sum + item.quantity, 0)} ürün
                  </p>
                  <p className="mt-1 text-xs text-[#737a70]">
                    Siparişiniz mutfağa hemen iletilir.
                  </p>
                </div>
                <p className="text-lg font-bold text-[#8c692f]">{formatPrice(total)}</p>
              </div>
              {member && (
                <p className="mt-4 border-t border-[#eeeae2] pt-4 text-xs text-[#737a70]">
                  AkdoKasa bakiyesi: {member.balance.toLocaleString("tr-TR")} ₺
                </p>
              )}
              {error && <p className="mt-4 text-sm text-[#a63e35]" role="alert">{error}</p>}
              <Button
                className="mt-5 h-12 w-full rounded-xl bg-[#203d31] text-white hover:bg-[#2d5542]"
                disabled={
                  placing ||
                  cartItems.length === 0 ||
                  !member ||
                  total > (member?.balance ?? 0)
                }
                onClick={() => void placeOrder()}
                type="button"
              >
                {placing
                  ? "Sipariş gönderiliyor..."
                  : total > (member?.balance ?? 0)
                    ? "Yetersiz bakiye"
                    : "Bakiyemle sipariş ver"}
              </Button>
              {member && total > member.balance && cartItems.length > 0 && (
                <p className="mt-3 text-center text-xs text-[#a45142]" role="alert">
                  Bakiyeniz sipariş tutarını karşılamıyor. Sipariş verebilmek için
                  kasadan hesabınıza bakiye yükleyin.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
