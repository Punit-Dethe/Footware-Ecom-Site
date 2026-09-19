import type { Media } from "@/types/commerce";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MediaGallery } from "@/components/products/MediaGallery";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockVariants = {
  "320": {
    avif: "https://example.com/variants/320-abc.avif",
    webp: "https://example.com/variants/320-abc.webp",
  },
  "640": {
    avif: "https://example.com/variants/640-abc.avif",
    webp: "https://example.com/variants/640-abc.webp",
  },
  "960": {
    avif: "https://example.com/variants/960-abc.avif",
    webp: "https://example.com/variants/960-abc.webp",
  },
  "1200": {
    avif: "https://example.com/variants/1200-abc.avif",
    webp: "https://example.com/variants/1200-abc.webp",
  },
};

const mediaList: Media[] = [
  {
    id: "media-hero",
    url: "https://example.com/hero.webp",
    original_url: "https://example.com/hero.webp",
    alt: "Hero Shoe",
    variants: mockVariants,
  },
  {
    id: "media-thumb-2",
    url: "https://example.com/thumb-2.webp",
    original_url: "https://example.com/thumb-2.webp",
    alt: "Shoe Angle 2",
    variants: mockVariants,
  },
];

describe("MediaGallery Variants Integration", () => {
  it("passes selected media variants to render direct responsive <picture>", () => {
    const { container } = render(
      <MediaGallery images={mediaList} productName="Hero Shoe" />,
    );

    const mainBtn = container.querySelector(".media-gallery__main");
    expect(mainBtn).toBeInTheDocument();

    const picture = mainBtn?.querySelector("picture");
    expect(picture).toBeInTheDocument();

    const avifSource = picture?.querySelector('source[type="image/avif"]');
    const webpSource = picture?.querySelector('source[type="image/webp"]');
    expect(avifSource).toBeInTheDocument();
    expect(webpSource).toBeInTheDocument();
  });
});
