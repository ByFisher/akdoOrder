"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { MenuProduct } from "@/lib/menu-types";

export type CartLine = {
  product: MenuProduct;
  quantity: number;
};

export function MenuCart({
  items,
  onChangeQuantity,
}: {
  items: CartLine[];
  onChangeQuantity: (productId: string, delta: number) => void;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold tracking-[0.22em] text-[#a87943]">
        MENÜDEN SİPARİŞ
      </p>
      <h2 className="font-editorial mt-2 text-3xl tracking-[-0.025em] text-[#39271f] sm:text-4xl">
        Sepetiniz
      </h2>
      <p className="mt-2 text-xs leading-5 text-[#827568]">
        Ürünleri menüden ekleyin, masa kodunuzu girin ve siparişinizi bu
        sayfadan tamamlayın.
      </p>

      {items.length > 0 ? (
        <ul className="mt-5 divide-y divide-[#e9e0d5] border-y border-[#e9e0d5]">
          {items.map(({ product, quantity }) => (
            <li
              className="flex items-center justify-between gap-4 py-4"
              key={product.id}
            >
              <div className="min-w-0">
                <p className="truncate font-editorial text-xl text-[#39271f]">
                  {product.name}
                </p>
                <p className="mt-1 text-[11px] text-[#827568]">
                  {formatPrice(product.price)} ·{" "}
                  {formatPrice(product.price * quantity)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  aria-label={`${product.name} miktarını azalt`}
                  className="grid size-8 place-items-center rounded-full border border-[#dfd2c1] text-[#6e6257] transition hover:bg-[#f3ebdf]"
                  onClick={() => onChangeQuantity(product.id, -1)}
                  type="button"
                >
                  {quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                </button>
                <span className="w-5 text-center text-xs font-semibold text-[#49372d]">
                  {quantity}
                </span>
                <button
                  aria-label={`${product.name} miktarını artır`}
                  className="grid size-8 place-items-center rounded-full border border-[#dfd2c1] text-[#6e6257] transition hover:bg-[#f3ebdf]"
                  disabled={quantity >= 99}
                  onClick={() => onChangeQuantity(product.id, 1)}
                  type="button"
                >
                  <Plus size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-[#d8caba] bg-[#fcfaf5] px-5 py-8 text-center">
          <ShoppingBag className="mx-auto text-[#a87943]" size={21} />
          <p className="mt-3 text-sm font-medium text-[#49372d]">
            Sepetiniz henüz boş
          </p>
          <p className="mt-1 text-xs text-[#827568]">
            Beğendiğiniz ürünlerin altındaki “Sepete ekle” düğmesini kullanın.
          </p>
        </div>
      )}
    </div>
  );
}
