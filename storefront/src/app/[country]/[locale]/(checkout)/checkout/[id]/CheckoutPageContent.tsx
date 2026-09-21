"use client";

import { CircleAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AddressSection } from "@/components/checkout/AddressSection";
import { DeliveryMethodSection } from "@/components/checkout/DeliveryMethodSection";
import {
  PaymentSection,
  type PaymentSectionHandle,
} from "@/components/checkout/PaymentSection";
import { PolicyConsent } from "@/components/policy/PolicyConsent";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useCheckout } from "@/contexts/CheckoutContext";
import { trackAddPaymentInfo, trackBeginCheckout } from "@/lib/analytics/gtm";
import { getAddresses, updateAddress } from "@/lib/data/addresses";
import { getCheckoutOrder, updateOrderAddresses } from "@/lib/data/checkout";
import { isAuthenticated as checkAuth } from "@/lib/data/cookies";
import { getCountry } from "@/lib/data/countries";
import { getMarketCountries, resolveMarket } from "@/lib/data/markets";
import { extractBasePath } from "@/lib/utils/path";
import type { Address, AddressParams, Cart, Country, Order } from "@/types/commerce";
import { CheckoutSidebar } from "./CheckoutSidebar";
import type { CheckoutInitialData } from "./page";

// Fingerprint of line-item state only. Used to detect when CartContext
// has a different set of line items than our local checkout cart —
// happens when Next's router cache restores a prior /checkout/[id] view
// after the user went back, added/removed/changed quantities, and
// returned.
//
// Intentionally excludes discount/total/tax/delivery fields: those
// change as a result of checkout-page mutations (apply discount, select
// shipping, etc.) that update local `cart` but not `contextCart`, and
// we don't want those legitimate divergences to trigger an overwrite.
// Line items don't change from checkout-page mutations.
function cartItemsFingerprint(cart: Cart | null): string {
  if (!cart) return "";
  return (cart.items ?? []).map((i) => `${i.id}:${i.quantity}`).join(",");
}

interface CheckoutPageContentProps {
  cartId: string;
  urlCountry: string;
  initialData: CheckoutInitialData | null;
}

