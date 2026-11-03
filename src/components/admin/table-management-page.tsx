"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, QrCode } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminBranch } from "@/lib/branch-types";

interface DiningTable {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export function TableManagementPage({
  activeBranch,
  branches,
  tables,
}: {
  activeBranch: AdminBranch;
  branches: AdminBranch[];
  tables: DiningTable[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [busyTableId, setBusyTableId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function getError(response: Response) {
    const body: unknown = await response.json().catch(() => null);
    return typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
      ? body.error
      : "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
  }

  async function addTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          branchId: activeBranch.id,
        }),
      });
      if (!response.ok) throw new Error(await getError(response));

      form.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Masa eklenemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTable(table: DiningTable) {
    setBusyTableId(table.id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/tables/${table.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !table.isActive }),
      });
      if (!response.ok) throw new Error(await getError(response));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Masa durumu değiştirilemedi.");
    } finally {
      setBusyTableId(null);
    }
  }

  return (
    <AdminLayout
      activeBranchId={activeBranch.id}
      activePath="/login/tables"
      branches={branches}
    >
      <section className="mb-6">
        <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#96743c]">
          <QrCode size={14} />
          MASA SİPARİŞİ
        </div>
        <h1 className="font-editorial mt-2 text-4xl tracking-tight text-[#203d31]">
          Masa kodları
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#737a70]">
          Her masaya özel altı haneli kod üretin. Misafirler bu kodla masadan
          sipariş verebilir.
        </p>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)]">
        <form
          className="space-y-4 rounded-[22px] border border-[#ebe8e0] bg-white p-5 shadow-[0_5px_20px_#3c32100a] sm:p-6"
          onSubmit={addTable}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#f5eddf] text-[#a67a36]">
              <Plus size={18} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#49443a]">Masa ekle</h2>
              <p className="mt-1 text-xs text-[#837b70]">{activeBranch.name}</p>
            </div>
          </div>
          <label className="block space-y-2 text-xs font-medium text-[#675c4d]">
            Masa adı veya numarası
            <Input
              autoComplete="off"
              className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
              maxLength={40}
              name="name"
              placeholder="Örn. Bahçe 1"
              required
            />
          </label>
          <p className="text-xs leading-5 text-[#837b70]">
            Kod otomatik ve benzersiz olarak oluşturulur.
          </p>
          <Button
            className="h-11 w-full rounded-xl bg-[#203d31] text-white hover:bg-[#2d5542]"
            disabled={saving}
            type="submit"
          >
            {saving ? <LoaderCircle className="animate-spin" /> : <Plus />}
            Masa ekle ve kod üret
          </Button>
          {message && (
            <p className="rounded-xl bg-[#fbefed] px-4 py-3 text-sm text-[#a63e35]" role="alert">
              {message}
            </p>
          )}
        </form>

        <section className="rounded-[22px] border border-[#ebe8e0] bg-white p-5 shadow-[0_5px_20px_#3c32100a] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#49443a]">Masalar</h2>
            <span className="text-xs text-[#837b70]">{tables.length} masa</span>
          </div>
          {tables.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d8d8cd] px-5 py-12 text-center">
              <QrCode className="mx-auto text-[#8b9187]" size={24} />
              <p className="mt-3 text-sm text-[#737a70]">
                Henüz masa eklenmedi.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#eeeae2]">
              {tables.map((table) => (
                <article
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-1"
                  key={table.id}
                >
                  <div>
                    <p className="text-sm font-semibold text-[#39483d]">{table.name}</p>
                    <p className="mt-1 font-mono text-lg tracking-[0.2em] text-[#8c692f]">
                      {table.code}
                    </p>
                  </div>
                  <button
                    aria-pressed={table.isActive}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                      table.isActive
                        ? "bg-[#e9eee7] text-[#31513e] hover:bg-[#f8ece8] hover:text-[#a45142]"
                        : "bg-[#f3eddd] text-[#7b6132] hover:bg-[#e9eee7] hover:text-[#31513e]"
                    }`}
                    disabled={busyTableId === table.id}
                    onClick={() => toggleTable(table)}
                    type="button"
                  >
                    {busyTableId === table.id
                      ? "Kaydediliyor..."
                      : table.isActive
                        ? "Kullanımda"
                        : "Pasif"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
