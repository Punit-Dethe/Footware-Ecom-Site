import { BrandSplashOverlay } from "@/components/layout/BrandSplashOverlay";

const splashBootstrap = `
  (() => {
    try {
      const key = "mirza-brand-splash-v1";
      const seen = window.sessionStorage.getItem(key) === "seen";
      document.documentElement.dataset.mirzaSplash = seen ? "seen" : "first";
      if (!seen) window.sessionStorage.setItem(key, "seen");
    } catch {
      document.documentElement.dataset.mirzaSplash = "first";
    }
  })();
`;

export function BrandSplash() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: splashBootstrap }} />
      <noscript>
        <style>{`.mirza-splash { display: none !important; }`}</style>
      </noscript>
      <BrandSplashOverlay />
    </>
  );
}
