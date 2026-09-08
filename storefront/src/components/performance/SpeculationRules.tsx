/**
 * Speculation Rules API Integration
 *
 * Provides declarative prerendering and prefetching hints for modern Chromium browsers.
 *
 * Rules:
 * - Prerender product detail pages (PDPs) with "moderate" eagerness (user hover/pointerdown intent).
 * - Prefetch category listing pages (PLPs) with "conservative" eagerness (pointerdown/immediate action).
 * - Strictly exclude sensitive, dynamic, or private routes (/cart, /checkout, /account) from speculation.
 *
 * Non-Chromium browsers (Safari, Firefox) safely ignore unrecognized script types.
 */
export function SpeculationRules() {
  const rules = {
    prerender: [
      {
        source: "document",
        where: {
          and: [
            { href_matches: "/*/*/products/*" },
            { not: { href_matches: "/*/*/cart*" } },
            { not: { href_matches: "/*/*/checkout*" } },
            { not: { href_matches: "/*/*/account*" } },
          ],
        },
        eagerness: "moderate",
      },
    ],
    prefetch: [
      {
        source: "document",
        where: {
          and: [
            { href_matches: "/*/*/c/*" },
            { href_matches: "/*/*/products" },
            { not: { href_matches: "/*/*/cart*" } },
            { not: { href_matches: "/*/*/account*" } },
            { not: { href_matches: "/*/*/checkout*" } },
          ],
        },
        eagerness: "conservative",
      },
    ],
  };

  return (
    <script
      type="speculationrules"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(rules) }}
    />
  );
}
