import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductEditForm } from "@/components/admin/ProductEditForm";
import type { AdminCategoryRecord, AdminProductDetail } from "@/lib/db/admin-catalog";

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/us/en/admin/products/prod-1",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", () => ({
  default: (props: any) => {
    // biome-ignore lint/performance/noImgElement: test mock for next/image
    return <img alt={props.alt || ""} {...props} />;
  },
}));

const mockActions = vi.hoisted(() => ({
  saveProductAction: vi.fn(),
  archiveProductAction: vi.fn(),
  restoreProductAction: vi.fn(),
}));

vi.mock("@/lib/admin/catalog-api", () => ({
  saveProductRequest: mockActions.saveProductAction,
  createProductRequest: vi.fn(),
}));

vi.mock("@/lib/admin/rpc-client", async () => ({ ...(await import("@/lib/actions/admin-catalog")) }));
vi.mock("@/lib/actions/admin-catalog", () => ({
  saveProductAction: mockActions.saveProductAction,
  archiveProductAction: mockActions.archiveProductAction,
  restoreProductAction: mockActions.restoreProductAction,
}));

vi.mock("@/components/admin/ProductMediaManager", () => ({
  ProductMediaManager: () => <div data-testid="mock-media-manager">Media Manager</div>,
}));

const mockProduct: AdminProductDetail = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "The Ivory Toe-Loop Slide",
  slug: "ivory-toe-loop-slide",
  sku: "SHOE-2026-09-001",
  description: "Minimalist slide sandal in soft ivory nappa leather.",
  descriptionHtml: "<p>Minimalist slide sandal in soft ivory nappa leather.</p>",
  status: "active",
  metaTitle: "Ivory Toe-Loop Slide | Mirza",
  metaDescription: "Handcrafted minimalist footwear.",
  metaKeywords: "slide, sandal, ivory, leather",
  createdAt: new Date("2026-09-01"),
  updatedAt: new Date("2026-09-15"),
  categories: [{ id: "cat-1", name: "Sandals", slug: "sandals" }],
  variants: [
    {
      id: "var-1",
      productId: "11111111-1111-4111-8111-111111111111",
      sku: "SHOE-2026-09-001-38",
      sizeOption: "38",
      priceInCents: 28500,
      compareAtPriceInCents: null,
      currency: "usd",
      quantityOnHand: 25,
      backorderable: false,
      position: 0,
      isDefault: true,
      active: true,
    },
  ],
  media: [],
};

