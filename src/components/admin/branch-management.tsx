"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, MapPin, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminBranch } from "@/lib/branch-types";
import { turkeyLocations } from "@/lib/turkey-locations";

interface FormMessage {
  text: string;
  isError: boolean;
}

async function getResponseError(response: Response) {
  const body: unknown = await response.json().catch(() => null);

  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return body.error;
  }

  return "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
}

function BranchLocationFields({
  city,
  district,
  branchName,
}: {
  city: string;
  district: string;
  branchName?: string;
}) {
  const [selectedCity, setSelectedCity] = useState(city);
  const [selectedDistrict, setSelectedDistrict] = useState(district);
  const province = turkeyLocations.find(
    (location) => location.city === selectedCity,
  );

  return (
    <fieldset className="space-y-3 rounded-xl border border-[#eee8dc] p-3">
      <legend className="px-1 text-xs font-semibold text-[#675c4d]">
        Konum bilgileri
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-medium text-[#675c4d]">
          Şehir
          <select
            aria-label={branchName ? `${branchName} şehri` : "Şehir"}
            autoComplete="address-level1"
            className="h-11 w-full rounded-xl border border-[#e8e1d6] bg-white px-3 text-sm text-[#49443a]"
            onChange={(event) => {
              setSelectedCity(event.target.value);
              setSelectedDistrict("");
            }}
            name="city"
            required
            value={selectedCity}
          >
            <option disabled value="">
              Şehir seçin
            </option>
            {turkeyLocations.map((location) => (
              <option key={location.city} value={location.city}>
                {location.city}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-[#675c4d]">
          İlçe
          <select
            aria-label={branchName ? `${branchName} ilçesi` : "İlçe"}
            autoComplete="address-level2"
            className="h-11 w-full rounded-xl border border-[#e8e1d6] bg-white px-3 text-sm text-[#49443a] disabled:bg-[#f7f6f2] disabled:text-[#a39d92]"
            onChange={(event) => setSelectedDistrict(event.target.value)}
            disabled={!province}
            name="district"
            required
            value={
              province?.districts.includes(selectedDistrict)
                ? selectedDistrict
                : ""
            }
          >
            <option disabled value="">
              {province ? "İlçe seçin" : "Önce şehir seçin"}
            </option>
            {province?.districts.map((districtName) => (
              <option key={districtName} value={districtName}>
                {districtName}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selectedCity && !province && (
        <p className="text-xs text-[#a45142]">
          Kayıtlı şehir listede bulunamadı; lütfen şehir ve ilçeyi yeniden seçin.
        </p>
      )}
    </fieldset>
  );
}

export function BranchManagement({
  activeBranchId,
  branches,
}: {
  activeBranchId: string;
  branches: AdminBranch[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [savingBranchId, setSavingBranchId] = useState<string | null>(null);
  const [message, setMessage] = useState<FormMessage | null>(null);

  async function createBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          city: formData.get("city"),
          district: formData.get("district"),
          address: formData.get("address"),
        }),
      });

      if (!response.ok) throw new Error(await getResponseError(response));

      const result: unknown = await response.json();
      if (
        typeof result !== "object" ||
        result === null ||
        !("branch" in result) ||
        typeof result.branch !== "object" ||
        result.branch === null ||
        !("id" in result.branch) ||
        typeof result.branch.id !== "string"
      ) {
        throw new Error("Şube oluşturuldu ancak şube bilgisi alınamadı.");
      }

      router.push(
        `/login/categories?branchId=${encodeURIComponent(result.branch.id)}`,
      );
      router.refresh();
    } catch (error) {
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Şube oluşturulamadı. Lütfen tekrar deneyin.",
        isError: true,
      });
    } finally {
      setCreating(false);
    }
  }

  async function updateBranch(
    event: FormEvent<HTMLFormElement>,
    branch: AdminBranch,
  ) {
    event.preventDefault();
    setSavingBranchId(branch.id);
    setMessage(null);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/admin/branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          city: formData.get("city"),
          district: formData.get("district"),
          address: formData.get("address"),
        }),
      });
      if (!response.ok) throw new Error(await getResponseError(response));

      setMessage({ text: "Şube bilgileri güncellendi.", isError: false });
      router.refresh();
    } catch (error) {
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Şube güncellenemedi. Lütfen tekrar deneyin.",
        isError: true,
      });
    } finally {
      setSavingBranchId(null);
    }
  }

  async function toggleBranch(branch: AdminBranch) {
    setSavingBranchId(branch.id);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !branch.isActive }),
      });
      if (!response.ok) throw new Error(await getResponseError(response));

      if (branch.id === activeBranchId) {
        router.push("/login/branches");
      }
      router.refresh();
    } catch (error) {
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Şube durumu değiştirilemedi.",
        isError: true,
      });
    } finally {
      setSavingBranchId(null);
    }
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
      <section className="rounded-[22px] border border-[#ebe8e0] bg-white p-5 shadow-[0_5px_20px_#3c32100a] sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#f5eddf] text-[#a67a36]">
            <Plus size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[#49443a]">Yeni şube</h2>
            <p className="mt-1 text-xs text-[#837b70]">
              Her şubenin kategorileri ve menüsü birbirinden ayrı yönetilir.
            </p>
          </div>
        </div>

        <form className="mt-5 space-y-3" onSubmit={createBranch}>
          <Input
            autoComplete="off"
            className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
            maxLength={80}
            minLength={2}
            name="name"
            placeholder="Şube adı (ör. İstanbul Kadıköy)"
            required
          />
          <BranchLocationFields city="" district="" />
          <Input
            autoComplete="street-address"
            className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
            maxLength={200}
            name="address"
            placeholder="Açık adres (isteğe bağlı)"
          />
          {message && (
            <p
              className={`text-xs ${message.isError ? "text-[#a63e35]" : "text-[#61764f]"}`}
              role={message.isError ? "alert" : "status"}
            >
              {message.text}
            </p>
          )}
          <Button
            className="h-10 rounded-xl bg-[#a67a36] px-4 text-white hover:bg-[#8e6426]"
            disabled={creating}
            type="submit"
          >
            {creating ? <LoaderCircle className="animate-spin" /> : <Plus />}
            Şube oluştur ve menüsünü düzenle
          </Button>
        </form>

        <p className="mt-5 rounded-xl border border-[#e9e3d6] bg-[#fbf8f1] p-3 text-xs leading-5 text-[#756a57]">
          Ziyaretçi menüsünde varsayılan şube gösterilir. Diğer şubelerin
          menülerini yönetim panelinden seçebilirsiniz.
        </p>
      </section>

      <section className="overflow-hidden rounded-[22px] border border-[#ebe8e0] bg-white shadow-[0_5px_20px_#3c32100a]">
        <div className="flex items-center justify-between border-b border-[#f0eee8] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#a67a36]">
              ŞUBE AĞI
            </p>
            <h2 className="font-editorial mt-1.5 text-xl text-[#3e3a32]">
              Şubeler
            </h2>
          </div>
          <span className="rounded-full bg-[#f7f6f2] px-3 py-1 text-xs text-[#77766e]">
            {branches.length}
          </span>
        </div>
        <div className="divide-y divide-[#f1eee8] px-5 sm:px-6">
          {branches.map((branch) => (
            <article className="py-5" key={branch.id}>
              <form
                className="space-y-3"
                key={`${branch.id}-${branch.name}-${branch.city}-${branch.district}-${branch.address}`}
                onSubmit={(event) => void updateBranch(event, branch)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-[#a67a36]" size={15} />
                    <span className="text-sm font-semibold text-[#49443a]">
                      {branch.name}
                    </span>
                    {branch.isDefault && (
                      <span className="rounded-full bg-[#f5eddf] px-2 py-0.5 text-[9px] text-[#91682f]">
                        Varsayılan
                      </span>
                    )}
                    {!branch.isActive && (
                      <span className="rounded-full bg-[#f3f1ed] px-2 py-0.5 text-[9px] text-[#827c70]">
                        Pasif
                      </span>
                    )}
                  </div>
                  {branch.isDefault ? (
                    <span className="text-[10px] text-[#61764f]">
                      Ziyaretçi menüsü
                    </span>
                  ) : (
                    <button
                      className="text-xs font-medium text-[#806233] hover:underline"
                      disabled={savingBranchId === branch.id}
                      onClick={() => void toggleBranch(branch)}
                      type="button"
                    >
                      {branch.isActive ? "Pasif yap" : "Aktif yap"}
                    </button>
                  )}
                </div>
                <Input
                  aria-label={`${branch.name} şube adı`}
                  className="h-10 rounded-xl border-[#e8e1d6] px-3 text-sm"
                  defaultValue={branch.name}
                  maxLength={80}
                  minLength={2}
                  name="name"
                  required
                />
                <BranchLocationFields
                  branchName={branch.name}
                  city={branch.city}
                  district={branch.district}
                />
                <Input
                  aria-label={`${branch.name} açık adresi`}
                  autoComplete="street-address"
                  className="h-10 rounded-xl border-[#e8e1d6] px-3 text-sm"
                  defaultValue={branch.address}
                  maxLength={200}
                  name="address"
                  placeholder="Açık adres (isteğe bağlı)"
                />
                <Button
                  className="h-9 rounded-xl border-[#e8e1d6] text-[#5b594f] hover:bg-[#f7f4ed]"
                  disabled={savingBranchId === branch.id}
                  type="submit"
                  variant="outline"
                >
                  {savingBranchId === branch.id ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Save />
                  )}
                  Bilgileri kaydet
                </Button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
