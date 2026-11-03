"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Clock3,
  IceCreamCone,
  MapPin,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Sprout,
  Truck,
  UserRound,
  Wheat,
  X,
} from "lucide-react";
import { Chip } from "@heroui/react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import qrLogo from "../../../img/logo/akdoqr.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { useMenuCart } from "@/components/menu/use-menu-cart";
import type { PublicBranch } from "@/lib/branch-types";
import type { MenuCategory, MenuProduct } from "@/lib/menu-types";
import type { MemberProfile } from "@/lib/member-profile-types";

interface MenuPageProps {
  branches: PublicBranch[];
  categories: MenuCategory[];
  products: MenuProduct[];
  selectedBranchId: string;
  member: MemberProfile | null;
}

function normalizeText(value: string) {
  return value
    .replaceAll("I", "ı")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function ProductImage({
  product,
  className = "",
  fillContainer = false,
}: {
  product: MenuProduct;
  className?: string;
  fillContainer?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`product-photo overflow-hidden ${fillContainer ? "absolute inset-0" : "relative"} ${className}`}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#f3ead9] via-[#f9f4e9] to-[#e8d7b8]" />
      )}
      {product.imageUrl && (
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={`object-cover transition duration-700 group-hover:scale-[1.04] ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
      {!product.imageUrl && (
        <div className="absolute inset-0 grid place-items-center text-[#a87943]">
          <IceCreamCone size={36} strokeWidth={1.4} />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
    </div>
  );
}

export function MenuPage({
  branches,
  categories,
  products,
  selectedBranchId,
  member,
}: MenuPageProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(
    null,
  );
  const { cart, changeQuantity: updateCartQuantity, clearCart } = useMenuCart();
  const cartQuantities = useMemo(
    () => (cart.branchId === selectedBranchId ? cart.quantities : {}),
    [cart.branchId, cart.quantities, selectedBranchId],
  );
  const pathname = usePathname();
  const router = useRouter();

  function selectBranch(branchId: string) {
    clearCart();
    router.push(`${pathname}?branchId=${encodeURIComponent(branchId)}`);
  }

  function changeCartQuantity(productId: string, delta: number) {
    updateCartQuantity(selectedBranchId, productId, delta);
  }

  const cartItems = useMemo(
    () =>
      products.flatMap((product) => {
        const quantity = cartQuantities[product.id] ?? 0;
        return quantity > 0
          ? [{ product, quantity }]
          : [];
      }),
    [cartQuantities, products],
  );
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const visibleProducts = useMemo(() => {
    const query = normalizeText(search.trim());

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "all" || product.category.slug === activeCategory;
      const matchesSearch =
        !query ||
        normalizeText(
          `${product.name} ${product.description} ${product.category.name}`,
        ).includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, search]);

  const featuredProducts = products.filter((product) => product.featured);

  return (
    <main className="min-h-screen bg-[#f7f3eb] pb-16 text-[#34251f] sm:pb-20">
      <div className="border-b border-[#594438] bg-[#34241e] px-4 py-2 text-center text-[9px] font-medium tracking-[0.2em] text-[#ead7b7] sm:text-[10px]">
        MARAŞ&apos;IN GELENEKSEL LEZZETİ · HER GÜN TAZE
      </div>
      <header className="sticky top-0 z-30 border-b border-[#e8dfd3] bg-[#f8f5ee]/95 backdrop-blur-xl">
        <div className="mx-auto grid min-h-[76px] max-w-[1320px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-3 py-2 sm:gap-x-5 sm:px-8 lg:px-12 lg:flex lg:justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:shrink-0">
            <Link aria-label="Akdo ana sayfa" className="flex shrink-0 items-center gap-3" href="/">
              <Image
                alt="Akdo QR"
                className="h-11 w-[58px] shrink-0 object-contain sm:h-12 sm:w-[64px]"
                priority
                src={qrLogo}
              />
              <span className="sr-only">Dondurma &amp; Tatlı</span>
            </Link>
            {member && (
              <Link
                aria-label={`${member.firstName} ${member.lastName}, üye numarası ${member.memberNumber}, bakiye ${member.balance} TL. Üye profiline git.`}
                className="flex min-w-0 items-center gap-2 rounded-xl border border-[#e5d8c6] bg-[#fffdf8] px-2.5 py-2 transition hover:border-[#bd9856] hover:bg-[#f4ecdf] sm:gap-3 sm:px-3"
                href="/uye"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#34241e] font-editorial text-sm text-[#f1d7a4] sm:size-9 sm:text-base">
                  {member.firstName.slice(0, 1).toLocaleUpperCase("tr-TR")}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block max-w-[105px] truncate text-[10px] font-semibold text-[#49372d] sm:max-w-[170px] sm:text-xs">
                    {member.firstName} {member.lastName}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-[9px] text-[#897b6b] sm:text-[10px]">
                    <span>#{member.memberNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate font-semibold text-[#8b673d]">
                      {member.balance.toLocaleString("tr-TR")} ₺
                    </span>
                  </span>
                </span>
              </Link>
            )}
          </div>

          <nav aria-label="Ana menü" className="col-span-2 flex w-full min-w-0 items-center justify-center gap-2 border-t border-[#e8dfd3] pt-1.5 text-[11px] font-medium text-[#786a5d] sm:gap-4 lg:col-span-1 lg:w-auto lg:justify-start lg:border-0 lg:pt-0 lg:gap-8">
            <a className="hidden transition hover:text-[#a87943] lg:inline" href="#menu">Menümüz</a>
            <a
              className="hidden transition hover:text-[#a87943] lg:inline"
              href="https://www.akdondurma.com/"
              rel="noreferrer"
              target="_blank"
            >
              Hikâyemiz
            </a>
            <label className="flex min-w-0 items-center gap-1.5 text-[#59483d] sm:gap-2 lg:border-l lg:border-[#e4e0d6] lg:pl-7">
              <MapPin className="shrink-0 text-[#a87943]" size={15} />
              <span className="sr-only">Şube seçin</span>
              <select
                aria-label="Şube seçin"
                className="h-9 max-w-[220px] cursor-pointer truncate rounded-lg border border-transparent bg-transparent px-1 text-[10px] font-semibold text-[#59483d] outline-none transition hover:border-[#e4e0d6] focus-visible:border-[#bd9856] sm:max-w-[260px] sm:text-xs lg:max-w-[190px]"
                onChange={(event) => selectBranch(event.target.value)}
                value={selectedBranchId}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                    {branch.city ? ` — ${branch.city}` : ""}
                    {branch.district ? `, ${branch.district}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </nav>

          <div className="col-start-2 row-start-1 flex shrink-0 items-center gap-1.5 sm:gap-2 lg:col-auto lg:row-auto">
            {member && cartCount > 0 && (
              <Link
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d9cbbb] px-3 py-2 text-xs font-semibold text-[#594238] transition hover:border-[#b48b52] hover:bg-[#f1e8da]"
                href={`/sepet?branchId=${encodeURIComponent(selectedBranchId)}`}
              >
                <ShoppingBag size={14} />
                <span>Sepet · {cartCount}</span>
              </Link>
            )}
            {!member && (
              <Link
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d9cbbb] px-3 py-2 text-xs font-semibold text-[#594238] transition hover:border-[#b48b52] hover:bg-[#f1e8da] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                href="/uye"
              >
                <UserRound size={15} />
                <span>Üye</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
        <section className="menu-hero relative mt-4 min-h-[470px] overflow-hidden rounded-[18px] shadow-[0_24px_70px_#38261b1c] sm:mt-7 sm:min-h-[520px] sm:rounded-[24px]">
          <div className="menu-hero-image absolute inset-0 opacity-90 transition duration-700" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#302019]/95 via-[#38251d]/80 to-[#38251d]/5" />
          <div className="relative z-10 flex min-h-[470px] max-w-3xl flex-col items-start justify-center px-6 py-12 sm:min-h-[520px] sm:px-12 lg:px-16">
            <span className="mb-6 inline-flex items-center gap-2 text-[9px] font-semibold tracking-[0.25em] text-[#e6c997] sm:text-[10px]">
              <span className="h-px w-8 bg-[#d7ae70]" />
              MARAŞ&apos;TAN SOFRANIZA
            </span>
            <h1 className="font-editorial max-w-2xl text-[48px] leading-[0.93] tracking-[-0.045em] text-[#fff9ef] sm:text-6xl lg:text-[82px]">
              Gelenekten gelen
              <br />
              <span className="italic text-[#e6c997]">bir mutluluk.</span>
            </h1>
            <p className="mt-6 max-w-md text-[13px] leading-7 text-[#f7eee2]/78 sm:text-sm">
              Maraş dondurmasının ustalıkla uzayan hikâyesi, şimdi en sevdiğiniz
              tatlılarla aynı menüde.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="inline-flex h-12 items-center gap-3 rounded-full bg-[#dfbf89] px-6 text-[12px] font-semibold text-[#38251d] shadow-[0_8px_24px_#1d130d30] transition hover:-translate-y-0.5 hover:bg-[#f0d7aa]"
                href="#menu"
              >
                Menüyü keşfet <ArrowRight size={16} />
              </a>
              <Link
                className="inline-flex h-12 items-center gap-3 rounded-full border border-[#f2e7d4]/45 bg-[#fff9ef]/8 px-6 text-[12px] font-semibold text-[#fff9ef] transition hover:border-[#f2e7d4]/75 hover:bg-[#fff9ef]/15"
                href={member ? "#menu" : "/uye?returnTo=%2F"}
              >
                {member ? "Menüden sipariş ver" : "Masadan sipariş ver"}{" "}
                <ShoppingBag size={16} />
              </Link>
            </div>
          </div>
          <div className="absolute bottom-7 right-8 z-10 hidden items-center gap-3 text-[9px] font-medium tracking-[0.2em] text-[#fff9ef]/80 lg:flex">
            <span className="h-px w-10 bg-[#d7ae70]" />
            USTALIKLA, HER GÜN TAZE
          </div>
        </section>

        <section aria-label="Akdo lezzetleri" className="my-7 grid grid-cols-1 divide-y divide-[#e7ded2] border-b border-[#e7ded2] bg-[#fbf8f2] sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:border sm:border-[#e7ded2]">
          <div className="flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5">
            <Wheat className="shrink-0 text-[#a87943]" size={19} strokeWidth={1.5} />
            <div><p className="text-[11px] font-semibold text-[#49372d]">Ustalıkla çekilen</p><p className="mt-1 text-[9px] text-[#887b6e]">Gerçek Maraş dondurması</p></div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5">
            <Sprout className="shrink-0 text-[#a87943]" size={19} strokeWidth={1.5} />
            <div><p className="text-[11px] font-semibold text-[#49372d]">Özenle seçilen</p><p className="mt-1 text-[9px] text-[#887b6e]">İçinize sinen malzemeler</p></div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5">
            <Truck className="shrink-0 text-[#a87943]" size={19} strokeWidth={1.5} />
            <div><p className="text-[11px] font-semibold text-[#49372d]">Her gün taze</p><p className="mt-1 text-[9px] text-[#887b6e]">Kahramanmaraş&apos;tan size</p></div>
          </div>
        </section>

      {featuredProducts.length > 0 && (
        <section className="mt-14 border-t border-[#e5dbce] pt-10 sm:mt-16 sm:pt-12">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-bold tracking-[0.22em] text-[#a87943]">
                AKDO&apos;NUN SEÇKİSİ
              </p>
              <h2 className="font-editorial mt-2 text-4xl tracking-[-0.025em] text-[#39271f] sm:text-5xl">
                Önce favoriler
              </h2>
            </div>
            <a
              className="mb-1 hidden items-center gap-1.5 text-[11px] font-semibold text-[#68564a] transition hover:text-[#a87943] sm:flex"
              href="#menu"
            >
              Tüm menü <ArrowRight size={15} />
            </a>
          </div>
          <div className="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-5 sm:px-0">
            {featuredProducts.slice(0, 3).map((product, index) => (
              <motion.button
                key={product.id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07, duration: 0.35 }}
                onClick={() => setSelectedProduct(product)}
                className="group relative h-[240px] w-[82vw] max-w-[350px] shrink-0 snap-start overflow-hidden rounded-[5px] border border-white/60 text-left shadow-[0_15px_34px_#38261b1c] transition duration-500 hover:-translate-y-1 hover:shadow-[0_22px_48px_#38261b2b] sm:h-[280px] sm:w-[calc(33.333%-14px)] sm:max-w-none"
              >
                <ProductImage product={product} fillContainer />
                <div className="absolute inset-0 bg-gradient-to-t from-[#281a15]/95 via-[#35241b]/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
                  <div>
                    <p className="mb-1 text-[9px] font-semibold tracking-[0.18em] text-[#e6c997]">
                      {product.category.name.toLocaleUpperCase("tr-TR")}
                    </p>
                    <p className="font-editorial text-2xl sm:text-3xl">
                      {product.name}
                    </p>
                  </div>
                  <span className="mb-0.5 whitespace-nowrap text-[12px] font-semibold">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      <section id="menu" className="scroll-mt-28 border-t border-[#e5dbce] pt-12 sm:pt-16">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-bold tracking-[0.22em] text-[#a87943]">
              LEZZETLERİMİZ
            </p>
            <h2 className="font-editorial mt-2 text-4xl tracking-[-0.025em] text-[#39271f] sm:text-5xl">
              Bugün ne yesek?
            </h2>
          </div>
          <label className="relative block w-full sm:max-w-[330px]">
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-4 -translate-y-1/2 text-[#9a8064]"
              size={17}
            />
            <Input
              className="h-12 rounded-[3px] border-[#ddd0be] bg-[#fcfaf5] pr-11 pl-11 text-[12px] shadow-[0_8px_22px_#38261b0a] placeholder:text-[#9b8e80] focus-visible:ring-[#a87943]/30"
              type="search"
              placeholder="Menüde ara..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Menüde ürün ara"
            />
            {search && (
              <button
                aria-label="Aramayı temizle"
                className="absolute top-1/2 right-4 -translate-y-1/2 text-[#8d7e70] hover:text-[#34241e]"
                onClick={() => setSearch("")}
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </label>
        </div>

        <div className="hide-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <CategoryFilter
            active={activeCategory === "all"}
            label={`Tümü${products.length ? ` · ${products.length}` : ""}`}
            onClick={() => setActiveCategory("all")}
          />
          {categories.map((category) => (
            <CategoryFilter
              key={category.id}
              active={activeCategory === category.slug}
              label={`${category.icon}  ${category.name}`}
              onClick={() => setActiveCategory(category.slug)}
            />
          ))}
        </div>

        <div className="mb-4 mt-6 flex items-center justify-between border-b border-[#e9e0d5] pb-3">
          <p className="text-[11px] text-[#827568]">
            {search
              ? `"${search}" için ${visibleProducts.length} sonuç`
              : `${visibleProducts.length} lezzet`}
          </p>
          <div className="hidden items-center gap-1.5 text-[10px] text-[#827568] sm:flex">
            <Clock3 size={14} /> Taze taze hazırlandı
          </div>
        </div>

        {visibleProducts.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-12 lg:auto-rows-[30px] lg:gap-x-5 lg:gap-y-5"
          >
            <AnimatePresence mode="popLayout">
              {visibleProducts.map((product, index) => (
                <motion.article
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.2) }}
                  className={`group relative overflow-hidden rounded-[4px] border border-[#e8dfd3] bg-[#fcfaf5] p-2 shadow-[0_8px_24px_#38261b0a] transition duration-300 hover:-translate-y-1 hover:border-[#c5a77e] hover:shadow-[0_18px_38px_#38261b19] lg:col-span-4 ${index % 8 === 0 ? "lg:col-span-8 lg:row-span-11" : index % 8 === 3 ? "lg:col-span-6 lg:row-span-10" : "lg:row-span-8"}`}
                >
                  <button
                    className="block w-full text-left"
                    onClick={() => setSelectedProduct(product)}
                    type="button"
                  >
                    <div className="relative">
                      <ProductImage
                        product={product}
                        className={`h-[220px] rounded-[2px] sm:h-[205px] ${index % 8 === 0 ? "lg:h-[320px]" : index % 8 === 3 ? "lg:h-[285px]" : ""}`}
                      />
                      {product.featured && (
                        <Chip className="absolute top-3 left-3 rounded-full border border-white/70 bg-[#fbf4e7]/95 px-2.5 text-[#755633] shadow-[0_4px_14px_#24170f20] backdrop-blur" size="sm" variant="soft">
                          <Sparkles size={12} />
                          <Chip.Label className="text-[10px] font-semibold">Çok sevilen</Chip.Label>
                        </Chip>
                      )}
                    </div>
                    <div className="px-2 pt-3.5 pb-2">
                      <div className="mb-2 flex items-center gap-2">
                        <Avatar className="size-6 rounded-full border border-[#e5d8c7] bg-[#f2e9dc] text-[11px] text-[#725637]">
                          <AvatarFallback>{product.category.icon}</AvatarFallback>
                        </Avatar>
                        <p className="text-[9px] font-semibold tracking-[0.14em] text-[#9a7547]">
                          {product.category.name.toLocaleUpperCase("tr-TR")}
                        </p>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-editorial text-[23px] leading-snug text-[#39271f]">
                          {product.name}
                        </h3>
                        <span className="mt-0.5 shrink-0 text-[12px] font-semibold text-[#916c3f]">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 min-h-10 text-[11px] leading-5 text-[#80766a]">
                        {product.description}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-[#74583a] transition group-hover:gap-2">
                        Detayları gör <ArrowRight size={13} />
                      </span>
                    </div>
                  </button>
                  {member && (
                    <button
                      className="absolute right-4 top-4 z-20 inline-flex h-9 items-center gap-2 rounded-full border border-white/60 bg-[#34241e]/90 px-4 text-[10px] font-semibold text-[#fffaf2] shadow-[0_5px_16px_#1d130d35] backdrop-blur transition hover:bg-[#50382d]"
                      onClick={() => changeCartQuantity(product.id, 1)}
                      type="button"
                    >
                      <Plus size={13} />
                      {cartQuantities[product.id]
                        ? `Sepette ${cartQuantities[product.id]} · ekle`
                        : "Sepete ekle"}
                    </button>
                  )}
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="rounded-[4px] border border-dashed border-[#d8caba] bg-[#fcfaf5] px-6 py-16 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#eee5d9] text-[#755a3e]">
              <Search size={20} />
            </div>
            <h3 className="font-editorial mt-4 text-2xl text-[#39271f]">Bu aramada bir şey bulamadık</h3>
            <p className="mt-2 text-[12px] text-[#7d7267]">
              Başka bir lezzet aramayı veya farklı bir kategori seçmeyi deneyin.
            </p>
            <button
              className="mt-5 text-[11px] font-semibold text-[#755a3e] hover:underline"
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
              }}
              type="button"
            >
              Filtreleri temizle
            </button>
          </div>
        )}
      </section>
      </div>

      <footer id="hakkimizda" className="mt-16 border-t border-[#594438] bg-[#34241e] px-4 py-11 text-center text-[11px] text-[#e9ded0] sm:mt-20">
        <div className="mx-auto max-w-[1320px]">
          <p className="font-editorial text-2xl text-[#fbf5eb]">Gelenekten gelen, her gün taze.</p>
          <p className="mt-3 text-[#d8b981]">Kahramanmaraş&apos;ın lezzeti, Akdo&apos;nun ustalığı.</p>
          <p className="mt-6 text-[9px] text-white/50">© {new Date().getFullYear()} Akdo Dondurma</p>
        </div>
      </footer>

      <Dialog
        open={selectedProduct !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[5px] border-[#ddcfbd] bg-[#fbf8f2] p-3 shadow-[0_24px_80px_#21150f35] sm:max-w-xl sm:p-4">
          {selectedProduct && (
            <>
              <ProductImage
                product={selectedProduct}
                className="h-[230px] rounded-[2px] sm:h-[290px]"
              />
              <DialogHeader className="px-2 pt-2">
                <p className="text-[9px] font-bold tracking-[0.18em] text-[#9a7547]">
                  {selectedProduct.category.name.toLocaleUpperCase("tr-TR")}
                </p>
                <div className="flex items-start justify-between gap-4">
                  <DialogTitle className="font-editorial text-2xl font-normal sm:text-3xl">
                    {selectedProduct.name}
                  </DialogTitle>
                  <span className="mt-1 shrink-0 text-sm font-semibold text-[#916c3f]">
                    {formatPrice(selectedProduct.price)}
                  </span>
                </div>
                <DialogDescription className="pt-1 text-[12px] leading-6 text-[#7d7267]">
                  {selectedProduct.description || "Akdo mutfağından taptaze."}
                </DialogDescription>
                <div className="border-t border-[#e8dfd3] pt-4">
                  <p className="text-[9px] font-bold tracking-[0.18em] text-[#817568]">
                    ALERJEN BİLGİSİ
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedProduct.allergens.length > 0 ? (
                      selectedProduct.allergens.map((allergen) => (
                        <span
                          key={allergen}
                          className="rounded-full bg-[#eee5d9] px-3 py-1.5 text-[11px] text-[#634a32]"
                        >
                          {allergen}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#7d7267]">
                        Bildirilen bir alerjen bulunmuyor.
                      </span>
                    )}
                  </div>
                </div>
                {member && (
                  <button
                    className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#34241e] text-xs font-semibold text-[#fffaf2] transition hover:bg-[#50382d]"
                    onClick={() => {
                      changeCartQuantity(selectedProduct.id, 1);
                      setSelectedProduct(null);
                    }}
                    type="button"
                  >
                    <Plus size={15} />
                    Sepete ekle
                  </button>
                )}
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function CategoryFilter({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-medium transition sm:text-sm ${
        active
          ? "border-[#34241e] bg-[#34241e] text-[#f4e7d3] shadow-[0_7px_18px_#34241e26]"
            : "border-[#dfd2c1] bg-[#fbf8f2] text-[#6e6257] hover:border-[#b48b52] hover:bg-[#f3ebdf]"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
