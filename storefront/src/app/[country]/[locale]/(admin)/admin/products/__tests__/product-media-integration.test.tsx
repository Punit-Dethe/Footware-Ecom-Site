import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminProductMediaPlacement } from "@/lib/db/admin-catalog";
import { ProductMediaManager } from "@/components/admin/ProductMediaManager";
import { ProductMediaLibraryPicker } from "@/components/admin/ProductMediaLibraryPicker";
import { ProductEditForm } from "@/components/admin/ProductEditForm";

// Mock next/navigation
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

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: any) => {
    // biome-ignore lint/performance/noImgElement: test mock for next/image
    return <img alt={props.alt || ""} {...props} />;
  },
}));

// Mock server actions
const mockActions = vi.hoisted(() => ({
  setProductMediaHeroAction: vi.fn(),
  detachMediaAssetFromProductAction: vi.fn(),
  reorderProductMediaActionV1: vi.fn(),
  updateProductMediaAltTextActionV1: vi.fn(),
  attachMediaAssetToProductAction: vi.fn(),
  attachMediaAssetsToProductAction: vi.fn(),
  getProductMediaV1Action: vi.fn(),
  listMediaLibraryAssetsAction: vi.fn(),
  saveProductAction: vi.fn(),
  archiveProductAction: vi.fn(),
  restoreProductAction: vi.fn(),
}));

vi.mock("@/lib/actions/admin-media-library", () => ({
  setProductMediaHeroAction: mockActions.setProductMediaHeroAction,
  detachMediaAssetFromProductAction: mockActions.detachMediaAssetFromProductAction,
  reorderProductMediaActionV1: mockActions.reorderProductMediaActionV1,
  updateProductMediaAltTextActionV1: mockActions.updateProductMediaAltTextActionV1,
  attachMediaAssetToProductAction: mockActions.attachMediaAssetToProductAction,
  attachMediaAssetsToProductAction: mockActions.attachMediaAssetsToProductAction,
  getProductMediaV1Action: mockActions.getProductMediaV1Action,
  listMediaLibraryAssetsAction: mockActions.listMediaLibraryAssetsAction,
}));

vi.mock("@/lib/actions/admin-catalog", () => ({
  saveProductAction: mockActions.saveProductAction,
  archiveProductAction: mockActions.archiveProductAction,
  restoreProductAction: mockActions.restoreProductAction,
}));

const SAMPLE_HERO_PLACEMENT: AdminProductMediaPlacement = {
  id: "pm-1",
  productId: "prod-1",
  mediaAssetId: "asset-1",
  position: 0,
  isHero: true,
  altText: "Hero stone master",
  asset: {
    id: "asset-1",
    provider: "supabase",
    storagePath: "media/asset-1/original.webp",
    publicUrl: "https://example.supabase.co/storage/v1/object/public/product-media/shoe-hero.webp",
    filename: "derby-stone-master.webp",
    width: 1200,
    height: 1200,
    fileSize: 85400,
    dominantColor: "#ece7de",
    lqip: "data:image/webp;base64,sample",
  },
};

const SAMPLE_GALLERY_PLACEMENT: AdminProductMediaPlacement = {
  id: "pm-2",
  productId: "prod-1",
  mediaAssetId: "asset-2",
  position: 1,
  isHero: false,
  altText: "Gallery angle",
  asset: {
    id: "asset-2",
    provider: "supabase",
    storagePath: "media/asset-2/original.webp",
    publicUrl: "https://example.supabase.co/storage/v1/object/public/product-media/shoe-side.webp",
    filename: "derby-side-angle.webp",
    width: 1200,
    height: 1200,
    fileSize: 92100,
    dominantColor: "#ece7de",
    lqip: "data:image/webp;base64,sample2",
  },
};


