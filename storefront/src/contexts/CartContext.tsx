"use client";

import type { Cart, LineItem } from "@/types/commerce";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useOptionalAuth } from "@/contexts/AuthContext";
import { useOptionalStore } from "@/contexts/StoreContext";
import {
  addToCart as addToCartAction,
  getCart as getCartAction,
  removeCartItem as removeCartItemAction,
  updateCartItem as updateCartItemAction,
} from "@/lib/data/cart";
import type { Surface } from "@/lib/storefront/surface";

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
  const auth = useOptionalAuth();
  const store = useOptionalStore();
  const currency = store?.currency || "USD";
  const userId = auth?.user?.id ?? null;
  const prevUserRef = useRef<string | null | undefined>(undefined);
  const requestSeqRef = useRef(0);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const refreshCart = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    try {
      const cartData = await getCartAction(undefined, surface, currency);
      if (seq < requestSeqRef.current) {
        // Stale response: a newer mutation or refresh has already started
        return;
      }
      setCart(cartData);
    } catch {
      if (seq < requestSeqRef.current) {
        return;
      }
      setCart(null);
    } finally {
      if (seq >= requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [surface, currency]);

  // Monitor auth transitions:
  // - Anonymous -> Authenticated: trigger refreshCart() exactly once to claim/merge
  // - Authenticated -> Logged out: clear client cart state exactly once
  useEffect(() => {
    if (prevUserRef.current === undefined) {
      prevUserRef.current = userId;
      return;
    }

    if (!prevUserRef.current && userId) {
      refreshCart();
    } else if (prevUserRef.current && !userId) {
      setCart(null);
      setLoading(false);
    }

    prevUserRef.current = userId;
  }, [userId, refreshCart]);

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
      const seq = ++requestSeqRef.current;
      setUpdating(true);
      try {
        const result = await action();
        if (seq < requestSeqRef.current) {
          // Stale mutation: a newer mutation or action has taken precedence
          return;
        }
        if (result.success) {
          setCart(result.cart ?? null);
          setLoading(false);
          onSuccess?.();
        } else {
          toast.error(result.error || fallbackMessage);
        }
      } catch (error) {
        if (seq >= requestSeqRef.current) {
          toast.error(error instanceof Error ? error.message : fallbackMessage);
        }
      } finally {
        if (seq >= requestSeqRef.current) {
          setUpdating(false);
        }
      }
    },
    [],
  );

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      // Instant interaction: acknowledge click immediately on next frame
      setIsOpen(true);
      await mutateCart(
        () =>
          currency && currency !== "USD"
            ? addToCartAction(variantId, quantity, surface, currency)
            : addToCartAction(variantId, quantity, surface),
        t("failedToAddItem"),
      );
    },
    [mutateCart, t, surface, currency],
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

  // Hydrate cart once on provider mount
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Clear cart state when navigating to order confirmation
  useEffect(() => {
    if (pathname.includes("/order-placed/")) {
      setCart(null);
      setLoading(false);
    }
  }, [pathname, setCart, setLoading]);

  return null;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
