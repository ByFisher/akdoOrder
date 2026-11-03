"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, CircleCheck, LoaderCircle, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import type { StaffRole } from "@/lib/staff-auth";

interface StaffOrder {
  id: string;
  status: "PENDING" | "PREPARING" | "READY" | "SERVED";
  total: number;
  createdAt: string;
  table: { name: string };
  branch: { name: string };
  items: { id: string; name: string; price: number; quantity: number }[];
}

function responseError(body: unknown, fallback: string) {
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : fallback;
}

export function StaffPortal({
  role,
  authenticatedRole,
}: {
  role: StaffRole;
  authenticatedRole: StaffRole | null;
}) {
  const router = useRouter();
  const [sessionRole, setSessionRole] = useState(authenticatedRole);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const isAuthenticated = sessionRole === role;
  const title = role === "chef" ? "AkdoŞef" : "AkdoGarson";

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/staff/orders", { cache: "no-store" });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseError(body, "Siparişler alınamadı."));
      }
      if (
        typeof body !== "object" ||
        body === null ||
        !("role" in body) ||
        body.role !== role ||
        !("orders" in body) ||
        !Array.isArray(body.orders)
      ) {
        throw new Error("Personel oturumu bu ekran için geçerli değil.");
      }
      setOrders(body.orders as StaffOrder[]);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Siparişler alınamadı.",
      );
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const initialLoad = window.setTimeout(() => void loadOrders(), 0);
    const timer = window.setInterval(() => void loadOrders(), 5000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [isAuthenticated, loadOrders]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginLoading(true);
    setError("");
    try {
      const response = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, username, password }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseError(body, "Giriş yapılamadı."));
      }
      setLoading(true);
      setSessionRole(role);
      setPassword("");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Giriş yapılamadı.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function updateOrder(order: StaffOrder, status: "PREPARING" | "READY" | "SERVED") {
    setBusyOrderId(order.id);
    setError("");
    try {
      const response = await fetch(`/api/staff/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseError(body, "Sipariş durumu güncellenemedi."));
      }
      await loadOrders();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Sipariş durumu güncellenemedi.",
      );
    } finally {
      setBusyOrderId(null);
    }
  }

  async function logout() {
    setError("");
    try {
      const response = await fetch("/api/staff/logout", { method: "POST" });
      if (!response.ok) throw new Error("Oturum kapatılamadı.");
      setSessionRole(null);
      setOrders([]);
      router.refresh();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Oturum kapatılamadı.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f1f0e9] px-4 py-6 text-[#202c26] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#203d31] text-[#e2c47e]">
              <ChefHat size={23} />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#96743c]">
                AKDO SİPARİŞ SİSTEMİ
              </p>
              <h1 className="font-editorial mt-1 text-3xl text-[#203d31]">{title}</h1>
            </div>
          </div>
          {isAuthenticated && (
            <div className="flex gap-2">
              <Button
                className="h-10 gap-2 rounded-xl border-[#dedfd5] bg-white text-[#405846]"
                onClick={() => void loadOrders()}
                variant="outline"
              >
                <RefreshCw size={15} />
                Yenile
              </Button>
              <Button
                className="h-10 gap-2 rounded-xl border-[#dedfd5] bg-white text-[#405846]"
                onClick={() => void logout()}
                variant="outline"
              >
                <LogOut size={15} />
                Çıkış
              </Button>
            </div>
          )}
        </header>

        {!isAuthenticated ? (
          <section className="mx-auto max-w-md rounded-[24px] border border-[#e0e1d8] bg-[#fffefa] p-6 shadow-[0_12px_40px_#24372c10] sm:p-8">
            <h2 className="font-editorial text-2xl text-[#203d31]">
              {title} personel girişi
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#737a70]">
              Bu alan yalnızca yetkili {role === "chef" ? "mutfak" : "servis"} personeli içindir.
            </p>
            {sessionRole && sessionRole !== role && (
              <p className="mt-4 rounded-xl bg-[#fff5dd] px-4 py-3 text-sm text-[#725c36]">
                Başka bir personel rolüyle giriş yapılmış. Devam etmek için bu alana ait bilgilerle giriş yapın.
              </p>
            )}
            <form className="mt-6 space-y-4" onSubmit={login}>
              <label className="block space-y-2 text-sm font-medium text-[#405247]">
                Kullanıcı adı
                <Input
                  autoComplete="username"
                  className="h-11 rounded-xl border-[#dedfd5] bg-white px-4"
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  value={username}
                />
              </label>
              <label className="block space-y-2 text-sm font-medium text-[#405247]">
                Parola
                <Input
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-[#dedfd5] bg-white px-4"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>
              {error && <p className="text-sm text-[#a63e35]" role="alert">{error}</p>}
              <Button
                className="h-11 w-full rounded-xl bg-[#203d31] text-white hover:bg-[#2d5542]"
                disabled={loginLoading}
                type="submit"
              >
                {loginLoading ? <LoaderCircle className="animate-spin" /> : null}
                Güvenli giriş yap
              </Button>
            </form>
          </section>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#e3dfd4] bg-[#faf9f5] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-[#39483d]">
                  {role === "chef" ? "Mutfak kuyruğu" : "Teslim edilmeyi bekleyenler"}
                </p>
                <p className="mt-1 text-xs text-[#737a70]">
                  Siparişler otomatik olarak yenilenir.
                </p>
              </div>
              <span className="rounded-full bg-[#e9eee7] px-3 py-1.5 text-xs font-semibold text-[#31513e]">
                {orders.length} sipariş
              </span>
            </div>
            {error && (
              <p className="mb-4 rounded-xl bg-[#fbefed] px-4 py-3 text-sm text-[#a63e35]" role="alert">
                {error}
              </p>
            )}
            {orders.length === 0 ? (
              <section className="grid min-h-64 place-items-center rounded-[22px] border border-dashed border-[#d8d8cd] bg-[#fffefa] p-6 text-center">
                <div>
                  {loading ? (
                    <LoaderCircle className="mx-auto animate-spin text-[#96743c]" size={24} />
                  ) : (
                    <CircleCheck className="mx-auto text-[#668c67]" size={25} />
                  )}
                  <p className="mt-3 text-sm text-[#737a70]">
                    {loading ? "Siparişler yükleniyor..." : "Bekleyen sipariş yok."}
                  </p>
                </div>
              </section>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {orders.map((order) => (
                  <article
                    className="rounded-[22px] border border-[#e3dfd4] bg-[#fffefa] p-5 shadow-[0_5px_20px_#3c32100a]"
                    key={order.id}
                  >
                    <header className="flex items-start justify-between gap-4 border-b border-[#eeeae2] pb-4">
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.14em] text-[#96743c]">
                          {order.branch.name}
                        </p>
                        <h2 className="font-editorial mt-1 text-2xl text-[#203d31]">{order.table.name}</h2>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#39483d]">{formatPrice(order.total)}</p>
                        <time className="mt-1 block text-[11px] text-[#8b9187]">
                          {new Date(order.createdAt).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    </header>
                    <ul className="space-y-3 py-4">
                      {order.items.map((item) => (
                        <li className="flex justify-between gap-3 text-sm" key={item.id}>
                          <span className="font-semibold text-[#39483d]">
                            <span className="mr-2 inline-grid size-6 place-items-center rounded-lg bg-[#edf2e9] text-xs text-[#31513e]">
                              {item.quantity}
                            </span>
                            {item.name}
                          </span>
                          <span className="shrink-0 text-xs text-[#737a70]">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="h-11 w-full rounded-xl bg-[#203d31] text-white hover:bg-[#2d5542]"
                      disabled={busyOrderId === order.id}
                      onClick={() =>
                        void updateOrder(
                          order,
                          role === "waiter"
                            ? "SERVED"
                            : order.status === "PENDING"
                              ? "PREPARING"
                              : "READY",
                        )
                      }
                      type="button"
                    >
                      {busyOrderId === order.id ? (
                        <LoaderCircle className="animate-spin" />
                      ) : null}
                      {role === "waiter"
                        ? "Sipariş teslim edildi"
                        : order.status === "PENDING"
                          ? "Hazırlamaya al"
                          : "Hazır"}
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
