"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Search,
  Wallet,
} from "lucide-react";

type LedgerEntry = {
  id: string;
  kind: "ORDER_PAYMENT" | "BALANCE_TOPUP" | "BALANCE_ADJUSTMENT";
  at: string;
  amount: number;
  cashChange: number;
  balanceChange: number;
  paymentMethod: string | null;
  description: string;
  orderId: string | null;
  branchName: string | null;
  tableName: string | null;
  member: {
    firstName: string;
    lastName: string;
    memberNumber: string;
  } | null;
  performedBy: string | null;
  status: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  reviewNote: string | null;
};

type LedgerResponse = {
  entries: LedgerEntry[];
  nextCursor: string | null;
  summary: {
    cashReceived: number;
    cashOrderCount: number;
    topupCount: number;
    memberBalanceSales: number;
    memberBalanceSaleCount: number;
    balanceAdjustments: number;
    adjustmentCount: number;
  };
};

type Filters = {
  from: string;
  to: string;
  type: "ALL" | "ORDERS" | "BALANCE";
  search: string;
};

const initialSummary: LedgerResponse["summary"] = {
  cashReceived: 0,
  cashOrderCount: 0,
  topupCount: 0,
  memberBalanceSales: 0,
  memberBalanceSaleCount: 0,
  balanceAdjustments: 0,
  adjustmentCount: 0,
};

const money = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

function entryKindLabel(kind: LedgerEntry["kind"]) {
  switch (kind) {
    case "ORDER_PAYMENT":
      return "Sipariş tahsilatı";
    case "BALANCE_TOPUP":
      return "Bakiye yükleme";
    case "BALANCE_ADJUSTMENT":
      return "Bakiye düzeltme";
  }
}

function paymentLabel(method: string | null) {
  switch (method) {
    case "CASH":
      return "Nakit";
    case "EXTERNAL_POS":
      return "Harici POS";
    case "MEMBER_BALANCE":
      return "AkdoKasa";
    default:
      return "Belirtilmemiş";
  }
}

function memberLabel(member: LedgerEntry["member"]) {
  return member
    ? `${member.firstName} ${member.lastName} · ${member.memberNumber}`
    : "Üye bilgisi yok";
}

