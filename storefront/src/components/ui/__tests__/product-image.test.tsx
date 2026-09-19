import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductImage } from "@/components/ui/product-image";
import type { ResponsiveVariantsSchema } from "@/lib/media/delivery";

const mockVariants: ResponsiveVariantsSchema = {
  "320": {
    avif: "https://example.com/variants/320-abc123456789.avif",
    webp: "https://example.com/variants/320-def123456789.webp",
  },
  "640": {
    avif: "https://example.com/variants/640-abc123456789.avif",
    webp: "https://example.com/variants/640-def123456789.webp",
  },
  "960": {
    avif: "https://example.com/variants/960-abc123456789.avif",
    webp: "https://example.com/variants/960-def123456789.webp",
  },
  "1200": {
    avif: "https://example.com/variants/1200-abc123456789.avif",
    webp: "https://example.com/variants/1200-def123456789.webp",
  },
};

describe("ProductImage Direct Responsive Picture", () => {
  describe("variants present", () => {
    it("renders <picture> element when responsive variants are provided", () => {
      const { container } = render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={mockVariants}
          alt="Test Shoe"
          sizes="(max-width: 768px) 100vw, 600px"
        />,
      );

      const picture = container.querySelector("picture");
      expect(picture).toBeInTheDocument();
    });

    it("includes both AVIF and WebP <source> elements", () => {
      const { container } = render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={mockVariants}
          alt="Test Shoe"
          sizes="(max-width: 768px) 100vw, 600px"
        />,
      );

      const avifSource = container.querySelector('source[type="image/avif"]');
      const webpSource = container.querySelector('source[type="image/webp"]');

      expect(avifSource).toBeInTheDocument();
      expect(webpSource).toBeInTheDocument();
    });

    it("contains 320, 640, 960, 1200 widths in srcset for both formats", () => {
      const { container } = render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={mockVariants}
          alt="Test Shoe"
        />,
      );

      const avifSource = container.querySelector('source[type="image/avif"]');
      const webpSource = container.querySelector('source[type="image/webp"]');

      const avifSrcSet = avifSource?.getAttribute("srcset") || "";
      const webpSrcSet = webpSource?.getAttribute("srcset") || "";

      for (const width of [320, 640, 960, 1200]) {
        expect(avifSrcSet).toContain(`${width}w`);
        expect(webpSrcSet).toContain(`${width}w`);
      }
    });

    it("has no source width greater than 1200", () => {
      const { container } = render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={mockVariants}
          alt="Test Shoe"
        />,
      );

      const sources = container.querySelectorAll("source");
      for (const source of sources) {
        const srcset = source.getAttribute("srcset") || "";
        const matches = srcset.match(/(\d+)w/g) || [];
        const widths = matches.map((m) => parseInt(m.replace("w", ""), 10));
        for (const w of widths) {
          expect(w).toBeLessThanOrEqual(1200);
        }
      }
    });

    it("forwards the correct sizes attribute to both <source> elements", () => {
      const expectedSizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px";
      const { container } = render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={mockVariants}
          alt="Test Shoe"
          sizes={expectedSizes}
        />,
      );

      const avifSource = container.querySelector('source[type="image/avif"]');
      const webpSource = container.querySelector('source[type="image/webp"]');

      expect(avifSource).toHaveAttribute("sizes", expectedSizes);
      expect(webpSource).toHaveAttribute("sizes", expectedSizes);
    });

    it("uses bounded fallback src (1200 webp variant) for the inner <img>", () => {
      render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={mockVariants}
          alt="Test Shoe"
        />,
      );

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", "https://example.com/variants/1200-def123456789.webp");
    });

    it("sets loading='eager' when priority or loading='eager' is requested", () => {
      render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={mockVariants}
          alt="Test Shoe"
          priority
        />,
      );

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("loading", "eager");
    });
  });

  describe("variants absent", () => {
    it("falls back to Next Image without rendering a <picture> element", () => {
      const { container } = render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={null}
          alt="Test Shoe"
        />,
      );

      const picture = container.querySelector("picture");
      expect(picture).not.toBeInTheDocument();

      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("alt", "Test Shoe");
    });

    it("renders fallback placeholder icon when src is null", () => {
      const { container } = render(
        <ProductImage
          src={null}
          variants={null}
          alt="No Image"
        />,
      );

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });
});
