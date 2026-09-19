import type { Media } from "@/types/commerce";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MediaLightbox } from "@/components/products/MediaLightbox";

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

const mediaWithVariants: Media[] = [
  {
    id: "media-1",
    url: "https://example.com/original-1.webp",
    original_url: "https://example.com/original-1.webp",
    alt: "Canonical Shoe 1",
    variants: mockVariants,
  },
];

const mediaWithoutVariants: Media[] = [
  {
    id: "media-2",
    url: "https://example.com/original-2.webp",
    original_url: "https://example.com/original-2.webp",
    alt: "Legacy Shoe 2",
    variants: undefined,
  },
];

describe("MediaLightbox Direct Responsive Variants", () => {
  it("renders direct responsive <picture> with 100vw when variants are present", () => {
    const { container } = render(
      <MediaLightbox
        images={mediaWithVariants}
        activeIndex={0}
        productName="Canonical Shoe 1"
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    const picture = container.querySelector("picture");
    expect(picture).toBeInTheDocument();

    const avifSource = container.querySelector('source[type="image/avif"]');
    const webpSource = container.querySelector('source[type="image/webp"]');
    expect(avifSource).toBeInTheDocument();
    expect(webpSource).toBeInTheDocument();
    expect(avifSource).toHaveAttribute("sizes", "100vw");
    expect(webpSource).toHaveAttribute("sizes", "100vw");

    const img = screen.getByRole("img");
    expect(img).toHaveClass("object-contain");
  });

  it("safely falls back to Next Image when variants are absent", () => {
    const { container } = render(
      <MediaLightbox
        images={mediaWithoutVariants}
        activeIndex={0}
        productName="Legacy Shoe 2"
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    const picture = container.querySelector("picture");
    expect(picture).not.toBeInTheDocument();

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("alt", "Legacy Shoe 2");
  });
});
