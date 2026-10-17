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

describe("ProductImage direct responsive delivery", () => {
  describe("variants present", () => {
    it("renders a direct WebP img/srcset without a picture/AVIF selection layer", () => {
      const { container } = render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={mockVariants}
          alt="Test Shoe"
          sizes="(max-width: 768px) 100vw, 600px"
        />,
      );

      expect(container.querySelector("picture")).not.toBeInTheDocument();
      expect(container.querySelector('source[type="image/avif"]')).not.toBeInTheDocument();

      const img = screen.getByRole("img");
      const srcset = img.getAttribute("srcset") || "";
      for (const width of [320, 640, 960, 1200]) {
        expect(srcset).toContain(`${width}w`);
      }
      expect(srcset).not.toContain(".avif");
    });

    it("forwards the responsive sizes attribute directly to img", () => {
      const expectedSizes =
        "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px";
      render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={mockVariants}
          alt="Test Shoe"
          sizes={expectedSizes}
        />,
      );

      expect(screen.getByRole("img")).toHaveAttribute("sizes", expectedSizes);
    });

    it("has no responsive candidate wider than 1200", () => {
      render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={mockVariants}
          alt="Test Shoe"
        />,
      );

      const srcset = screen.getByRole("img").getAttribute("srcset") || "";
      const matches = srcset.match(/(\d+)w/g) || [];
      const widths = matches.map((m) => Number.parseInt(m.replace("w", ""), 10));
      expect(Math.max(...widths)).toBeLessThanOrEqual(1200);
    });

    it("uses the bounded 1200 WebP variant as fallback src", () => {
      render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={mockVariants}
          alt="Test Shoe"
        />,
      );

      expect(screen.getByRole("img")).toHaveAttribute(
        "src",
        "https://example.com/variants/1200-def123456789.webp",
      );
    });

    it("sets eager loading for a priority image", () => {
      render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={mockVariants}
          alt="Test Shoe"
          priority
        />,
      );

      expect(screen.getByRole("img")).toHaveAttribute("loading", "eager");
    });

    it("preserves fill positioning for the plain direct img path", () => {
      render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={mockVariants}
          alt="Test Shoe"
          fill
        />,
      );

      const img = screen.getByRole("img");
      expect(img).toHaveStyle({ position: "absolute", inset: "0" });
    });
  });

  describe("variants absent", () => {
    it("falls back to Next Image", () => {
      const { container } = render(
        <ProductImage
          src="https://example.com/original.webp"
          variants={null}
          alt="Test Shoe"
        />,
      );

      expect(container.querySelector("picture")).not.toBeInTheDocument();
      expect(screen.getByRole("img")).toHaveAttribute("alt", "Test Shoe");
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
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });
});