describe("Phase 6B: Product ↔ Media Library Integration Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActions.setProductMediaHeroAction.mockResolvedValue({ success: true });
    mockActions.detachMediaAssetFromProductAction.mockResolvedValue({ success: true });
    mockActions.reorderProductMediaActionV1.mockResolvedValue({ success: true });
    mockActions.updateProductMediaAltTextActionV1.mockResolvedValue({ success: true });
    mockActions.attachMediaAssetToProductAction.mockResolvedValue({ success: true });
    mockActions.attachMediaAssetsToProductAction.mockResolvedValue({ success: true });
    mockActions.getProductMediaV1Action.mockResolvedValue({
      success: true,
      media: [SAMPLE_HERO_PLACEMENT, SAMPLE_GALLERY_PLACEMENT],
    });
    mockActions.listMediaLibraryAssetsAction.mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            id: "asset-1",
            storage_provider: "supabase",
            storage_path: "media/asset-1/original.webp",
            original_filename: "derby-stone-master.webp",
            mime_type: "image/webp",
            file_size_bytes: 85400,
            width: 1200,
            height: 1200,
            dominant_color: "#ece7de",
            lqip: null,
            processed_variants: null,
            created_at: new Date(),
            updated_at: new Date(),
            usageCount: 1,
            publicUrl: "https://example.supabase.co/shoe-hero.webp",
          },
          {
            id: "asset-new-1",
            storage_provider: "supabase",
            storage_path: "media/asset-new-1/original.webp",
            original_filename: "brogue-heel.webp",
            mime_type: "image/webp",
            file_size_bytes: 65400,
            width: 1200,
            height: 1200,
            dominant_color: "#ece7de",
            lqip: null,
            processed_variants: null,
            created_at: new Date(),
            updated_at: new Date(),
            usageCount: 0,
            publicUrl: "https://example.supabase.co/brogue-heel.webp",
          },
        ],
        totalCount: 2,
        limit: 12,
        offset: 0,
      },
    });
  });

  describe("1. Admin Product Media Authority & Placement Separation", () => {
    it("renders authoritative hero and editable gallery directly from placements", () => {
      render(
        <ProductMediaManager
          productId="prod-1"
          productStatus="active"
          initialMedia={[SAMPLE_HERO_PLACEMENT, SAMPLE_GALLERY_PLACEMENT]}
        />,
      );

      // Hero section shows hero file
      expect(screen.getByText("derby-stone-master.webp")).toBeInTheDocument();
      expect(screen.getByText("Active Hero")).toBeInTheDocument();

      // Gallery section shows non-hero managed file
      expect(screen.getByText("derby-side-angle.webp")).toBeInTheDocument();
    });

    it("renders polished empty state for products with zero managed media", () => {
      render(
        <ProductMediaManager
          productId="prod-draft"
          productStatus="draft"
          initialMedia={[]}
        />,
      );

      expect(screen.getByText("No product imagery yet")).toBeInTheDocument();
      expect(screen.getByText(/Select an existing stone master from the library/i)).toBeInTheDocument();
    });
  });

  describe("2. Select from Library Picker & Multi-Select Attachment", () => {
    it("opens library picker dialog with accessible role and title", async () => {
      const user = userEvent.setup();
      render(
        <ProductMediaManager
          productId="prod-1"
          productStatus="active"
          initialMedia={[SAMPLE_HERO_PLACEMENT]}
        />,
      );

      const pickerBtn = screen.getByRole("button", { name: /Select from Library/i });
      await user.click(pickerBtn);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Select from Library" })).toBeInTheDocument();
    });

    it("disables already-attached assets and attaches unattached selection", async () => {
      const user = userEvent.setup();
      const onAttachSuccess = vi.fn();

      render(
        <ProductMediaLibraryPicker
          productId="prod-1"
          isOpen={true}
          onClose={vi.fn()}
          attachedAssetIds={["asset-1"]}
          onAttachSuccess={onAttachSuccess}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("derby-stone-master.webp")).toBeInTheDocument();
      });

      // asset-1 is already attached -> button is disabled
      const alreadyAttachedBtn = screen.getByRole("button", {
        name: /derby-stone-master.webp \(Already attached\)/i,
      });
      expect(alreadyAttachedBtn).toBeDisabled();

      // asset-new-1 is unattached -> clickable
      const unattachedBtn = screen.getByRole("button", {
        name: /brogue-heel.webp/i,
      });
      expect(unattachedBtn).not.toBeDisabled();

      await user.click(unattachedBtn);

      const attachBtn = screen.getByRole("button", { name: /Attach 1 Media/i });
      expect(attachBtn).toBeEnabled();

      await user.click(attachBtn);

      expect(mockActions.attachMediaAssetsToProductAction).toHaveBeenCalledWith("prod-1", [
        "asset-new-1",
      ]);
      expect(onAttachSuccess).toHaveBeenCalled();
    });
  });

  describe("3. Hero Management, Reordering, and Alt Text", () => {
    it("promotes gallery asset to hero using setProductMediaHeroAction", async () => {
      const user = userEvent.setup();
      render(
        <ProductMediaManager
          productId="prod-1"
          productStatus="active"
          initialMedia={[SAMPLE_HERO_PLACEMENT, SAMPLE_GALLERY_PLACEMENT]}
        />,
      );

      const makeHeroBtn = screen.getByRole("button", { name: /Make Hero/i });
      await user.click(makeHeroBtn);

      expect(mockActions.setProductMediaHeroAction).toHaveBeenCalledWith(
        "prod-1",
        SAMPLE_GALLERY_PLACEMENT.mediaAssetId,
      );
      expect(mockActions.getProductMediaV1Action).toHaveBeenCalledWith("prod-1");
    });

    it("reorders gallery media using keyboard-accessible move buttons", async () => {
      const user = userEvent.setup();
      const secondGallery: AdminProductMediaPlacement = {
        ...SAMPLE_GALLERY_PLACEMENT,
        id: "pm-4",
        mediaAssetId: "asset-4",
        asset: { ...SAMPLE_GALLERY_PLACEMENT.asset, id: "asset-4", filename: "heel-angle.webp" },
      };

      render(
        <ProductMediaManager
          productId="prod-1"
          productStatus="active"
          initialMedia={[SAMPLE_HERO_PLACEMENT, SAMPLE_GALLERY_PLACEMENT, secondGallery]}
        />,
      );

      const moveRightBtn = screen.getByRole("button", { name: /Move derby-side-angle.webp right/i });
      await user.click(moveRightBtn);

      expect(mockActions.reorderProductMediaActionV1).toHaveBeenCalledWith("prod-1", [
        SAMPLE_HERO_PLACEMENT.mediaAssetId,
        secondGallery.mediaAssetId,
        SAMPLE_GALLERY_PLACEMENT.mediaAssetId,
      ]);
    });

    it("updates alt text using updateProductMediaAltTextActionV1", async () => {
      const user = userEvent.setup();
      render(
        <ProductMediaManager
          productId="prod-1"
          productStatus="active"
          initialMedia={[SAMPLE_HERO_PLACEMENT]}
        />,
      );

      const altInput = screen.getByLabelText("Alt Text");
      await user.clear(altInput);
      await user.type(altInput, "Classic leather derby in stone studio lighting");

      const saveBtn = screen.getByRole("button", { name: /Save/i });
      await user.click(saveBtn);

      expect(mockActions.updateProductMediaAltTextActionV1).toHaveBeenCalledWith(
        "prod-1",
        SAMPLE_HERO_PLACEMENT.mediaAssetId,
        "Classic leather derby in stone studio lighting",
      );
    });
  });

  describe("4. Safety Invariants (Active Last-Media & Hero Detach Confirmation)", () => {
    it("blocks detaching final managed asset on active product", async () => {
      const user = userEvent.setup();
      render(
        <ProductMediaManager
          productId="prod-1"
          productStatus="active"
          initialMedia={[SAMPLE_HERO_PLACEMENT]}
        />,
      );

      const removeBtn = screen.getByRole("button", { name: /Remove from Product/i });
      await user.click(removeBtn);

      // Warning message displayed, detach action not called
      expect(
        screen.getByText(/Active products must retain at least one managed image/i),
      ).toBeInTheDocument();
      expect(mockActions.detachMediaAssetFromProductAction).not.toHaveBeenCalled();
    });

    it("requires confirmation when detaching hero asset with remaining gallery", async () => {
      const user = userEvent.setup();
      render(
        <ProductMediaManager
          productId="prod-1"
          productStatus="active"
          initialMedia={[SAMPLE_HERO_PLACEMENT, SAMPLE_GALLERY_PLACEMENT]}
        />,
      );

      const removeHeroBtn = screen.getByRole("button", { name: /Remove from Product/i });
      await user.click(removeHeroBtn);

      // Confirmation dialog opens
      expect(screen.getByRole("heading", { name: "Remove Hero Image?" })).toBeInTheDocument();

      const confirmBtn = screen.getByRole("button", { name: "Remove Hero" });
      await user.click(confirmBtn);

      expect(mockActions.detachMediaAssetFromProductAction).toHaveBeenCalledWith(
        "prod-1",
        SAMPLE_HERO_PLACEMENT.mediaAssetId,
      );
    });
  });

  describe("5. Unsaved Product Edit Form State Preservation", () => {
    it("preserves unsaved text input in ProductEditForm when media actions occur", async () => {
      const user = userEvent.setup();
      const mockProduct = {
        id: "prod-1",
        name: "Derby Shoe Original",
        slug: "derby-shoe-original",
        sku: "SHOE-001",
        description: "Initial description",
        descriptionHtml: "<p>Initial description</p>",
        status: "active" as const,
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [],
        variants: [],
        media: [SAMPLE_HERO_PLACEMENT, SAMPLE_GALLERY_PLACEMENT],
      };

      render(
        <ProductEditForm
          initialProduct={mockProduct}
          availableCategories={[]}
          country="us"
          locale="en"
        />,
      );

      // Type unsaved text in Product Name
      const nameInput = screen.getByLabelText(/Product Name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Derby Shoe Modified Name (Unsaved)");

      // Perform a media action (Make Hero)
      const makeHeroBtn = screen.getByRole("button", { name: /Make Hero/i });
      await user.click(makeHeroBtn);

      // Unsaved form name MUST NOT be wiped out
      expect(nameInput).toHaveValue("Derby Shoe Modified Name (Unsaved)");
      // Full router.refresh() must not have been invoked
      expect(mockRouter.refresh).not.toHaveBeenCalled();
    });
  });
});
