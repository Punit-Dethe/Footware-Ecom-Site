import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProductCarousel } from "../ProductCarousel";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      noProductsFound: "No products found",
      carouselPrev: "Previous products",
      carouselNext: "Next products",
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

  it("renders carousel with products and navigation buttons", () => {
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

    const prevBtn = screen.getByRole("button", { name: "Previous products" });
    const nextBtn = screen.getByRole("button", { name: "Next products" });

    expect(prevBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();
  });

  it("triggers scrollBy on next button click", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ProductCarousel
        products={mockProducts as any}
        basePath="/us/en"
        currency="USD"
      />,
    );

    const scrollContainer = container.querySelector(
      ".overflow-x-auto",
    ) as HTMLElement;
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

    scrollContainer.scrollBy = vi.fn();

    // Trigger scroll listener to update isEnd with mocked dimensions
    act(() => {
      scrollContainer.dispatchEvent(new Event("scroll"));
    });

    const nextBtn = screen.getByRole("button", { name: "Next products" });
    await user.click(nextBtn);

    expect(scrollContainer.scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: "smooth",
      }),
    );
  });
});
