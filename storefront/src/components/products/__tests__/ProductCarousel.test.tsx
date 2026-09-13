import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductCarousel } from "../ProductCarousel";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      noProductsFound: "No products found",
      featuredProducts: "Featured Products",
      sale: "Sale",
      outOfStock: "Out of Stock",
    };
    return translations[key] ?? key;
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    prefetch: vi.fn(),
    push: vi.fn(),
  }),
}));

const mockProducts = [
  {
    id: "prod_1",
    name: "The Sovereign Cap-Toe Oxford",
    slug: "sovereign-cap-toe-oxford",
    purchasable: true,
    price: { display_amount: "$285.00", amount_in_cents: 28500 },
  },
  {
    id: "prod_2",
    name: "The Heritage Wingtip Derby",
    slug: "heritage-wingtip-derby",
    purchasable: true,
    price: { display_amount: "$265.00", amount_in_cents: 26500 },
  },
];

describe("ProductCarousel", () => {
  it("renders empty state when no products are passed", () => {
    render(<ProductCarousel products={[]} basePath="/us/en" />);
    expect(screen.getByText("No products found")).toBeInTheDocument();
  });

  it("renders linked products in a horizontal scroll area without arrows", () => {
    render(
      <ProductCarousel
        products={mockProducts as any}
        basePath="/us/en"
        currency="USD"
      />,
    );

    expect(
      screen.getByText("The Sovereign Cap-Toe Oxford"),
    ).toBeInTheDocument();
    expect(screen.getByText("The Heritage Wingtip Derby")).toBeInTheDocument();

    const scrollArea = screen.getByRole("region", {
      name: "Featured Products",
    });
    expect(scrollArea).toHaveClass("product-carousel__viewport");
    expect(
      screen.getByRole("link", { name: "The Sovereign Cap-Toe Oxford" }),
    ).toHaveAttribute("href", "/us/en/products/sovereign-cap-toe-oxford");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("moves vertical wheel input horizontally, then releases page scrolling at the end", () => {
    render(
      <ProductCarousel
        products={mockProducts as any}
        basePath="/us/en"
        currency="USD"
      />,
    );

    const scrollContainer = screen.getByRole("region", {
      name: "Featured Products",
    });
    Object.defineProperty(scrollContainer, "clientWidth", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(scrollContainer, "scrollWidth", {
      configurable: true,
      value: 2000,
    });
    Object.defineProperty(scrollContainer, "scrollLeft", {
      configurable: true,
      value: 0,
      writable: true,
    });

    const movingEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 120,
    });
    scrollContainer.dispatchEvent(movingEvent);
    expect(scrollContainer.scrollLeft).toBe(120);
    expect(movingEvent.defaultPrevented).toBe(true);

    scrollContainer.scrollLeft = 1000;
    const atEndEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 120,
    });
    scrollContainer.dispatchEvent(atEndEvent);
    expect(scrollContainer.scrollLeft).toBe(1000);
    expect(atEndEvent.defaultPrevented).toBe(false);

    const reverseEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -120,
    });
    scrollContainer.dispatchEvent(reverseEvent);
    expect(scrollContainer.scrollLeft).toBe(880);
    expect(reverseEvent.defaultPrevented).toBe(true);
  });
});
