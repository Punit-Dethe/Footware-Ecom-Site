"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, use, useEffect, useRef } from "react";
import { confirmPaymentAndCompleteCart } from "@/lib/data/payment";
import { extractBasePath } from "@/lib/utils/path";

interface ConfirmPaymentPageProps {
  params: Promise<{
    id: string;
    country: string;
    locale: string;
  }>;
}

export default function ConfirmPaymentPage(props: ConfirmPaymentPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <ConfirmPaymentContent {...props} />
    </Suspense>
  );
}

function ConfirmPaymentContent({
  params,
}: ConfirmPaymentPageProps) {
  const { id: cartId } = use(params);
  const t = useTranslations("checkout");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = extractBasePath(pathname);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    // Stripe: ?session={spreeSessionId}
    // Adyen:  ?sessionId={adyenSessionId}&redirectResult=...
    const sessionId = searchParams.get("session");
    const sessionResult = searchParams.get("sessionResult");
    const redirectResult = searchParams.get("redirectResult");
    const adyenSessionId = searchParams.get("sessionId");

    async function confirmAndRedirect() {
      const result = await confirmPaymentAndCompleteCart(
        cartId,
        sessionId ?? undefined,
        sessionResult ?? undefined,
        redirectResult ?? undefined,
        adyenSessionId ?? undefined,
      );

      if (result.success) {
        // Cache the completed order for the thank-you page
        if (result.order) {
          const { cacheCompletedOrder } = await import(
            "@/lib/utils/completed-order-cache"
          );
          cacheCompletedOrder(cartId, result.order);
        }

        router.replace(`${basePath}/order-placed/${cartId}`);
      } else {
        const errorMessage = encodeURIComponent(
          result.error || t("paymentError"),
        );
        router.replace(
          `${basePath}/checkout/${cartId}?payment_error=${errorMessage}`,
        );
      }
    }

    confirmAndRedirect();
  }, [cartId, searchParams, basePath, router, t]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <p className="text-sm text-gray-500">{t("confirmingPayment")}</p>
    </div>
  );
}
