---
name: Mirza Footwear — Editorial Storefront
description: An artisan's folio of joined photographic planes, expressive type, and considered footwear across discovery and browsing.
colors:
  paper: "#f3efe8"
  opening-field: "#e9e2d6"
  stage: "#ece7de"
  mineral: "#f3efe8"
  ink: "#30261f"
  muted: "#706257"
  umber: "#33271f"
  line: "#d8d0c5"
  craft-text: "#dccfc0"
  footer-text: "#625447"
  footer-line: "#cfc4b6"
  focus: "#8a573b"
typography:
  display:
    fontFamily: "EB Garamond, Georgia, serif"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-.035em"
  product-title:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: "-.015em"
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  square: "0"
spacing:
  gutter: "clamp(24px, 4.45vw, 80px)"
  folio-gap: "22px"
  regular: "24px"
  action-gap: "28px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "15px 22px"
  text-link:
    typography: "{typography.label}"
  product-stage:
    backgroundColor: "{colors.stage}"
    rounded: "{rounded.square}"
  product-title:
    textColor: "{colors.ink}"
    typography: "{typography.product-title}"
---

# Design System: Mirza Footwear Editorial Storefront

## Overview

**Creative North Star: "The artisan's folio"**

**Scope: the visible homepage, catalog browsing, and product-detail surfaces**, including their conditional header and footer treatments. Hidden cached roots must not activate these treatments after navigation. Checkout, accounts, and existing utility panels retain their incumbent styling. Source authority is `storefront/src/app/home-experiment.css`, the three `storefront/src/app/home-folio-*.css` studies, `storefront/src/app/catalog-page.css`, `storefront/src/app/product-page.css`, and their page components.

Cutting, aligning, and joining are translated into interlocking photographic planes and paper mounts. Expressive serif composition gives the page character; a continuous product display keeps shopping clear. Premium quality comes from authored relationships between type, imagery, and space, not sparseness or a target image or word count. The typography, MIRZA wordmark proportions, hero montage, and footer are explicitly accepted anchors.

**Key Characteristics:**

- Paper mounts, overlapping photographs, and purposeful detail crops.
- Roman and true italic serif, with quiet sans-serif shopping controls.
- Warm contained product stages and equally weighted scenic collections.
- The actual MIRZA wordmark enlarged as the closing signature.

## Colors

Warm paper and umber define the light and dark fields. Tonal ramps in the sidecar are synthesized panel aids, not implemented CSS scales.

### Primary

- **Umber Ink** (`ink`): primary text and filled shopping actions.
- **Atelier Umber** (`umber`): craft field, detail mount, and photographic fallback.
- **Tobacco Focus** (`focus`): keyboard outlines on light fields.

### Neutral

- **Warm Paper** (`paper`): shared parchment canvas, scrolled header, and paper mounts; pale reversed text.
- **Opening Stone** (`opening-field`): one continuous field behind the header at the top, hero, and its overlapping mounts.
- **Product Stage** (`stage`): continuous product display and loading shapes.
- **Mineral Surface** (`mineral`): alias of the shared parchment canvas for the homepage product edit and selected collection chapter.
- **Tobacco Gray** (`muted`): descriptions, prices, and craft-entry link.
- **Join Line** (`line`): product-stage seams and optional wholesale divider.
- **Craft Text** (`craft-text`): descriptions and captions on umber.
- **Footer Text / Footer Line** (`footer-text`, `footer-line`): readable secondary content and dividers in the warmer closing field.

## Typography

EB Garamond supplies display headings, product names, and the wordmark. Geist supplies descriptions, navigation, prices, and actions. The homepage additionally loads a real EB Garamond italic face at weight 400 through `--font-folio-italic`; shared roman type remains under `--font-editorial-text`. Italic emphasis is intentional within editorial headings, not a site-wide font replacement.

Display sizes respond to each composition rather than a fixed modular scale. The opening, craft, and collection headings lead; product names use a smaller serif role. Product titles reduce to 19px on narrower screens and 17px at the smallest breakpoint. Body copy generally uses 13–14px; prices retain 12px across desktop and mobile. Preserve the role-specific source measurements and comfortable line lengths.

**The Editorial Contrast Rule.** Pair roman structure with real italic emphasis in editorial headings; keep prices and controls in the quieter sans-serif voice.

## Layout

The content frame has fluid gutters and a maximum width of 1440px; header and footer reach 1600px. Homepage and catalog openings use shared grid alignments and deliberate overlap. The homepage edit keeps its continuous four-stage display; the catalog uses measured gaps to support longer browsing. Tightened transitions separate warm opening fields from lighter product areas without introducing another dark band. The header is 84px high on desktop and 68px on mobile; wordmark measurements remain unchanged.

At 1100px, copy and product metadata adjust. The homepage edit changes to two columns at 1000px; catalog browsing changes from four columns to three, then two at 760px. At 760px, editorial compositions reflow while retaining mounted photographs, and the selected collection diptych stacks into equal portals. Main gutters become 24px, then 20px at 360px. The existing navigation switches to its mobile menu below 1024px.

**The Equal Collections Rule.** Traditional and Office wear retain equal visual weight and matching contextual image frames at every size.

Exact page sequence, photographic crops, and asset choices belong in the homepage surface brief.

## Elevation & Depth

