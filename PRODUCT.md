# Mirza Footwear

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

An ecommerce store for footwear, with premium positioning and an emphasis on traditional artisans. Visitors discover footwear and shop the existing catalog.

## Capabilities and Constraints

The existing Next.js storefront provides localized catalog browsing, product pages, search, country/currency selection, accounts, and a shopping bag. Product data and prices come from the existing commerce layer.

The current design request covers the homepage, public catalog browsing, and product-detail surfaces on `UI/experimental`. Preserve product data, filtering, sorting, search, navigation, accounts, cart behavior, and product-detail functionality. Use existing image assets; do not generate images. Use screenshots and previews sparingly. Animation is not a priority.

## Brand Commitments

Retain Mirza Footwear and its editorial direction. The user wants a premium, sophisticated, clean experience with precise typography, scale, product spacing, and rhythm. A light beige background is permitted but not mandatory. Image and text quantities are not goals or constraints: use whatever balance produces the right quality. Existing imagery is placeholder content and repetition is acceptable. Do not mistake premium for merely sparse.

The accepted direction is an artisan's folio: creative thinking about traditional handwork, materials, cutting and joining translated into an authored editorial composition with clear shopping controls. Simplicity must still have character. Traditional and Office wear should have equal visual weight and consistent contextual photography, rather than pairing a scenic image with a shoe cutout.

The user has explicitly approved the current EB Garamond/Geist typography, MIRZA wordmark proportions and spacing, and footer. Preserve these anchors in the current refinement. Improve the combined rhythm of header, hero and product edit rather than treating each as an isolated section. The header should feel joined to the hero at the top and become more compact. Craft copy must support the photographic composition without competing with its headline. Category layouts should share the hero's mounted, overlapping geometry.

The homepage uses the second craft composition. The hero fills the first viewport behind the transparent header and dissolves softly into the product edit. Craft shares the hero's warm stone field, keeps its image full-height without a separate frame, balances a four-line editorial description against it, and now has enough internal top and bottom space for fades on both edges. Preserve the accepted four-product Considered Edit exactly; it is not a carousel. The separate `More to Discover` scroller moves slowly right-to-left, preserves a small amount of drag or horizontal-wheel inertia, and adopts the user's direction when they reverse it. It returns to the same quiet minimum speed, pauses for keyboard focus, and remains manual under reduced-motion preferences. Collections now offers three temporary numbered studies: equal architectural portals, a restrained horizontal index, and a cinematic procession. All three keep Traditional and Office wear equally weighted and directly shoppable. The third study uses the exact product-scroller surface with no intervening fade, so those chapters read as one continuous field. The homepage, catalog, and product page share a light parchment canvas that reads as distinct from white without becoming another dominant color field.

The first storefront visit in a browsing session uses a short centered MIRZA splash on the warm opening field. The wordmark visibly fades from soft and faint to crisp before it fades away with the field. It must not repeat during the same session and must respect reduced-motion preferences.

The catalog carries the homepage's folio system into product browsing: a clean opening image with a craft inset, warm contained product stages, serif product names, quiet filter controls, an image-led editorial interruption, and the same header and footer signature. The hero has no decorative slogan or artificial cutout in its campaign image. The craft inset overlaps the campaign image's lower-left edge. All Products alone includes a vertical architecture story after twenty products; it spans two columns and two rows, with an unframed image fading into a full-width beige title field while four products flow beside it. Category listings do not render this grid feature. The catalog must remain a practical store surface with responsive filters, sorting, accurate counts, real prices, and direct product links.

The product page reduces the catalog language to four clear chapters: product and purchase, story with essential specifications, an in-wear lookbook, and related footwear. Opaque product photography uses the same multiply treatment as the catalog so its white source canvas resolves into the warm product stage. Breadcrumbs, prices, descriptions, options, and specifications use the trusted sans-serif commerce voice while the product name and editorial headings retain the serif. The lookbook fixes a narrow copy column beside four horizontally scrollable 3:2 photographs with a soft seam and partially cropped edge control. Avoid redundant crops and competing panels. Variants, quantity, stock state, cart behavior, policy links, size guidance, product navigation, prices, and localized content remain fully functional. Product pages use the same enlarged MIRZA footer as the homepage and catalog.

## Evidence on Hand

- Existing catalog and category data in the storefront commerce layer.
- Product photography in `storefront/public/catalog-shoes/`.
- Campaign, craft, and heritage imagery in `storefront/public/editorial/`.
- User-supplied screenshot of the current homepage, treated as an anti-reference for density and repetition.

## Open Decisions

No new factual claims about artisan locations, founding dates, production methods, certifications, shipping, or guarantees are authorized. Do not invent them. Audience demographics are unspecified; the design assumes shoppers seeking considered footwear.