function CheckoutPageContentInner({
  cartId,
  urlCountry,
  initialData,
}: CheckoutPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = extractBasePath(pathname);
  const { setSummaryContent } = useCheckout();
  const { cart: contextCart } = useCart();
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const { user, loading: authLoading } = useAuth();

  // Pick up payment errors from query param
  const paymentError = searchParams.get("payment_error");

  // Initialize state from server-fetched data — no loading skeleton needed
  const [cart, setCart] = useState<Cart | null>(initialData?.cart ?? null);
  const [countries, setCountries] = useState<Country[]>(
    initialData?.countries ?? [],
  );
  const [savedAddresses, setSavedAddresses] = useState<Address[]>(
    initialData?.savedAddresses ?? [],
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialData?.isAuthenticated ?? false,
  );
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(paymentError);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sectionErrors, setSectionErrors] = useState<Record<string, string[]>>(
    {},
  );
  const [policyConsent, setPolicyConsent] = useState(false);
  const [policyError, setPolicyError] = useState(false);

  const cartRef = useRef(cart);
  cartRef.current = cart;
  const routerRef = useRef(router);
  routerRef.current = router;
  const tRef = useRef(t);
  tRef.current = t;
  const beginCheckoutFiredRef = useRef(false);
  const paymentRef = useRef<PaymentSectionHandle>(null);

  // useLayoutEffect so the sidebar renders on the first paint (before the
  // browser paints the empty slot). Always re-publish when `cart` changes.
  useLayoutEffect(() => {
    if (cart) {
      setSummaryContent(<CheckoutSidebar cart={cart} />);
    } else {
      setSummaryContent(null);
    }
  }, [cart, setSummaryContent]);

  // Refresh cart data (used after coupon changes, express checkout, etc.)
  const loadOrder = useCallback(async () => {
    setLoading(true);
    if (!paymentError) setError(null);

    try {
      const [cartData, market, addressesData, authStatus] = await Promise.all([
        getCheckoutOrder(cartId),
        resolveMarket(urlCountry).catch(() => null),
        getAddresses(),
        checkAuth(),
      ]);

      const countriesData = market
        ? await getMarketCountries(market.id).catch(() => ({
            data: [] as Country[],
          }))
        : { data: [] as Country[] };

      if (!cartData) {
        setError(tRef.current("orderNotFound"));
        setLoading(false);
        return;
      }

      if (cartData.current_step === "complete") {
        routerRef.current.push(`${basePath}/order-placed/${cartId}`);
        return;
      }

      setCart(cartData);
      setCountries(countriesData.data);
      setSavedAddresses(addressesData.data);
      setIsAuthenticated(authStatus);

      return cartData;
    } catch {
      setError(tRef.current("failedToLoadCheckout"));
      return null;
    } finally {
      setLoading(false);
    }
  }, [cartId, urlCountry, basePath, paymentError]);

  // Only fetch on mount if we don't have initial data (e.g. client-side navigation)
  useEffect(() => {
    if (initialData) {
      // Fire begin_checkout analytics for SSR-loaded data
      if (!beginCheckoutFiredRef.current && initialData.cart) {
        try {
          trackBeginCheckout(initialData.cart);
        } catch {
          // Analytics should never break checkout flow
        }
        beginCheckoutFiredRef.current = true;
      }
      return;
    }
    loadOrder().then((cartData) => {
      if (cartData && !beginCheckoutFiredRef.current) {
        try {
          trackBeginCheckout(cartData);
        } catch {
          // Analytics should never break checkout flow
        }
        beginCheckoutFiredRef.current = true;
      }
    });
  }, [initialData, loadOrder]);

  // When the router cache restores a stale /checkout/[id] view (e.g. the
  // user added an item, went to checkout, went back, changed quantity,
  // and returned), our local `cart` keeps the old line items. CartContext
  // refreshes on every pathname change, so when its line-item fingerprint
  // disagrees with ours, refetch the checkout cart so we get the new
  // items plus recalculated totals — `contextCart` itself doesn't carry
  // the checkout-side discount/shipping calculations, so we use it only
  // as a staleness signal, not as the source of truth.
  //
  // We compare line items only, not totals — checkout-page mutations
  // (apply discount, select shipping, etc.) change totals locally but
  // don't reach CartContext, so we'd ping-pong if we keyed on those.
  // Line items only change via cart-page mutations, which CartContext
  // does see.
  //
  // Only `cart` is touched — addresses / countries / auth state are left
  // alone, so the address form keeps typed input.
  useEffect(() => {
    if (!contextCart || contextCart.id !== cartId) return;
    if (cartItemsFingerprint(contextCart) === cartItemsFingerprint(cart))
      return;
    let cancelled = false;
    getCheckoutOrder(cartId)
      .then((fresh) => {
        if (cancelled || !fresh) return;
        if (fresh.current_step === "complete") {
          routerRef.current.push(`${basePath}/order-placed/${cartId}`);
          return;
        }
        setCart(fresh);
      })
      .catch(() => {
        // Best-effort refresh — keep the current cart on failure rather
        // than wiping checkout state.
      });
    return () => {
      cancelled = true;
    };
  }, [contextCart, cartId, cart, basePath]);

  // Handle email blur — persist email as the first backend call
  const handleEmailBlur = useCallback(async (email: string) => {
    const currentOrder = cartRef.current;
    if (!currentOrder || !email.trim()) return;

    // Only persist email if it changed
    if (email === currentOrder.email) return;

    try {
      const result = await updateOrderAddresses(currentOrder.id, { email });
      if (result.success && result.cart) {
        setCart(result.cart);
      }
    } catch {
      // Email save failure is not critical — will be caught on "Pay now"
    }
  }, []);

  // Handle auto-save (address + email on blur)
  const handleAutoSave = useCallback(
    async (addressData: {
      email: string;
      shipping_address?: AddressParams;
      shipping_address_id?: string;
    }) => {
      const currentOrder = cartRef.current;
      if (!currentOrder) return;

      setSaving(true);
      setError(null);

      try {
        const updateResult = await updateOrderAddresses(currentOrder.id, {
          email: addressData.email,
          ...(addressData.shipping_address && {
            shipping_address: addressData.shipping_address,
          }),
          ...(addressData.shipping_address_id && {
            shipping_address_id: addressData.shipping_address_id,
          }),
        });

        if (!updateResult.success) {
          setError(updateResult.error || tRef.current("failedToSaveAddress"));
          return;
        }

        if (updateResult.cart) {
          setCart(updateResult.cart);
        }
      } catch {
        setError(tRef.current("generalError"));
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  // Handle billing address update (called by PaymentSection before gateway confirmation)
  const handleUpdateBillingAddress = useCallback(
    async (data: {
      billing_address?: AddressParams;
      use_shipping?: boolean;
    }): Promise<boolean> => {
      const currentOrder = cartRef.current;
      if (!currentOrder) return false;

      setError(null);

      try {
        const updateResult = await updateOrderAddresses(currentOrder.id, {
          ...(data.billing_address && {
            billing_address: data.billing_address,
          }),
          ...(data.use_shipping && { use_shipping: data.use_shipping }),
        });

        if (!updateResult.success) {
          setError(updateResult.error || tRef.current("failedToSaveBilling"));
          return false;
        }

        return true;
      } catch {
        setError(tRef.current("failedToSaveBillingRetry"));
        return false;
      }
    },
    [],
  );

  // Handle payment completion (called by PaymentSection after payment is verified by server)
  const handlePaymentComplete = useCallback(
    async (completedOrder?: Order) => {
      const currentOrder = cartRef.current;
      if (!currentOrder) return;

      setError(null);

      try {
        try {
          trackAddPaymentInfo(currentOrder);
        } catch {
          // Analytics should never break checkout flow
        }

        // Cache the completed order for the thank-you page
        if (completedOrder) {
          const { cacheCompletedOrder } = await import(
            "@/lib/utils/completed-order-cache"
          );
          cacheCompletedOrder(currentOrder.id, completedOrder);
        }

        routerRef.current.push(`${basePath}/order-placed/${currentOrder.id}`);
      } catch {
        setError(tRef.current("generalError"));
        setProcessing(false);
      }
    },
    [basePath],
  );

  // Fetch states for a country
  const fetchStates = useCallback(async (countryIso: string) => {
    try {
      const country = await getCountry(countryIso);
      return country.states || [];
    } catch {
      return [];
    }
  }, []);

  // Update a saved address
  const handleUpdateSavedAddress = useCallback(
    async (id: string, data: AddressParams): Promise<Address> => {
      const result = await updateAddress(id, data);

      if (!result.success) {
        throw new Error(result.error || tRef.current("failedToSaveAddress"));
      }

      if (!result.address) {
        throw new Error(tRef.current("generalError"));
      }

      return result.address;
    },
    [],
  );

  // Validate and pay — single "Pay now" action
  const validateAndPay = async () => {
    if (!cart) return;

    setSectionErrors({});
    setError(null);

    if (!isAuthenticated && !policyConsent) {
      setPolicyError(true);
      setError(t("policyConsentRequired"));
      document
        .getElementById("policy-consent")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("policy-consent")?.focus();
      return;
    }

    // Refresh cart to get latest requirements
    const freshOrder = await getCheckoutOrder(cart.id);
    if (!freshOrder) {
      setError(t("failedToLoadCheckout"));
      return;
    }
    setCart(freshOrder);

    // Check requirements — skip "payment" since we handle that via
    // the PaymentSection imperative submit (payment is created at confirmation time)
    const prePaymentReqs = (freshOrder.requirements || []).filter(
      (req) => req.step !== "payment",
    );

    if (prePaymentReqs.length > 0) {
      const errorsBySection: Record<string, string[]> = {};

      for (const req of prePaymentReqs) {
        // Map requirement steps to section IDs
        const sectionId =
          req.step === "address"
            ? "address"
            : req.step === "delivery"
              ? "shipping"
              : req.step;
        if (!errorsBySection[sectionId]) {
          errorsBySection[sectionId] = [];
        }
        errorsBySection[sectionId].push(req.message);
      }

      setSectionErrors(errorsBySection);

      // Scroll to first error section
      const firstSection = Object.keys(errorsBySection)[0];
      const el = document.getElementById(`checkout-section-${firstSection}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      return;
    }

    // All requirements met — submit payment
    if (!paymentRef.current) {
      setError(t("failedToInitPayment"));
      return;
    }

    setProcessing(true);
    const result = await paymentRef.current.submit();
    if (result?.error) {
      setError(result.error);
      setProcessing(false);
    }
  };

  // Loading state — only shown when no initial data (client-side navigation).
  // When initialData is provided (SSR), skip the authLoading check since
  // we already know isAuthenticated from the server.
  if (loading || (!initialData && authLoading)) {
    return (
      <div className="checkout-loading animate-pulse space-y-6">
        <div className="h-8 w-1/3" />
        <div className="h-4 w-1/4" />
        <div className="space-y-4 mt-8">
          <div className="h-12" />
          <div className="h-12" />
          <div className="h-12" />
        </div>
      </div>
    );
  }

  // Error state (no cart loaded)
  if (error && !cart) {
    return (
      <div className="checkout-state">
        <h1>{t("checkoutError")}</h1>
        <p>{error}</p>
        <Link href={`${basePath}/cart`} className="checkout-state__action">
          {t("returnToCart")}
        </Link>
      </div>
    );
  }

  if (!cart) return null;

  // Empty cart
  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="checkout-state">
        <h1>{t("emptyCart")}</h1>
        <p>{t("emptyCartDescription")}</p>
        <Link href={`${basePath}/products`} className="checkout-state__action">
          {tc("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <main className="checkout-form">
      <header className="checkout-form__intro">
        <h1>{t("checkout")}</h1>
      </header>

      {/* Error banner */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Checkout form sections — dimmed & disabled during express checkout */}
      <div
        className={`checkout-form__sections ${
          processing
            ? "relative opacity-50 pointer-events-none select-none"
            : "relative"
        }`}
      >
        {/* Contact + Delivery */}
        <div id="checkout-section-address" className="checkout-form__section">
          <AddressSection
            cart={cart}
            countries={countries}
            savedAddresses={savedAddresses}
            isAuthenticated={isAuthenticated}
            signInUrl={`${basePath}/account?redirect=${encodeURIComponent(pathname)}`}
            fetchStates={fetchStates}
            onEmailBlur={handleEmailBlur}
            onAutoSave={handleAutoSave}
            onUpdateSavedAddress={
              isAuthenticated ? handleUpdateSavedAddress : undefined
            }
            errors={sectionErrors.address}
            saving={saving}
            processing={processing}
            user={user}
          />
        </div>

        {/* Shipping method */}
        <div id="checkout-section-shipping" className="checkout-form__section">
          <DeliveryMethodSection errors={sectionErrors.shipping} />
        </div>

        {/* Payment */}
        <div id="checkout-section-payment" className="checkout-form__section">
          <PaymentSection
            ref={paymentRef}
            cart={cart}
            countries={countries}
            isAuthenticated={isAuthenticated}
            fetchStates={fetchStates}
            onUpdateBillingAddress={handleUpdateBillingAddress}
            onPaymentComplete={handlePaymentComplete}
            processing={processing}
            setProcessing={setProcessing}
            errors={sectionErrors.payment}
          />
        </div>

        {/* Policy consent — guests only, authenticated users accepted at registration */}
        {!isAuthenticated && (
          <div className="checkout-form__consent">
            <PolicyConsent
              checked={policyConsent}
              onCheckedChange={(checked) => {
                setPolicyConsent(checked);
                if (checked) setPolicyError(false);
              }}
              error={policyError}
            />
          </div>
        )}

        {/* Pay button */}
        <button
          type="button"
          onClick={validateAndPay}
          disabled={processing}
          className="checkout-form__submit"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {tc("processing")}
            </>
          ) : (
            t("payNow")
          )}
        </button>
      </div>
    </main>
  );
}

export function CheckoutPageContent(props: CheckoutPageContentProps) {
  return (
    <Suspense>
      <CheckoutPageContentInner {...props} />
    </Suspense>
  );
}