Depth comes from overlapping photographs and solid mounts that share their surrounding field color. No added shadows or translucent washes simulate depth. The sticky header is transparent at the top over Opening Stone, then opaque paper while scrolling or searching. It has no shadow or backdrop blur; existing utility panels retain their own treatment.

**The Joined Planes Rule.** Create depth through deliberate photographic overlap and clean paper edges, not scattered ornamental effects.

## Shapes

Main actions, photographic frames, product stages, and focus outlines have square corners. Fine product dividers express the joined display; they are not borders around every card. Photographs use purposeful cover crops, while product images remain contained. Existing header utility controls keep their component shapes.

## Components

### Shopping actions and navigation

Primary actions are rectangular umber links with pale text, a thin SVG arrow, and a minimum height of 52px. Hover and active states change the background over 180ms. Secondary actions use an underline and a 44px minimum height; hover thickens the underline. Keyboard focus uses a 2px outline with 5px offset, pale on the dark craft field. The centered header wordmark and existing navigation, search, region, account, bag, and mobile controls remain functional.

### Product display

Equal stages use contained photography with 8% interior padding on desktop and 6% on mobile; multiply blending integrates the existing product backgrounds. Serif names and sans prices align below the stages, then stack as space narrows. Hover underlines the name and scales the image subtly over 220ms; keyboard focus outlines the full card. Sales, prices, and stock messages remain conditional on commerce data. Loading placeholders share the stage geometry, and unavailable content offers a real catalog link.

The homepage `More to Discover` rail alone has ambient movement. It travels right-to-left at a quiet minimum speed, carries a restrained amount of release velocity after drag or horizontal-wheel input, then eases back to that minimum. A gesture in the opposite direction reverses the continuing baseline. Keyboard focus pauses the rail, offscreen rails consume no animation work, and reduced-motion preferences leave it fully manual. Other product carousels retain their existing manual behavior.

All Products inserts one vertical architecture story after twenty products. On the four-column grid it occupies the left two columns across two row tracks while four products continue through the right two columns. An unframed photograph fades into a full-width beige text field carrying one large title and a short supporting line. The next product resumes at column one. The story becomes one full-width composition on mobile and is omitted from category listings and search results.

### Folio compositions and collections

The homepage opening relates a larger photograph to a smaller mounted crop; this overlap survives on mobile. Its field fills the first viewport, including the transparent header, while measured top and bottom space lets the photographs scale with the available height. A soft stone-to-paper dissolve is being tested at its lower edge. Editorial headings use real italic accents.

The storefront introduces MIRZA with a centered warm-stone splash on the first visit of each browsing session. The wordmark has its own soft-to-crisp opacity entrance, holds briefly, then fades before the field clears. Reduced-motion visitors receive a brief static mark instead.

The finalized craft composition uses one full-height photograph on the same warm stone field as the opening. Its title crosses the image edge, its supporting copy holds four measured lines, and the photograph itself fills the former outline footprint without a separate frame. Wide internal top and bottom space lets blurred stone-to-paper transitions resolve outside the composition. Mobile reads title, photograph, then copy. A second horizontally scrollable product edit is being tested between craft and collections.

Collections currently exposes three numbered studies for direct comparison: an equal architectural diptych with category-name docks, a quiet horizontal index with landscape frames, and a cinematic procession with a shared editorial heading. Each gives Traditional and Office wear equal weight and remains a direct category link. The third study continues directly from the product scroller on the exact same mineral field, without a transition fade. The controls are temporary evaluation aids.

The catalog opening translates the same system into browsing with an independent campaign image beside the copy and a smaller craft inset mounted across its lower-left edge. The image remains a clean rectangle without a copy-panel cutout. Decorative slogan copy is omitted. The filter rail stays quiet and sticky, product imagery sits on warm stages with measured gaps, and the mid-list craft story uses another mounted image relationship rather than a conventional promotional banner.

The product-detail page uses the parchment canvas throughout. Its opening gives the product image and purchase controls one uninterrupted field; multiply blending removes the apparent white source rectangle from opaque product photography. The factual commerce layer uses Geist for breadcrumbs, price, description, options, and specifications, while the product name and editorial headings retain EB Garamond. A calm two-column chapter pairs the product story with essential specifications. The next chapter is an in-wear lookbook: a narrow fixed text panel, a short soft gradient at the seam, and four horizontally scrollable 3:2 photographs with an edge-peeking control. Related products and the enlarged MIRZA footer close the page. The former duplicate detail crop and dark campaign band are omitted so each chapter has one clear purpose.

### Brand finish

The actual MIRZA wordmark is enlarged above the existing footer links, paired with the existing description. Footer links have 44px minimum height. The signature uses scale and typography rather than invented marks or badges.

Reduced-motion preferences remove transitions, animations, and product hover movement; static editorial crops remain composed.

## Do's and Don'ts

### Do:

- **Do** preserve visible-route scope and hidden-root Activity guards.
- **Do** compose photographs, mounts, roman type, and true italic as deliberate relationships.
- **Do** give both collections equal scenic frames and visual weight.
- **Do** preserve real commerce data, localized content, clear focus, and reduced-motion behavior.

### Don't:

- **Don't** use sparseness, image count, word count, or avoiding repetition as quality targets.
- **Don't** replace art direction with fake stitching, stamps, badges, or arbitrary ornaments.
- **Don't** pair a scenic collection frame with an unequally weighted product cutout.
- **Don't** generate imagery or invent artisan provenance, production claims, or guarantees.
