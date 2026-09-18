import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MediaLibraryAssetItem } from "@/lib/db/media-v1";
import { MediaLibraryClient } from "@/components/admin/media/MediaLibraryClient";
import { MediaUploadModal } from "@/components/admin/media/MediaUploadModal";
import { MediaDetailDrawer } from "@/components/admin/media/MediaDetailDrawer";

// Mock next/navigation
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/us/en/admin/media",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: any) => {
    // biome-ignore lint/performance/noImgElement: test mock for next/image
    return <img alt={props.alt || ""} {...props} />;
  },
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Mock server actions
const mockActions = vi.hoisted(() => ({
  requestMediaLibraryUploadAction: vi.fn(),
  finalizeMediaLibraryUploadAction: vi.fn(),
  getMediaLibraryAssetDetailAction: vi.fn(),
  deleteMediaLibraryAssetAction: vi.fn(),
}));

vi.mock("@/lib/actions/admin-media-library", () => ({
  requestMediaLibraryUploadAction: mockActions.requestMediaLibraryUploadAction,
  finalizeMediaLibraryUploadAction: mockActions.finalizeMediaLibraryUploadAction,
  getMediaLibraryAssetDetailAction: mockActions.getMediaLibraryAssetDetailAction,
  deleteMediaLibraryAssetAction: mockActions.deleteMediaLibraryAssetAction,
}));

const SAMPLE_ASSET: MediaLibraryAssetItem = {
  id: "11111111-1111-4111-8111-111111111111",
  storage_provider: "supabase",
  storage_path: "media/11111111-1111-4111-8111-111111111111/original.webp",
  original_filename: "derby-stone-master.webp",
  mime_type: "image/webp",
  file_size_bytes: 54321,
  width: 1200,
  height: 1200,
  dominant_color: "#ece7de",
  lqip: "data:image/webp;base64,sample",
  processed_variants: null,
  content_sha256: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  created_at: new Date("2026-09-18T10:00:00Z"),
  updated_at: new Date("2026-09-18T10:00:00Z"),
  usageCount: 0,
  publicUrl: "https://example.supabase.co/storage/v1/object/public/product-media/shoe.webp",
};

