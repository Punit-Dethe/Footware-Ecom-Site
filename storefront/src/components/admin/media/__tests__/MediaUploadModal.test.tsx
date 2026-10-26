import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MediaUploadModal } from "../MediaUploadModal";

const mockMedia = vi.hoisted(() => ({
  request: vi.fn(),
  finalize: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@/lib/admin/rpc-client", async () => ({ ...(await import("@/lib/actions/admin-media-library")) }));
vi.mock("@/lib/actions/admin-media-library", () => ({
  requestMediaLibraryUploadAction: mockMedia.request,
  finalizeMediaLibraryUploadAction: mockMedia.finalize,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: { from: () => ({ uploadToSignedUrl: mockMedia.upload }) },
  }),
}));

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt?: string; src: string }) => (
    // biome-ignore lint/performance/noImgElement: test stub for next/image
    <img alt={alt || ""} {...props} />
  ),
}));

const ASSET_ID = "11111111-1111-4111-8111-111111111111";
const PATH = `media/${ASSET_ID}/original.png`;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:test-upload"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  mockMedia.request.mockResolvedValue({
    success: true,
    signedUrl: "https://example.supabase.co/signed",
    token: "signed-token",
    storagePath: PATH,
    assetId: ASSET_ID,
  });
  mockMedia.upload.mockResolvedValue({ error: null });
  mockMedia.finalize.mockResolvedValue({
    success: true,
    asset: { id: ASSET_ID },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Product media upload completion", () => {
  async function selectImage() {
    const user = userEvent.setup();
    render(
      <MediaUploadModal
        isOpen={true}
        onClose={onClose}
        onUploadSuccess={onUploadSuccess}
      />,
    );
    // Radix portals the upload dialog outside React Testing Library's render container.
    const fileInput = document.body.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    await user.upload(
      fileInput,
      new File(["valid mock data"], "shoe.png", { type: "image/png" }),
    );
    return user;
  }

  let onClose: ReturnType<typeof vi.fn>;
  let onUploadSuccess: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onUploadSuccess = vi.fn();
  });

  it("keeps the dialog open when attachment fails, and retries without reuploading", async () => {
    onUploadSuccess
      .mockRejectedValueOnce(new Error("Product attachment rejected"))
      .mockResolvedValueOnce(undefined);

    const user = await selectImage();
    await user.click(screen.getByRole("button", { name: "Upload Asset" }));

    expect(await screen.findByText(/Image is already in the Media Library but could not be attached/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry Attachment" })).toBeEnabled();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockMedia.request).toHaveBeenCalledTimes(1);
    expect(mockMedia.finalize).toHaveBeenCalledTimes(1);
    expect(mockMedia.upload).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Retry Attachment" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onUploadSuccess).toHaveBeenCalledTimes(2);
    expect(onUploadSuccess).toHaveBeenNthCalledWith(2, ASSET_ID);
    expect(mockMedia.request).toHaveBeenCalledTimes(1);
    expect(mockMedia.upload).toHaveBeenCalledTimes(1);
  });

  it("does not close before async product attachment completes", async () => {
    let completeAttachment: (() => void) | undefined;
    onUploadSuccess.mockImplementation(() => new Promise<void>((resolve) => {
      completeAttachment = resolve;
    }));

    const user = await selectImage();
    await user.click(screen.getByRole("button", { name: "Upload Asset" }));

    expect(await screen.findByRole("button", { name: "Attaching..." })).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();

    completeAttachment?.();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
