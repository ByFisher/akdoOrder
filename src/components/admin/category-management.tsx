"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  FolderPlus,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { MenuCategory } from "@/lib/menu-types";

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

export function CategoryManagement({
  branchId,
  categories,
}: {
  branchId: string;
  categories: MenuCategory[];
}) {
  const [creating, setCreating] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [editMessage, setEditMessage] = useState<FormMessage | null>(null);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(
        `/api/admin/categories?branchId=${encodeURIComponent(branchId)}`,
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          icon: formData.get("icon"),
        }),
        },
      );

      if (!response.ok) {
        throw new Error(await getResponseError(response));
      }

      form.reset();
      setMessage({
        text: "Kategori oluşturuldu ve menüye eklendi.",
        isError: false,
      });
      router.refresh();
    } catch (error) {
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Kategori oluşturulamadı. Lütfen tekrar deneyin.",
        isError: true,
      });
    } finally {
      setCreating(false);
    }
  }

  async function updateCategory(
    category: MenuCategory,
    data: { name?: string; icon?: string; isActive?: boolean },
  ) {
    const response = await fetch(
      `/api/admin/categories/${category.id}?branchId=${encodeURIComponent(branchId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(await getResponseError(response));
    }

    router.refresh();
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCategory) return;

    setPendingCategoryId(editingCategory.id);
    setEditMessage(null);
    const formData = new FormData(event.currentTarget);

    try {
      await updateCategory(editingCategory, {
        name: String(formData.get("name") ?? ""),
        icon: String(formData.get("icon") ?? ""),
      });
      setEditingCategory(null);
    } catch (error) {
      setEditMessage({
        text:
          error instanceof Error
            ? error.message
            : "Kategori güncellenemedi. Lütfen tekrar deneyin.",
        isError: true,
      });
    } finally {
      setPendingCategoryId(null);
    }
  }

  async function toggleCategory(category: MenuCategory) {
    setPendingCategoryId(category.id);
    setMessage(null);

    try {
      await updateCategory(category, { isActive: !category.isActive });
    } catch (error) {
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Kategori durumu değiştirilemedi.",
        isError: true,
      });
    } finally {
      setPendingCategoryId(null);
    }
  }

  async function deleteCategory(category: MenuCategory) {
    if (category.productCount) return;
    if (!window.confirm(`"${category.name}" kategorisi silinsin mi?`)) return;

    setPendingCategoryId(category.id);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/categories/${category.id}?branchId=${encodeURIComponent(branchId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error(await getResponseError(response));
      setMessage({ text: "Kategori silindi.", isError: false });
      router.refresh();
    } catch (error) {
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Kategori silinemedi. Lütfen tekrar deneyin.",
        isError: true,
      });
    } finally {
      setPendingCategoryId(null);
    }
  }

  return (
    <>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-[22px] border border-[#ebe8e0] bg-white p-5 shadow-[0_5px_20px_#3c32100a] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#f5eddf] text-[#a67a36]">
              <FolderPlus size={18} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#49443a]">
                Yeni kategori
              </h2>
              <p className="mt-1 text-xs text-[#837b70]">
                Kategori menüde anında görünür.
              </p>
            </div>
          </div>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
            <Input
              autoComplete="off"
              className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
              maxLength={60}
              minLength={2}
              name="name"
              placeholder="Kategori adı"
              required
            />
            <Input
              aria-label="Kategori simgesi"
              className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
              defaultValue="🍦"
              maxLength={12}
              name="icon"
              placeholder="Simge (ör. 🍦)"
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
              Kategori oluştur
            </Button>
          </form>
        </section>

        <section className="overflow-hidden rounded-[22px] border border-[#ebe8e0] bg-white shadow-[0_5px_20px_#3c32100a]">
          <div className="flex items-center justify-between border-b border-[#f0eee8] px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-bold tracking-[0.15em] text-[#a67a36]">
                MENÜ YAPISI
              </p>
              <h2 className="font-editorial mt-1.5 text-xl text-[#3e3a32]">
                Kategoriler
              </h2>
            </div>
            <span className="rounded-full bg-[#f7f6f2] px-3 py-1 text-xs text-[#77766e]">
              {categories.length}
            </span>
          </div>
          {message && (
            <p
              className={`px-5 pt-4 text-xs ${message.isError ? "text-[#a63e35]" : "text-[#61764f]"}`}
              role={message.isError ? "alert" : "status"}
            >
              {message.text}
            </p>
          )}
          <div className="divide-y divide-[#f1eee8] px-5 sm:px-6">
            {categories.map((category) => {
              const isPending = pendingCategoryId === category.id;
              return (
                <article
                  className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${category.isActive ? "" : "opacity-65"}`}
                  key={category.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f7f4ed] text-lg">
                      {category.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-[#49443a]">
                          {category.name}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] ${category.isActive ? "bg-[#edf2e8] text-[#61764f]" : "bg-[#f3f1ed] text-[#827c70]"}`}
                        >
                          {category.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#938d81]">
                        /{category.slug} · {category.productCount ?? 0} ürün
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <Button
                      aria-label={`${category.name} kategorisini düzenle`}
                      className="size-9 rounded-lg text-[#806233] hover:bg-[#f7f2e8]"
                      disabled={isPending}
                      onClick={() => {
                        setEditMessage(null);
                        setEditingCategory(category);
                      }}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      aria-label={`${category.isActive ? "Pasif yap" : "Aktif yap"}: ${category.name}`}
                      className="size-9 rounded-lg text-[#806233] hover:bg-[#f7f2e8]"
                      disabled={isPending}
                      onClick={() => void toggleCategory(category)}
                      size="icon"
                      title={category.isActive ? "Kategoriyi pasif yap" : "Kategoriyi aktif yap"}
                      type="button"
                      variant="ghost"
                    >
                      {isPending ? (
                        <LoaderCircle className="animate-spin" size={15} />
                      ) : category.isActive ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </Button>
                    <Button
                      aria-label={`${category.name} kategorisini sil`}
                      className="size-9 rounded-lg text-[#a45142] hover:bg-[#fbefed]"
                      disabled={isPending || Boolean(category.productCount)}
                      onClick={() => void deleteCategory(category)}
                      size="icon"
                      title={
                        category.productCount
                          ? "Önce kategorideki ürünleri silin veya taşıyın"
                          : "Kategoriyi sil"
                      }
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </article>
              );
            })}
            {categories.length === 0 && (
              <p className="py-8 text-center text-sm text-[#837b70]">
                Henüz kategori yok. İlk kategorinizi oluşturun.
              </p>
            )}
          </div>
        </section>
      </div>

      <Dialog
        open={editingCategory !== null}
        onOpenChange={(open) => {
          if (!open && pendingCategoryId === null) setEditingCategory(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[24px] border-[#ebe5da] p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-editorial text-2xl font-normal">
              Kategoriyi düzenle
            </DialogTitle>
            <DialogDescription>
              Kategori adı ve simgesi menüde görüntülenir.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <form
              className="space-y-4"
              key={editingCategory.id}
              onSubmit={handleEdit}
            >
              <label className="block space-y-2 text-sm font-medium text-[#514637]">
                Kategori adı
                <Input
                  autoComplete="off"
                  className="h-11 rounded-xl border-[#e8e1d6]"
                  defaultValue={editingCategory.name}
                  maxLength={60}
                  minLength={2}
                  name="name"
                  required
                />
              </label>
              <label className="block space-y-2 text-sm font-medium text-[#514637]">
                Simge
                <Input
                  className="h-11 rounded-xl border-[#e8e1d6]"
                  defaultValue={editingCategory.icon}
                  maxLength={12}
                  name="icon"
                  required
                />
              </label>
              {editMessage && (
                <p className="text-sm text-[#a63e35]" role="alert">
                  {editMessage.text}
                </p>
              )}
              <Button
                className="w-full rounded-xl bg-[#a67a36] text-white hover:bg-[#8e6426]"
                disabled={pendingCategoryId === editingCategory.id}
                type="submit"
              >
                {pendingCategoryId === editingCategory.id && (
                  <LoaderCircle className="animate-spin" />
                )}
                Değişiklikleri kaydet
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
