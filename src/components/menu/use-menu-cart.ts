"use client";

import { useSyncExternalStore } from "react";

type CartState = {
  branchId: string | null;
  quantities: Record<string, number>;
};

const EMPTY_CART: CartState = { branchId: null, quantities: {} };
const EMPTY_CART_SNAPSHOT = JSON.stringify(EMPTY_CART);
const STORAGE_KEY = "akdo-menu-cart";
const CHANGE_EVENT = "akdo-menu-cart-change";
let memorySnapshot = EMPTY_CART_SNAPSHOT;

function getSnapshot() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? EMPTY_CART_SNAPSHOT;
  } catch (error) {
    console.error("Sepet oturum depolamasından okunamadı.", error);
    return memorySnapshot;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function parseCart(snapshot: string): CartState {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "branchId" in parsed &&
      (parsed.branchId === null || typeof parsed.branchId === "string") &&
      "quantities" in parsed &&
      typeof parsed.quantities === "object" &&
      parsed.quantities !== null &&
      !Array.isArray(parsed.quantities) &&
      Object.values(parsed.quantities).every(
        (quantity) =>
          typeof quantity === "number" &&
          Number.isInteger(quantity) &&
          quantity > 0 &&
          quantity <= 99,
      )
    ) {
      return parsed as CartState;
    }
  } catch (error) {
    console.error("Sepet oturum verisi okunamadı.", error);
  }
  return EMPTY_CART;
}

function saveCart(cart: CartState) {
  memorySnapshot = JSON.stringify(cart);
  try {
    sessionStorage.setItem(STORAGE_KEY, memorySnapshot);
  } catch (error) {
    console.error("Sepet oturum depolamasına kaydedilemedi.", error);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useMenuCart() {
  const cart = parseCart(
    useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_CART_SNAPSHOT),
  );

  function changeQuantity(branchId: string, productId: string, delta: number) {
    const quantities =
      cart.branchId === branchId ? cart.quantities : {};
    const quantity = Math.min(
      99,
      Math.max(0, (quantities[productId] ?? 0) + delta),
    );
    const updated = { ...quantities };
    if (quantity === 0) delete updated[productId];
    else updated[productId] = quantity;
    saveCart({ branchId, quantities: updated });
  }

  function clearCart() {
    saveCart(EMPTY_CART);
  }

  return { cart, changeQuantity, clearCart };
}
