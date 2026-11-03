"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  EyeOff,
  IceCreamCone,
  LoaderCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MenuCategory } from "@/lib/menu-types";

interface MenuProductSummary {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  allergens: string;
  price: number;
  stock: number;
  isActive: boolean;
  featured: boolean;
  category: { id: string; name: string };
}

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

export function MenuManagement({
  branchId,
  categories,
  products,
}: {
  branchId: string;
  categories: MenuCategory[];
  products: MenuProductSummary[];
}) {
  const [creating, setCreating] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] =
    useState<MenuProductSummary | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [newProductImageUrl, setNewProductImageUrl] = useState("");
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [editMessage, setEditMessage] = useState<FormMessage | null>(null);
  const router = useRouter();
  const activeCategories = categories.filter((category) => category.isActive);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(
        `/api/admin/products?branchId=${encodeURIComponent(branchId)}`,
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          categoryId: formData.get("categoryId"),
          price: Number(formData.get("price")),
          description: formData.get("description"),
          imageUrl: formData.get("imageUrl"),
          allergens: formData.get("allergens"),
          stock: Number(formData.get("stock")),
          featured: formData.get("featured") === "on",
        }),
        },
      );

      if (!response.ok) {
        throw new Error(await getResponseError(response));
      }

      form.reset();
      setNewProductImageUrl("");
      setMessage({
        text: "Ürün oluşturuldu ve menüye eklendi.",
        isError: false,
      });
      router.refresh();
    } catch (error) {
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Ürün oluşturulamadı. Lütfen tekrar deneyin.",
        isError: true,
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) return;

    setPendingProductId(editingProduct.id);
    setEditMessage(null);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(
        `/api/admin/products/${editingProduct.id}?branchId=${encodeURIComponent(branchId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.get("name"),
            categoryId: formData.get("categoryId"),
            price: Number(formData.get("price")),
            description: formData.get("description"),
            imageUrl: formData.get("imageUrl"),
            allergens: formData.get("allergens"),
            stock: Number(formData.get("stock")),
            featured: formData.get("featured") === "on",
          }),
        },
      );

      if (!response.ok) throw new Error(await getResponseError(response));
      setEditingProduct(null);
      setImagePreviewUrl("");
      router.refresh();
    } catch (error) {
      setEditMessage({
        text:
          error instanceof Error
            ? error.message
            : "Ürün güncellenemedi. Lütfen tekrar deneyin.",
        isError: true,
      });
    } finally {
      setPendingProductId(null);
    }
  }

  async function toggleProduct(product: MenuProductSummary) {
    setPendingProductId(product.id);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/products/${product.id}?branchId=${encodeURIComponent(branchId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !product.isActive }),
        },
      );
      if (!response.ok) throw new Error(await getResponseError(response));
      router.refresh();
    } catch (error) {
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Ürün durumu değiştirilemedi.",
        isError: true,
      });
    } finally {
      setPendingProductId(null);
    }
  }

  async function deleteProduct(product: MenuProductSummary) {
    if (!window.confirm(`"${product.name}" ürünü silinsin mi?`)) return;

    setPendingProductId(product.id);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/products/${product.id}?branchId=${encodeURIComponent(branchId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error(await getResponseError(response));
      setMessage({ text: "Ürün silindi.", isError: false });
      router.refresh();
    } catch (error) {
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Ürün silinemedi. Lütfen tekrar deneyin.",
        isError: true,
      });
    } finally {
      setPendingProductId(null);
    }
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
      <section className="rounded-[22px] border border-[#ebe8e0] bg-white p-5 shadow-[0_5px_20px_#3c32100a] sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#f8efe0] text-[#a67a36]">
            <IceCreamCone size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[#49443a]">Yeni ürün</h2>
            <p className="mt-1 text-xs text-[#837b70]">
              Ürün seçtiğiniz kategoride yayınlanır.
            </p>
          </div>
        </div>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <Input
            autoComplete="off"
            className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
            maxLength={100}
            minLength={2}
            name="name"
            placeholder="Ürün adı"
            required
          />
          <select
            aria-label="Ürün kategorisi"
            className="h-11 w-full rounded-xl border border-[#e8e1d6] bg-white px-3 text-sm"
            defaultValue=""
            disabled={activeCategories.length === 0}
            name="categoryId"
            required
          >
            <option disabled value="">
              {activeCategories.length === 0
                ? "Önce aktif bir kategori oluşturun"
                : "Kategori seçin"}
            </option>
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}{category.isActive ? "" : " (pasif)"}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
              max={100000}
              min={1}
              name="price"
              placeholder="Fiyat (TL)"
              required
              type="number"
            />
            <Input
              className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
              defaultValue={20}
              max={100000}
              min={0}
              name="stock"
              placeholder="Stok"
              required
              type="number"
            />
          </div>
          <Textarea
            className="min-h-20 rounded-xl border-[#e8e1d6] bg-white px-3 py-2.5 text-sm"
            maxLength={500}
            name="description"
            placeholder="Ürün açıklaması"
          />
          <ImageUploadField
            onChange={setNewProductImageUrl}
            value={newProductImageUrl}
          />
          <Input
            className="h-11 rounded-xl border-[#e8e1d6] bg-white px-3 text-sm"
            maxLength={500}
            name="allergens"
            placeholder="Alerjenler (virgülle ayırın)"
          />
          <label className="flex items-center gap-2 text-sm text-[#675c4d]">
            <input
              className="size-4 accent-[#a67a36]"
              name="featured"
              type="checkbox"
            />
            Öne çıkan ürün olarak göster
          </label>
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
            disabled={creating || activeCategories.length === 0}
            type="submit"
          >
            {creating ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Check />
            )}
            Ürün oluştur
          </Button>
        </form>
      </section>

      <section className="overflow-hidden rounded-[22px] border border-[#ebe8e0] bg-white shadow-[0_5px_20px_#3c32100a]">
        <div className="flex items-center justify-between border-b border-[#f0eee8] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#a67a36]">
              MENÜ YÖNETİMİ
            </p>
            <h2 className="font-editorial mt-1.5 text-xl text-[#3e3a32]">
              Ürünler
            </h2>
          </div>
          <span className="rounded-full bg-[#f7f6f2] px-3 py-1 text-xs text-[#77766e]">
            {products.length}
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
          {products.map((product) => (
            <article
              className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${product.isActive ? "" : "opacity-65"}`}
              key={product.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  aria-label={product.imageUrl ? `${product.name} görseli` : undefined}
                  className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#eee8dc] bg-[#f7f2e8] text-[#a67a36]"
                  role={product.imageUrl ? "img" : undefined}
                  style={
                    product.imageUrl
                      ? {
                          backgroundImage: `url(${JSON.stringify(product.imageUrl)})`,
                          backgroundPosition: "center",
                          backgroundSize: "cover",
                        }
                      : undefined
                  }
                >
                  {!product.imageUrl && <IceCreamCone size={18} />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-medium text-[#49443a]">
                      {product.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] ${product.isActive ? "bg-[#edf2e8] text-[#61764f]" : "bg-[#f3f1ed] text-[#827c70]"}`}
                    >
                      {product.isActive ? "Aktif" : "Pasif"}
                    </span>
                    {product.featured && (
                      <span className="rounded-full bg-[#f5eddf] px-2 py-0.5 text-[9px] text-[#91682f]">
                        Öne çıkan
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[11px] text-[#938d81]">
                    {product.category.name}
                    {product.description ? ` · ${product.description}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="shrink-0 sm:text-right">
                  <p className="text-sm font-semibold text-[#66512f]">
                    {product.price} TL
                  </p>
                  <p className="mt-1 text-[10px] text-[#938d81]">
                    Stok: {product.stock}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    aria-label={`${product.name} ürününü düzenle`}
                    className="size-9 rounded-lg text-[#806233] hover:bg-[#f7f2e8]"
                    disabled={pendingProductId === product.id}
                    onClick={() => {
                      setEditMessage(null);
                      setImagePreviewUrl(product.imageUrl);
                      setEditingProduct(product);
                    }}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    aria-label={`${product.isActive ? "Pasif yap" : "Aktif yap"}: ${product.name}`}
                    className="size-9 rounded-lg text-[#806233] hover:bg-[#f7f2e8]"
                    disabled={pendingProductId === product.id}
                    onClick={() => void toggleProduct(product)}
                    size="icon"
                    title={product.isActive ? "Ürünü pasif yap" : "Ürünü aktif yap"}
                    type="button"
                    variant="ghost"
                  >
                    {pendingProductId === product.id ? (
                      <LoaderCircle className="animate-spin" size={15} />
                    ) : product.isActive ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </Button>
                  <Button
                    aria-label={`${product.name} ürününü sil`}
                    className="size-9 rounded-lg text-[#a45142] hover:bg-[#fbefed]"
                    disabled={pendingProductId === product.id}
                    onClick={() => void deleteProduct(product)}
                    size="icon"
                    title="Ürünü sil"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            </article>
          ))}
          {products.length === 0 && (
            <p className="py-8 text-center text-sm text-[#837b70]">
              Henüz ürün eklenmemiş.
            </p>
          )}
        </div>
      </section>

      <Dialog
        open={editingProduct !== null}
        onOpenChange={(open) => {
          if (!open && pendingProductId === null) {
            setEditingProduct(null);
            setImagePreviewUrl("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[24px] border-[#ebe5da] p-6 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-editorial text-2xl font-normal">
              Ürünü düzenle
            </DialogTitle>
            <DialogDescription>
              Ürün adı, görseli, fiyatı ve menüdeki diğer bilgileri güncelleyin.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <form
              className="space-y-3"
              key={editingProduct.id}
              onSubmit={handleEdit}
            >
              <Input
                autoComplete="off"
                className="h-11 rounded-xl border-[#e8e1d6] px-3 text-sm"
                defaultValue={editingProduct.name}
                maxLength={100}
                minLength={2}
                name="name"
                placeholder="Ürün adı"
                required
              />
              <select
                aria-label="Ürün kategorisi"
                className="h-11 w-full rounded-xl border border-[#e8e1d6] bg-white px-3 text-sm"
                defaultValue={editingProduct.category.id}
                name="categoryId"
                required
              >
                {categories.map((category) => (
                  <option
                    disabled={!category.isActive && category.id !== editingProduct.category.id}
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}{category.isActive ? "" : " (pasif)"}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  className="h-11 rounded-xl border-[#e8e1d6] px-3 text-sm"
                  defaultValue={editingProduct.price}
                  max={100000}
                  min={1}
                  name="price"
                  placeholder="Fiyat (TL)"
                  required
                  type="number"
                />
                <Input
                  className="h-11 rounded-xl border-[#e8e1d6] px-3 text-sm"
                  defaultValue={editingProduct.stock}
                  max={100000}
                  min={0}
                  name="stock"
                  placeholder="Stok"
                  required
                  type="number"
                />
              </div>
              <Textarea
                className="min-h-20 rounded-xl border-[#e8e1d6] px-3 py-2.5 text-sm"
                defaultValue={editingProduct.description}
                maxLength={500}
                name="description"
                placeholder="Ürün açıklaması"
              />
              <ImageUploadField
                disabled={pendingProductId === editingProduct.id}
                onChange={setImagePreviewUrl}
                value={imagePreviewUrl}
              />
              <Input
                className="h-11 rounded-xl border-[#e8e1d6] px-3 text-sm"
                defaultValue={editingProduct.allergens}
                maxLength={500}
                name="allergens"
                placeholder="Alerjenler (virgülle ayırın)"
              />
              <label className="flex items-center gap-2 text-sm text-[#675c4d]">
                <input
                  className="size-4 accent-[#a67a36]"
                  defaultChecked={editingProduct.featured}
                  name="featured"
                  type="checkbox"
                />
                Öne çıkan ürün olarak göster
              </label>
              {editMessage && (
                <p className="text-sm text-[#a63e35]" role="alert">
                  {editMessage.text}
                </p>
              )}
              <Button
                className="w-full rounded-xl bg-[#a67a36] text-white hover:bg-[#8e6426]"
                disabled={pendingProductId === editingProduct.id}
                type="submit"
              >
                {pendingProductId === editingProduct.id && (
                  <LoaderCircle className="animate-spin" />
                )}
                Değişiklikleri kaydet
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
