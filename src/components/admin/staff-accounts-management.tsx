"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StaffAccount {
  id: string;
  username: string;
  role: "chef" | "waiter";
  isActive: boolean;
  createdAt: string;
}

function getError(body: unknown) {
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
}

export function StaffAccountsManagement({
  employees,
}: {
  employees: StaffAccount[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function createEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
          role: formData.get("role"),
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getError(body));
      form.reset();
      router.refresh();
    } catch (createError) {
      setMessage(
        createError instanceof Error
          ? createError.message
          : "Çalışan hesabı oluşturulamadı.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function updateEmployee(
    event: FormEvent<HTMLFormElement>,
    employee: StaffAccount,
  ) {
    event.preventDefault();
    setBusyId(employee.id);
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    try {
      const response = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          role: formData.get("role"),
          isActive: formData.get("isActive") === "on",
          ...(password ? { password } : {}),
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getError(body));
      setMessage("Çalışan hesabı güncellendi.");
      router.refresh();
    } catch (updateError) {
      setMessage(
        updateError instanceof Error
          ? updateError.message
          : "Çalışan hesabı güncellenemedi.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[22px] border border-[#ebe8e0] bg-white p-5 shadow-[0_5px_20px_#3c32100a] sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#f5eddf] text-[#a67a36]">
            <Plus size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[#49443a]">
              Personel hesabı oluştur
            </h2>
            <p className="mt-1 text-xs text-[#837b70]">
              Hesaplar AkdoŞef veya AkdoGarson alanına giriş yapabilir.
            </p>
          </div>
        </div>
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
          onSubmit={createEmployee}
        >
          <Input
            autoComplete="username"
            className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
            maxLength={80}
            minLength={3}
            name="username"
            placeholder="Kullanıcı adı"
            required
          />
          <Input
            autoComplete="new-password"
            className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
            minLength={8}
            name="password"
            placeholder="Parola (en az 8 karakter)"
            required
            type="password"
          />
          <select
            aria-label="Personel rolü"
            className="h-11 rounded-xl border border-[#e8e1d6] bg-white px-3 text-sm text-[#49443a]"
            name="role"
          >
            <option value="chef">AkdoŞef</option>
            <option value="waiter">AkdoGarson</option>
          </select>
          <Button
            className="h-11 rounded-xl bg-[#203d31] px-5 text-white hover:bg-[#2d5542]"
            disabled={creating}
            type="submit"
          >
            {creating ? <LoaderCircle className="animate-spin" /> : <Plus />}
            Hesap oluştur
          </Button>
        </form>
        {message && (
          <p className="mt-4 text-sm text-[#a45142]" role="status">{message}</p>
        )}
      </div>

      <div className="rounded-[22px] border border-[#ebe8e0] bg-white p-5 shadow-[0_5px_20px_#3c32100a] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#49443a]">Personel hesapları</h2>
          <span className="text-xs text-[#837b70]">{employees.length} hesap</span>
        </div>
        {employees.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d8d8cd] px-5 py-10 text-center text-sm text-[#737a70]">
            Henüz personel hesabı oluşturulmadı.
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map((employee) => (
              <form
                className="grid items-center gap-3 rounded-xl border border-[#eeeae2] p-4 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1.2fr_auto_auto]"
                key={employee.id}
                onSubmit={(event) => void updateEmployee(event, employee)}
              >
                <label className="space-y-1 text-xs font-medium text-[#675c4d]">
                  Kullanıcı adı
                  <Input
                    autoComplete="username"
                    className="h-10 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
                    defaultValue={employee.username}
                    maxLength={80}
                    minLength={3}
                    name="username"
                    required
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[#675c4d]">
                  Rol
                  <select
                    className="h-10 w-full rounded-xl border border-[#e8e1d6] bg-white px-3 text-sm"
                    defaultValue={employee.role}
                    name="role"
                  >
                    <option value="chef">AkdoŞef</option>
                    <option value="waiter">AkdoGarson</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs font-medium text-[#675c4d]">
                  Yeni parola <span className="font-normal">(isteğe bağlı)</span>
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
                    defaultChecked={employee.isActive}
                    name="isActive"
                    type="checkbox"
                  />
                  Aktif
                </label>
                <Button
                  className="h-10 rounded-xl bg-[#203d31] px-4 text-white hover:bg-[#2d5542]"
                  disabled={busyId === employee.id}
                  type="submit"
                >
                  {busyId === employee.id ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    "Kaydet"
                  )}
                </Button>
              </form>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