export function FinancialLedgerPage() {
  const [filters, setFilters] = useState<Filters>({
    from: "",
    to: "",
    type: "ALL",
    search: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState(initialSummary);
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPage = useCallback(
    async (nextCursor: string | null, history: string[]) => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ type: appliedFilters.type });
      if (appliedFilters.from) params.set("from", appliedFilters.from);
      if (appliedFilters.to) params.set("to", appliedFilters.to);
      if (appliedFilters.search) params.set("search", appliedFilters.search);
      if (nextCursor) params.set("cursor", nextCursor);

      try {
        const response = await fetch(`/api/admin/ledger?${params}`, {
          cache: "no-store",
        });
        const result = (await response.json()) as
          | LedgerResponse
          | { error?: string };
        if (!response.ok || !("entries" in result)) {
          throw new Error(
            "error" in result ? result.error : "Defter kayıtları alınamadı.",
          );
        }
        setEntries(result.entries);
        setSummary(result.summary);
        setCursor(result.nextCursor);
        setCursorHistory(history);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Defter kayıtları alınamadı.",
        );
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ type: appliedFilters.type });
    if (appliedFilters.from) params.set("from", appliedFilters.from);
    if (appliedFilters.to) params.set("to", appliedFilters.to);
    if (appliedFilters.search) params.set("search", appliedFilters.search);

    void fetch(`/api/admin/ledger?${params}`, { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as
          | LedgerResponse
          | { error?: string };
        if (!response.ok || !("entries" in result)) {
          throw new Error(
            "error" in result ? result.error : "Defter kayıtları alınamadı.",
          );
        }
        return result;
      })
      .then((result) => {
        if (!active) return;
        setEntries(result.entries);
        setSummary(result.summary);
        setCursor(result.nextCursor);
        setCursorHistory([]);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Defter kayıtları alınamadı.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appliedFilters]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters(filters);
    setCursorHistory([]);
    setCursor(null);
    setLoading(true);
    setError("");
  }

  function goNext() {
    if (!cursor) return;
    void loadPage(cursor, [...cursorHistory, cursor]);
  }

  function goPrevious() {
    const history = cursorHistory.slice(0, -1);
    void loadPage(history.at(-1) ?? null, history);
  }

  const currentPage = cursorHistory.length + 1;

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#92733f]">
            AKDO YÖNETİM · FİNANS
          </p>
          <h1 className="font-serif text-4xl tracking-tight text-[#23372b] sm:text-5xl">
            Finans defteri
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#748076]">
            Sipariş tahsilatları, AkdoKasa hareketleri ve üye bakiye kayıtları.
            Defter; kasa içi izleme içindir, mali belge yerine geçmez.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#dfd6c3] bg-[#faf8f2] px-4 py-2 text-xs font-medium text-[#735b32]">
          <BookOpenText size={15} />
          Tüm şubeler
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <SummaryCard
          icon={<ArrowDownLeft size={17} />}
          label="Kaydedilen nakit / POS girişi"
          value={money.format(summary.cashReceived)}
          note={`${summary.cashOrderCount} sipariş · ${summary.topupCount} bakiye yüklemesi`}
          accent
        />
        <SummaryCard
          icon={<Wallet size={17} />}
          label="AkdoKasa ile ödenen siparişler"
          value={money.format(summary.memberBalanceSales)}
          note={`${summary.memberBalanceSaleCount} sipariş · nakit tahsilat toplamına dahil değil`}
        />
        <SummaryCard
          icon={<BookOpenText size={17} />}
          label="Net yönetici bakiye düzeltmesi"
          value={money.format(summary.balanceAdjustments)}
          note={`${summary.adjustmentCount} kayıt · nakit hareketi değildir`}
        />
      </div>

      <form
        className="mb-5 grid gap-3 rounded-2xl border border-[#e5e1d7] bg-[#fbfaf6] p-4 md:grid-cols-[1fr_1fr_180px_minmax(200px,1.3fr)_auto]"
        onSubmit={applyFilters}
      >
        <label className="text-[11px] font-semibold text-[#647166]">
          Başlangıç
          <input
            className="mt-1.5 h-10 w-full rounded-lg border border-[#e4e0d7] bg-white px-3 text-sm text-[#27372d] outline-none focus:border-[#a9854c]"
            onChange={(event) =>
              setFilters({ ...filters, from: event.target.value })
            }
            type="date"
            value={filters.from}
          />
        </label>
        <label className="text-[11px] font-semibold text-[#647166]">
          Bitiş
          <input
            className="mt-1.5 h-10 w-full rounded-lg border border-[#e4e0d7] bg-white px-3 text-sm text-[#27372d] outline-none focus:border-[#a9854c]"
            onChange={(event) =>
              setFilters({ ...filters, to: event.target.value })
            }
            type="date"
            value={filters.to}
          />
        </label>
        <label className="text-[11px] font-semibold text-[#647166]">
          İşlem türü
          <select
            className="mt-1.5 h-10 w-full rounded-lg border border-[#e4e0d7] bg-white px-3 text-sm text-[#27372d] outline-none focus:border-[#a9854c]"
            onChange={(event) =>
              setFilters({
                ...filters,
                type: event.target.value as Filters["type"],
              })
            }
            value={filters.type}
          >
            <option value="ALL">Tüm işlemler</option>
            <option value="ORDERS">Sipariş tahsilatları</option>
            <option value="BALANCE">Bakiye işlemleri</option>
          </select>
        </label>
        <label className="text-[11px] font-semibold text-[#647166]">
          Ara
          <span className="relative mt-1.5 block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#899287]"
              size={16}
            />
            <input
              className="h-10 w-full rounded-lg border border-[#e4e0d7] bg-white pl-9 pr-3 text-sm text-[#27372d] outline-none placeholder:text-[#a3a99f] focus:border-[#a9854c]"
              onChange={(event) =>
                setFilters({ ...filters, search: event.target.value })
              }
              placeholder="Üye, masa, ürün, işlem no..."
              value={filters.search}
            />
          </span>
        </label>
        <button
          className="h-10 self-end rounded-lg bg-[#26392d] px-5 text-sm font-semibold text-[#f4e7c7] transition hover:bg-[#344a3a] disabled:opacity-50"
          disabled={loading}
          type="submit"
        >
          Uygula
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-[#e5e1d7] bg-[#fbfaf6]">
        <div className="flex items-center justify-between border-b border-[#ebe7df] px-5 py-4">
          <div>
            <h2 className="font-serif text-xl text-[#293b30]">
              İşlem kayıtları
            </h2>
            <p className="mt-0.5 text-xs text-[#8a9389]">
              Tarih ve saate göre en yeniden eskiye
            </p>
          </div>
          <span className="rounded-full bg-[#f0ede5] px-3 py-1 text-[11px] font-semibold text-[#6e776d]">
            Sayfa {currentPage}
          </span>
        </div>

        {error && (
          <div
            className="m-4 rounded-xl border border-[#e7c9bd] bg-[#fbf0eb] px-4 py-3 text-sm text-[#8e4737]"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-[#f5f3ed] text-[10px] font-bold tracking-[0.12em] text-[#858d83]">
              <tr>
                <th className="px-5 py-3">TARİH / KAYIT</th>
                <th className="px-4 py-3">İŞLEM</th>
                <th className="px-4 py-3">ŞUBE / ÜYE</th>
                <th className="px-4 py-3">ÖDEME / SORUMLU</th>
                <th className="px-4 py-3 text-right">TUTAR</th>
                <th className="px-5 py-3 text-right">KASA ETKİSİ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efede6]">
              {loading ? (
                <tr>
                  <td
                    className="px-5 py-14 text-center text-sm text-[#849087]"
                    colSpan={6}
                  >
                    Defter kayıtları yükleniyor...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td
                    className="px-5 py-14 text-center text-sm text-[#849087]"
                    colSpan={6}
                  >
                    Seçilen ölçütlere uygun kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr className="align-top" key={entry.id}>
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-[#3c4b40]">
                        {new Date(entry.at).toLocaleString("tr-TR")}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-[#92998f]">
                        {entry.id}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-[#f1eee5] px-2.5 py-1 text-[10px] font-semibold text-[#76633e]">
                        {entryKindLabel(entry.kind)}
                      </span>
                      <p className="mt-2 text-xs text-[#657268]">
                        {entry.description}
                      </p>
                      {entry.items.length > 0 && (
                        <details className="mt-2 text-xs text-[#718076]">
                          <summary className="w-fit cursor-pointer font-medium text-[#8b6d3b] hover:text-[#594727]">
                            Ürün detayları ({entry.items.length})
                          </summary>
                          <ul className="mt-2 space-y-1 pl-3">
                            {entry.items.map((item) => (
                              <li key={item.id}>
                                {item.quantity} × {item.name} ·{" "}
                                {money.format(item.price * item.quantity)}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-medium text-[#3c4b40]">
                        {entry.branchName ?? "Şube bilgisi yok"}
                        {entry.tableName ? ` · ${entry.tableName}` : ""}
                      </p>
                      <p className="mt-1 text-[11px] text-[#858f85]">
                        {memberLabel(entry.member)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-medium text-[#3c4b40]">
                        {paymentLabel(entry.paymentMethod)}
                      </p>
                      <p className="mt-1 text-[11px] text-[#858f85]">
                        İşleyen: {entry.performedBy || "Kayıtlı değil"}
                      </p>
                      {entry.reviewNote && (
                        <p className="mt-1 max-w-[220px] text-[11px] text-[#858f85]">
                          Not: {entry.reviewNote}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm font-semibold text-[#34463a]">
                        {entry.kind === "BALANCE_ADJUSTMENT" &&
                        entry.balanceChange > 0
                          ? "+"
                          : entry.kind === "BALANCE_ADJUSTMENT" &&
                              entry.balanceChange < 0
                            ? "−"
                            : ""}
                        {money.format(entry.amount)}
                      </p>
                      {entry.kind === "ORDER_PAYMENT" &&
                        entry.paymentMethod === "MEMBER_BALANCE" && (
                          <p className="mt-1 text-[10px] text-[#8a9389]">
                            Bakiye düşümü{" "}
                            {money.format(Math.abs(entry.balanceChange))}
                          </p>
                        )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={
                          entry.cashChange > 0
                            ? "font-semibold text-[#3f7553]"
                            : "text-[#92998f]"
                        }
                      >
                        {entry.cashChange > 0
                          ? `+${money.format(entry.cashChange)}`
                          : "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#ebe7df] px-5 py-3">
          <p className="text-[11px] text-[#8a9389]">
            Kasa etkisi yalnızca nakit ve POS tahsilatları ile onaylı nakit
            bakiye yüklemelerini sayar.
          </p>
          <div className="flex gap-2">
            <button
              aria-label="Önceki sayfa"
              className="grid size-9 place-items-center rounded-lg border border-[#e4e0d7] text-[#5b685d] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={loading || cursorHistory.length === 0}
              onClick={goPrevious}
              type="button"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              aria-label="Sonraki sayfa"
              className="grid size-9 place-items-center rounded-lg border border-[#e4e0d7] text-[#5b685d] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={loading || !cursor}
              onClick={goNext}
              type="button"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  note,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-5 ${
        accent
          ? "border-[#293f30] bg-[#293f30] text-[#f5eddc]"
          : "border-[#e5e1d7] bg-[#fbfaf6] text-[#293b30]"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-medium opacity-70">
        {icon}
        {label}
      </div>
      <p className="mt-4 font-serif text-3xl tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] leading-5 opacity-60">{note}</p>
    </article>
  );
}
