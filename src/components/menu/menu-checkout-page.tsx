"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { MenuOrderPanel } from "@/components/menu/menu-order-panel";
import { useMenuCart } from "@/components/menu/use-menu-cart";
import type { MemberProfile } from "@/lib/member-profile-types";
import type { MenuProduct } from "@/lib/menu-types";

export function MenuCheckoutPage({
  branchId,
  branchName,
  member,
  products,
}: {
  branchId: string;
  branchName: string;
  member: MemberProfile;
  products: MenuProduct[];
}) {
  const { cart, changeQuantity, clearCart } = useMenuCart();
  const quantities = cart.branchId === branchId ? cart.quantities : {};
  const items = products.flatMap((product) => {
    const quantity = quantities[product.id] ?? 0;
    return quantity > 0 ? [{ product, quantity }] : [];
  });

  return (
    <main className="min-h-screen bg-[#f7f3eb] px-4 py-8 text-[#34251f] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-[1080px]">
        <Link
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#715c4a] transition hover:text-[#a87943]"
          href={`/?branchId=${encodeURIComponent(branchId)}`}
        >
          <ArrowLeft size={15} />
          Menüye dön
        </Link>

        <header className="mt-8 border-b border-[#e5dbce] pb-6 sm:mt-10 sm:pb-8">
          <p className="text-[9px] font-bold tracking-[0.22em] text-[#a87943]">
            AKDO · {branchName}
          </p>
          <h1 className="font-editorial mt-2 text-4xl tracking-[-0.03em] text-[#39271f] sm:text-5xl">
            Siparişiniz
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#827568]">
            Sepetinizi gözden geçirin ve masa kodunuzla siparişinizi tamamlayın.
          </p>
        </header>

        {cart.branchId && cart.branchId !== branchId ? (
          <div className="mt-8 rounded-xl border border-[#e5dbce] bg-[#fcfaf5] p-6 text-sm text-[#59483d]">
            <ShoppingBag className="mb-3 text-[#a87943]" size={22} />
            Sepetiniz başka bir şubeye ait. Sipariş vermek için menüden doğru
            şubeyi seçip ürünleri yeniden ekleyin.
          </div>
        ) : (
          <MenuOrderPanel
            branchId={branchId}
            items={items}
            member={member}
            onChangeQuantity={(productId, delta) =>
              changeQuantity(branchId, productId, delta)
            }
            onClear={clearCart}
          />
        )}
      </div>
    </main>
  );
}