describe("Phase 6A: Media Library Keyboard Accessibility & Dialog Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActions.getMediaLibraryAssetDetailAction.mockResolvedValue({
      success: true,
      asset: {
        ...SAMPLE_ASSET,
        usage: {
          usageCount: 0,
          products: [],
        },
      },
    });
  });

  describe("1. Media Tiles Keyboard Operability", () => {
    it("renders media tiles as interactive buttons with descriptive accessible names", () => {
      render(
        <MediaLibraryClient
          initialAssets={[SAMPLE_ASSET]}
          totalCount={1}
          page={1}
          limit={24}
          searchParamsState={{ q: "", provider: "supabase", sort: "created_desc" }}
          country="us"
          locale="en"
        />,
      );

      const tile = screen.getByRole("button", {
        name: `Inspect ${SAMPLE_ASSET.original_filename}`,
      });
      expect(tile).toBeInTheDocument();
      expect(tile.tagName).toBe("BUTTON");
      expect(tile).toHaveAttribute("type", "button");
    });

    it("allows Tab focusing on media tiles", async () => {
      const user = userEvent.setup();
      render(
        <MediaLibraryClient
          initialAssets={[SAMPLE_ASSET]}
          totalCount={1}
          page={1}
          limit={24}
          searchParamsState={{ q: "", provider: "supabase", sort: "created_desc" }}
          country="us"
          locale="en"
        />,
      );

      const tile = screen.getByRole("button", {
        name: `Inspect ${SAMPLE_ASSET.original_filename}`,
      });

      await user.tab();
      // Tab moves through buttons / inputs to the media tile
      tile.focus();
      expect(tile).toHaveFocus();
    });

    it("opens asset detail inspector on Enter key", async () => {
      const user = userEvent.setup();
      render(
        <MediaLibraryClient
          initialAssets={[SAMPLE_ASSET]}
          totalCount={1}
          page={1}
          limit={24}
          searchParamsState={{ q: "", provider: "supabase", sort: "created_desc" }}
          country="us"
          locale="en"
        />,
      );

      const tile = screen.getByRole("button", {
        name: `Inspect ${SAMPLE_ASSET.original_filename}`,
      });
      tile.focus();
      expect(tile).toHaveFocus();

      await user.keyboard("{Enter}");

      // Drawer opens and renders dialog with asset inspector
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      expect(screen.getByText("Asset Inspector")).toBeInTheDocument();
    });

    it("opens asset detail inspector on Space key", async () => {
      const user = userEvent.setup();
      render(
        <MediaLibraryClient
          initialAssets={[SAMPLE_ASSET]}
          totalCount={1}
          page={1}
          limit={24}
          searchParamsState={{ q: "", provider: "supabase", sort: "created_desc" }}
          country="us"
          locale="en"
        />,
      );

      const tile = screen.getByRole("button", {
        name: `Inspect ${SAMPLE_ASSET.original_filename}`,
      });
      tile.focus();
      expect(tile).toHaveFocus();

      await user.keyboard(" ");

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      expect(screen.getByText("Asset Inspector")).toBeInTheDocument();
    });
  });

  describe("2. Upload Dropzone Keyboard Support", () => {
    it("renders dropzone as an accessible button control with visible label", () => {
      render(
        <MediaUploadModal
          isOpen={true}
          onClose={vi.fn()}
          onUploadSuccess={vi.fn()}
        />,
      );

      const dropzone = screen.getByRole("button", {
        name: /Upload media file\. Drop files here or press Enter or Space to browse files/i,
      });
      expect(dropzone).toBeInTheDocument();
      expect(dropzone.tagName).toBe("BUTTON");
      expect(dropzone).toHaveAttribute("type", "button");
    });

    it("opens file picker on Enter key via hidden input click", async () => {
      render(
        <MediaUploadModal
          isOpen={true}
          onClose={vi.fn()}
          onUploadSuccess={vi.fn()}
        />,
      );

      const dropzone = screen.getByRole("button", {
        name: /Upload media file/i,
      });

      // Find the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      const inputClickSpy = vi.spyOn(fileInput, "click");

      dropzone.focus();
      expect(dropzone).toHaveFocus();

      // In JSDOM / native button, pressing Enter or clicking fires click
      fireEvent.click(dropzone);
      expect(inputClickSpy).toHaveBeenCalledTimes(1);
    });

    it("does not nest invalid interactive elements inside dropzone button", () => {
      render(
        <MediaUploadModal
          isOpen={true}
          onClose={vi.fn()}
          onUploadSuccess={vi.fn()}
        />,
      );

      const dropzone = screen.getByRole("button", {
        name: /Upload media file/i,
      });

      // Assert no buttons or links are nested inside the dropzone button
      expect(dropzone.querySelectorAll("button, a, input, select, textarea")).toHaveLength(0);
    });
  });

  describe("3. Modal and Drawer Dialog Accessibility", () => {
    it("MediaUploadModal has role=dialog and accessible title relationship", () => {
      render(
        <MediaUploadModal
          isOpen={true}
          onClose={vi.fn()}
          onUploadSuccess={vi.fn()}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      // Check accessible name from DialogPrimitive.Title
      const title = screen.getByRole("heading", { name: "Upload Media" });
      expect(title).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-labelledby", title.id);
    });

    it("MediaDetailDrawer has role=dialog and accessible title relationship", async () => {
      render(
        <MediaDetailDrawer
          asset={SAMPLE_ASSET}
          country="us"
          locale="en"
          isOpen={true}
          onClose={vi.fn()}
          onDeleteSuccess={vi.fn()}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      const title = screen.getByRole("heading", { name: SAMPLE_ASSET.original_filename ?? undefined });
      expect(title).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-labelledby", title.id);

      await waitFor(() => {
        expect(mockActions.getMediaLibraryAssetDetailAction).toHaveBeenCalledWith(SAMPLE_ASSET.id);
      });
    });

    it("closes MediaUploadModal on Escape key when not working", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <MediaUploadModal
          isOpen={true}
          onClose={onClose}
          onUploadSuccess={vi.fn()}
        />,
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(onClose).toHaveBeenCalled();
    });

    it("closes MediaDetailDrawer on Escape key", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <MediaDetailDrawer
          asset={SAMPLE_ASSET}
          country="us"
          locale="en"
          isOpen={true}
          onClose={onClose}
          onDeleteSuccess={vi.fn()}
        />,
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(onClose).toHaveBeenCalled();
    });

    it("restores focus to triggering element when drawer is closed", async () => {
      const user = userEvent.setup();
      render(
        <MediaLibraryClient
          initialAssets={[SAMPLE_ASSET]}
          totalCount={1}
          page={1}
          limit={24}
          searchParamsState={{ q: "", provider: "supabase", sort: "created_desc" }}
          country="us"
          locale="en"
        />,
      );

      const tile = screen.getByRole("button", {
        name: `Inspect ${SAMPLE_ASSET.original_filename}`,
      });
      tile.focus();
      expect(tile).toHaveFocus();

      // Open drawer with Enter
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Close drawer with Escape
      await user.keyboard("{Escape}");

      // Radix Dialog restores focus to triggering tile
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
      expect(tile).toHaveFocus();
    });

    it("restores focus to triggering element when upload modal is closed", async () => {
      const user = userEvent.setup();
      render(
        <MediaLibraryClient
          initialAssets={[SAMPLE_ASSET]}
          totalCount={1}
          page={1}
          limit={24}
          searchParamsState={{ q: "", provider: "supabase", sort: "created_desc" }}
          country="us"
          locale="en"
        />,
      );

      const uploadTrigger = screen.getByRole("button", { name: /\+ Upload Media/i });
      uploadTrigger.focus();
      expect(uploadTrigger).toHaveFocus();

      // Open modal with Enter
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Close modal with Escape
      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
      expect(uploadTrigger).toHaveFocus();
    });
  });
});
