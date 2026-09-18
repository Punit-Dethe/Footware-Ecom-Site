"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import {
  requestMediaLibraryUploadAction,
  finalizeMediaLibraryUploadAction,
} from "@/lib/actions/admin-media-library";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newAssetId: string) => void;
}

export function MediaUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: MediaUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "validating" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setStatus("idle");
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && status !== "uploading" && status !== "validating") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, status, onClose]);

  if (!isOpen) return null;

  function handleFileSelection(file: File) {
    setErrorMessage(null);

    if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      setErrorMessage("SVG images are not allowed.");
      setSelectedFile(null);
      return;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setErrorMessage(
        "Unsupported media type. Allowed formats: WebP, JPEG, PNG, AVIF.",
      );
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_BYTES) {
      setErrorMessage("File size exceeds 10 MB limit.");
      setSelectedFile(null);
      return;
    }

    if (file.size <= 0) {
      setErrorMessage("File is empty.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setStatus("idle");
  }

  async function handleUpload() {
    if (!selectedFile) return;

    try {
      setStatus("uploading");
      setErrorMessage(null);

      // Step 1: Request signed upload credentials from server
      const reqRes = await requestMediaLibraryUploadAction(
        selectedFile.name,
        selectedFile.type,
        selectedFile.size,
      );

      if (!reqRes.success || !reqRes.signedUrl || !reqRes.token || !reqRes.storagePath || !reqRes.assetId) {
        throw new Error(reqRes.error || "Failed to authorize upload.");
      }

      const { assetId, storagePath, token } = reqRes;

      // Step 2: Direct client upload to Supabase Storage endpoint (zero binary bytes through Vercel)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Client storage configuration is missing.");
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { error: uploadError } = await supabase.storage
        .from("product-media")
        .uploadToSignedUrl(storagePath, token, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Direct storage upload failed: ${uploadError.message}`);
      }

      // Step 3: Finalize upload server-side (Sharp format & dimension verification, LQIP, SHA-256)
      setStatus("validating");

      const finalRes = await finalizeMediaLibraryUploadAction({
        assetId,
        storagePath,
        originalFilename: selectedFile.name,
        mimeType: selectedFile.type,
      });

      if (!finalRes.success || !finalRes.asset) {
        throw new Error(finalRes.error || "Server validation and asset finalization failed.");
      }

      // Step 4: Success
      setStatus("success");
      onUploadSuccess(finalRes.asset.id);
      onClose();
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected upload error occurred.",
      );
    }
  }

  const isWorking = status === "uploading" || status === "validating";

  return (
    <>
      <div
        className="admin-drawer-backdrop"
        onClick={() => {
          if (!isWorking) onClose();
        }}
      />
      <div className="admin-modal-panel p-6 sm:p-8" role="dialog" aria-modal="true">
        <div className="flex items-baseline justify-between border-b border-[#cfc4b6] pb-4 mb-6">
          <div>
            <span className="admin-eyebrow">Studio Intake</span>
            <h2 className="admin-title text-2xl mt-0.5">Upload Media</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isWorking}
            className="text-[#706257] hover:text-[#30261f] text-sm p-1 transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Dropzone */}
        {!selectedFile ? (
          <div
            className={`admin-dropzone ${isDragOver ? "admin-dropzone--active" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileSelection(file);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelection(file);
              }}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#30261f]">
                Drop product or visual assets here, or{" "}
                <span className="underline cursor-pointer">browse files</span>
              </p>
              <p className="text-xs text-[#706257]">
                Supported: WebP, JPEG, PNG, AVIF up to 10 MB.
              </p>
              <p className="text-[11px] text-[#8c7e73]">
                Direct encrypted upload to Supabase Storage with server-side Sharp verification.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[#fffefc] border border-[#cfc4b6] p-4 rounded-[2px] flex items-center gap-4">
            <div className="w-16 h-16 bg-[#ece7de] flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#d8d0c5]">
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="Upload preview"
                  width={64}
                  height={64}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#30261f] truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-[#706257]">
                {(selectedFile.size / 1024).toFixed(1)} KB &bull; {selectedFile.type}
              </p>
              {status === "uploading" && (
                <p className="text-[11px] text-[#706257] mt-1 italic animate-pulse">
                  Uploading directly to Supabase Storage...
                </p>
              )}
              {status === "validating" && (
                <p className="text-[11px] text-[#706257] mt-1 italic animate-pulse">
                  Verifying format &amp; computing SHA-256 with Sharp...
                </p>
              )}
            </div>
            {!isWorking && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setStatus("idle");
                }}
                className="text-xs text-[#706257] hover:text-[#30261f] underline"
              >
                Change
              </button>
            )}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-[#faefef] border border-[#deb8b8] text-[#8f2d2d] text-xs rounded-[2px]">
            {errorMessage}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-[#cfc4b6]">
          <button
            type="button"
            onClick={onClose}
            disabled={isWorking}
            className="admin-btn admin-btn-quiet"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isWorking}
            className="admin-btn admin-btn-primary"
          >
            {isWorking
              ? status === "uploading"
                ? "Uploading..."
                : "Validating..."
              : "Upload Asset"}
          </button>
        </div>
      </div>
    </>
  );
}
