"use client";

import type { Cart, LineItem } from "@spree/sdk";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  Suspense,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  addToCart as addToCartAction,
  getCart as getCartAction,
  removeCartItem as removeCartItemAction,
  updateCartItem as updateCartItemAction,
} from "@/lib/data/cart";
import type { Surface } from "@/lib/spree/surface";

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  updating: boolean;
  itemCount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
  surface = "dtc",
}: {
  children: ReactNode;
  /** Which surface's cart this provider manages. Defaults to the DTC cart. */
  surface?: Surface;
}) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("cart");

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const refreshCart = useCallback(async () => {
    try {
      const cartData = await getCartAction(undefined, surface);
      setCart(cartData);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [surface]);

  const mutateCart = useCallback(
    async (
      action: () => Promise<{
        success: boolean;
        cart?: Cart | null;
        error?: string;
      }>,
      fallbackMessage: string,
      onSuccess?: () => void,
    ) => {
      setUpdating(true);
      try {
        const result = await action();
        if (result.success) {
          setCart(result.cart ?? null);
          onSuccess?.();
        } else {
          toast.error(result.error || fallbackMessage);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : fallbackMessage);
      } finally {
        setUpdating(false);
      }
    },
    [],
  );

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      // Instant interaction: acknowledge click immediately on next frame
      setIsOpen(true);
      await mutateCart(
        () => addToCartAction(variantId, quantity, surface),
        t("failedToAddItem"),
      );
    },
    [mutateCart, t, surface],
  );

  const updateItem = useCallback(
    async (lineItemId: string, quantity: number) => {
      await mutateCart(
        () => updateCartItemAction(lineItemId, quantity, surface),
        t("failedToUpdateItem"),
      );
    },
    [mutateCart, t, surface],
  );

  const removeItem = useCallback(
    async (lineItemId: string) => {
      await mutateCart(
        () => removeCartItemAction(lineItemId, surface),
        t("failedToRemoveItem"),
      );
    },
    [mutateCart, t, surface],
  );

  const itemCount = useMemo<number>(
    () =>
      cart?.items?.reduce(
        (sum: number, item: LineItem) => sum + item.quantity,
        0,
      ) ?? 0,
    [cart],
  );

  const value = useMemo<CartContextType>(
    () => ({
      cart,
      loading,
      updating,
      itemCount,
      isOpen,
      openCart,
      closeCart,
      addItem,
      updateItem,
      removeItem,
      refreshCart,
    }),
    [
      cart,
      loading,
      updating,
      itemCount,
      isOpen,
      openCart,
      closeCart,
      addItem,
      updateItem,
      removeItem,
      refreshCart,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      <Suspense fallback={null}>
        <CartNavigationTracker
          refreshCart={refreshCart}
          setCart={setCart}
          setLoading={setLoading}
        />
      </Suspense>
      {children}
    </CartContext.Provider>
  );
}

function CartNavigationTracker({
  refreshCart,
  setCart,
  setLoading,
}: {
  refreshCart: () => void;
  setCart: (cart: Cart | null) => void;
  setLoading: (loading: boolean) => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.includes("/order-placed/")) {
      setCart(null);
      setLoading(false);
      return;
    }
    refreshCart();
  }, [refreshCart, pathname, setCart, setLoading]);

  return null;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
