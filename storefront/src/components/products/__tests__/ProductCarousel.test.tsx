import { fireEvent, render, screen } from "@testing-library/react";
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
      screen.getAllByText("The Sovereign Cap-Toe Oxford")[0],
    ).toBeInTheDocument();
    expect(screen.getAllByText("The Heritage Wingtip Derby")[0]).toBeInTheDocument();

    const scrollArea = screen.getByRole("region", {
      name: "Featured Products",
    });
    expect(scrollArea).toHaveClass("product-carousel__viewport");
    expect(
      screen.getAllByRole("link", { name: "The Sovereign Cap-Toe Oxford" })[0],
    ).toHaveAttribute("href", "/us/en/products/sovereign-cap-toe-oxford");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(scrollArea).toHaveAttribute("tabindex", "0");
  });

  it("drags with the mouse without following a product link", () => {
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
    Object.defineProperty(scrollContainer, "scrollLeft", {
      configurable: true,
      value: 500,
      writable: true,
    });

    fireEvent.pointerDown(scrollContainer, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 300 });
    fireEvent.pointerMove(scrollContainer, { pointerId: 1, pointerType: "mouse", clientX: 240 });
    expect(scrollContainer.scrollLeft).toBe(560);
    expect(scrollContainer).toHaveClass("is-dragging");
    fireEvent.pointerUp(scrollContainer, { pointerId: 1, pointerType: "mouse" });
    expect(scrollContainer).not.toHaveClass("is-dragging");

    const link = screen.getAllByRole("link", { name: "The Sovereign Cap-Toe Oxford" })[0];
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });

  it("wraps the repeated sequence as the viewport reaches either side", () => {
    render(<ProductCarousel products={mockProducts as any} basePath="/us/en" />);
    const viewport = screen.getByRole("region", { name: "Featured Products" });
    const items = viewport.querySelectorAll(".product-carousel__item");
    items.forEach((item, index) => {
      Object.defineProperty(item, "offsetLeft", { configurable: true, value: index * 100 });
    });
    Object.defineProperty(viewport, "scrollLeft", { configurable: true, value: 0, writable: true });
    fireEvent(window, new Event("resize"));
    expect(viewport.scrollLeft).toBe(600);

    viewport.scrollLeft = 200;
    fireEvent.scroll(viewport);
    expect(viewport.scrollLeft).toBe(800);
    viewport.scrollLeft = 1000;
    fireEvent.scroll(viewport);
    expect(viewport.scrollLeft).toBe(400);
  });
});