const mockAvailableCategories: AdminCategoryRecord[] = [
  {
    id: "cat-1",
    name: "Sandals",
    slug: "sandals",
    description: null,
    parentId: null,
    position: 1,
    productCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cat-2",
    name: "Slides",
    slug: "slides",
    description: null,
    parentId: null,
    position: 2,
    productCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("ProductEditForm Phase 7 Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockImplementation(() => false);
  });

  it("renders editorial display title, metadata, active storefront link, and clean sections", () => {
    render(
      <ProductEditForm
        initialProduct={mockProduct}
        availableCategories={mockAvailableCategories}
        country="us"
        locale="en"
      />,
    );

    expect(screen.getByRole("heading", { name: "The Ivory Toe-Loop Slide" })).toBeDefined();
    expect(screen.getByText(/View on storefront/i)).toBeDefined();
    expect(screen.getByText("SHOE-2026-09-001")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Product Information" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Categories *" })).toBeDefined();
    expect(screen.getByTestId("mock-media-manager")).toBeDefined();
    expect(screen.getByRole("heading", { name: /Variants \(1\)/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Search & Meta" })).toBeDefined();
  });

  it("detects unsaved dirty state when input values are modified", async () => {
    const user = userEvent.setup();
    render(
      <ProductEditForm
        initialProduct={mockProduct}
        availableCategories={mockAvailableCategories}
        country="us"
        locale="en"
      />,
    );

    // Initially not dirty
    expect(screen.queryByText(/You have unsaved changes/i)).toBeNull();

    // Change title
    const nameInput = screen.getByLabelText(/Product Name \*/i);
    await user.type(nameInput, " - Limited Edition");

    // Dirty indicator should appear
    expect(screen.getByText("You have unsaved changes")).toBeDefined();
    expect(screen.getByText("Unsaved changes")).toBeDefined();
  });

  it("opens Radix Archive confirmation dialog without browser confirm and executes archiveProductAction", async () => {
    const user = userEvent.setup();
    mockActions.archiveProductAction.mockResolvedValueOnce({ success: true });

    render(
      <ProductEditForm
        initialProduct={mockProduct}
        availableCategories={mockAvailableCategories}
        country="us"
        locale="en"
      />,
    );

    // Click Archive button in top action band
    const archiveBtn = screen.getByRole("button", { name: "Archive Product" });
    await user.click(archiveBtn);

    // Radix dialog opens
    expect(await screen.findByRole("heading", { name: "Archive Product" })).toBeDefined();
    expect(
      screen.getByText(/Archiving removes/i),
    ).toBeDefined();
    expect(
      screen.getByText(/from the public storefront immediately/i),
    ).toBeDefined();

    // Confirm window.confirm was NOT called
    expect(window.confirm).not.toHaveBeenCalled();

    // Confirm Archive inside the modal
    const dialogArchiveBtn = screen.getAllByRole("button", { name: "Archive Product" });
    // The second one is inside the dialog
    await user.click(dialogArchiveBtn[dialogArchiveBtn.length - 1]);

    await waitFor(() => {
      expect(mockActions.archiveProductAction).toHaveBeenCalledWith(mockProduct.id);
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });
  it("shows a validation error, keeps edited values, and allows another save", async () => {
    const user = userEvent.setup();
    const message = "Active variant requires an INR price.";
    mockActions.saveProductAction.mockResolvedValueOnce({
      success: false,
      error: message,
      fieldErrors: { variants: message },
    });

    render(
      <ProductEditForm
        initialProduct={mockProduct}
        availableCategories={mockAvailableCategories}
        country="us"
        locale="en"
      />,
    );

    const price = screen.getByRole("spinbutton", { name: "Variant Price" });
    await user.clear(price);
    await user.type(price, "315");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(message);
    });
    expect((price as HTMLInputElement).value).toBe("315");
    expect(
      (screen.getByRole("button", { name: "Save Changes" }) as HTMLButtonElement).disabled,
    ).toBe(false);
    expect(mockRouter.refresh).not.toHaveBeenCalled();
    expect(mockActions.saveProductAction).toHaveBeenCalledWith(
      mockProduct.id,
      expect.objectContaining({
        variants: [expect.objectContaining({ priceInCents: 31500 })],
      }),
    );
  });

  it("adopts persisted IDs for new variants so a second save updates instead of inserts", async () => {
    const user = userEvent.setup();
    const addedVariantId = "88888888-8888-4888-8888-888888888888";
    const persisted = {
      ...mockProduct,
      variants: [
        mockProduct.variants[0],
        {
          ...mockProduct.variants[0],
          id: addedVariantId,
          sku: "SHOE-2026-09-001-2",
          sizeOption: "9",
          position: 1,
          isDefault: false,
          backorderable: true,
          quantityOnHand: 10,
        },
      ],
    };
    mockActions.saveProductAction.mockResolvedValue({
      success: true,
      data: persisted,
    });

    render(
      <ProductEditForm
        initialProduct={mockProduct}
        availableCategories={mockAvailableCategories}
        country="us"
        locale="en"
      />,
    );

    await user.click(screen.getByRole("button", { name: /Add Variant/ }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => {
      expect(screen.getByText("SHOE-2026-09-001-2")).toBeDefined();
    });

    // A repeated save uses the server-assigned UUID instead of re-inserting the SKU.
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => {
      expect(mockActions.saveProductAction).toHaveBeenCalledTimes(2);
    });
    const secondPayload = mockActions.saveProductAction.mock.calls[1][1];
    expect(secondPayload.variants[1]).toEqual(
      expect.objectContaining({
        id: addedVariantId,
        sku: "SHOE-2026-09-001-2",
      }),
    );
  });

  it("reports cache-refresh warnings as a successful database save", async () => {
    const user = userEvent.setup();
    mockActions.saveProductAction.mockResolvedValueOnce({
      success: true,
      data: mockProduct,
      warning: "Storefront refresh failed; the new price may take time to appear.",
    });

    render(
      <ProductEditForm
        initialProduct={mockProduct}
        availableCategories={mockAvailableCategories}
        country="us"
        locale="en"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain(
        "Storefront refresh failed",
      );
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("recovers from a rejected save request without claiming success", async () => {
    const user = userEvent.setup();
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockActions.saveProductAction.mockRejectedValueOnce(new Error("Network failure"));

    try {
      render(
        <ProductEditForm
          initialProduct={mockProduct}
          availableCategories={mockAvailableCategories}
          country="us"
          locale="en"
        />,
      );

      await user.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toContain(
          "Could not confirm whether the changes were saved.",
        );
      });
      expect(screen.queryByText("Changes saved")).toBeNull();
      expect(mockRouter.refresh).not.toHaveBeenCalled();
      expect(
        (screen.getByRole("button", { name: "Save Changes" }) as HTMLButtonElement).disabled,
      ).toBe(false);

      mockActions.saveProductAction.mockResolvedValueOnce({ success: true });
      await user.click(screen.getByRole("button", { name: "Save Changes" }));
      await waitFor(() => {
        expect(screen.getByText("Product saved successfully as active.")).toBeDefined();
      });
      expect(screen.queryByRole("alert")).toBeNull();
      expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
    } finally {
      logSpy.mockRestore();
    }
  });

});
