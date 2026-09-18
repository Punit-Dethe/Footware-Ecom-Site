import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryManager } from "@/components/admin/CategoryManager";
import type { AdminCategoryRecord } from "@/lib/db/admin-catalog";

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/us/en/admin/categories",
  useSearchParams: () => new URLSearchParams(),
}));

const mockActions = vi.hoisted(() => ({
  createCategoryAction: vi.fn(),
  updateCategoryAction: vi.fn(),
  deleteCategoryAction: vi.fn(),
}));

vi.mock("@/lib/actions/admin-catalog", () => ({
  createCategoryAction: mockActions.createCategoryAction,
  updateCategoryAction: mockActions.updateCategoryAction,
  deleteCategoryAction: mockActions.deleteCategoryAction,
}));

const mockCategories: AdminCategoryRecord[] = [
  {
    id: "cat-1",
    name: "Office Wear",
    slug: "office-wear",
    description: "Tailored footwear for business environments",
    parentId: null,
    position: 1,
    productCount: 15,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
  },
  {
    id: "cat-2",
    name: "Oxford Silhouette",
    slug: "oxford-silhouette",
    description: "Classic closed-lacing styles",
    parentId: "cat-1",
    parentName: "Office Wear",
    position: 2,
    productCount: 0,
    createdAt: new Date("2026-01-03"),
    updatedAt: new Date("2026-01-04"),
  },
];

describe("CategoryManager Phase 7 UI & Dialogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on window.alert and window.confirm to verify they are NEVER called
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockImplementation(() => false);
  });

  it("renders category hierarchy, parent relationships, and product counts", () => {
    render(<CategoryManager categories={mockCategories} />);

    expect(screen.getAllByText("Office Wear")).toHaveLength(2); // once as category row, once as parent name
    expect(screen.getByText("Oxford Silhouette")).toBeDefined();
    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText("0")).toBeDefined();
    expect(screen.getByText("+ New Category")).toBeDefined();
  });

  it("blocks deletion of categories with products > 0 via accessible Radix dialog without browser alert", async () => {
    const user = userEvent.setup();
    render(<CategoryManager categories={mockCategories} />);

    // Click Delete on cat-1 (productCount: 15)
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Check that Radix dialog opened explaining deletion block
    expect(await screen.findByRole("heading", { name: "Cannot Delete Category" })).toBeDefined();
    expect(screen.getByText(/associated products and cannot be deleted/i)).toBeDefined();

    // Confirm window.alert was NOT called
    expect(window.alert).not.toHaveBeenCalled();
    expect(mockActions.deleteCategoryAction).not.toHaveBeenCalled();

    // Click Understood to close
    const closeBtn = screen.getByRole("button", { name: /understood/i });
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText("Cannot Delete Category")).toBeNull();
    });
  });

  it("opens confirmation dialog for category with 0 products and executes deleteCategoryAction on confirm", async () => {
    const user = userEvent.setup();
    mockActions.deleteCategoryAction.mockResolvedValueOnce({ success: true });

    render(<CategoryManager categories={mockCategories} />);

    // Click Delete on cat-2 (productCount: 0)
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[1]);

    // Check that Radix confirmation dialog opened
    expect(await screen.findByRole("heading", { name: "Delete Category" })).toBeDefined();
    expect(screen.getByText(/Are you sure you want to delete category/i)).toBeDefined();
    expect(screen.getAllByText(/Oxford Silhouette/i).length).toBeGreaterThanOrEqual(2);

    // Confirm window.confirm was NOT called
    expect(window.confirm).not.toHaveBeenCalled();

    // Click confirm delete in the dialog
    const confirmBtn = screen.getByRole("button", { name: "Delete Category" });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockActions.deleteCategoryAction).toHaveBeenCalledWith("cat-2");
      expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
    });
  });

  it("opens create category dialog and submits valid payload", async () => {
    const user = userEvent.setup();
    mockActions.createCategoryAction.mockResolvedValueOnce({
      success: true,
      data: { id: "cat-3", name: "Casual", slug: "casual" },
    });

    render(<CategoryManager categories={mockCategories} />);

    await user.click(screen.getByRole("button", { name: /\+ New Category/i }));

    expect(await screen.findByRole("heading", { name: "New Category" })).toBeDefined();

    const nameInput = screen.getByLabelText(/Name \*/i);
    await user.type(nameInput, "Casual");

    const submitBtn = screen.getByRole("button", { name: /Create Category/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockActions.createCategoryAction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Casual",
          slug: "casual",
        }),
      );
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });
});
