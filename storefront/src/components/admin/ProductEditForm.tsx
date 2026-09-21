"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  archiveProductAction,
  restoreProductAction,
  saveProductAction,
} from "@/lib/actions/admin-catalog";
import type {
  AdminCategoryRecord,
  AdminProductDetail,
  SaveProductVariantInput,
} from "@/lib/db/admin-catalog";
import { ProductMediaManager } from "./ProductMediaManager";

interface ProductEditFormProps {
  initialProduct: AdminProductDetail;
  availableCategories: AdminCategoryRecord[];
  country: string;
  locale: string;
}

interface FormVariant {
  id?: string;
  sku: string;
  sizeOption: string;
  priceDollars: string;
  compareAtDollars: string;
  priceInr: string;
  compareAtInr: string;
  quantityOnHand: number;
  backorderable: boolean;
  isDefault: boolean;
  active: boolean;
  isNew?: boolean;
}

export function ProductEditForm({
  initialProduct,
  availableCategories,
  country,
  locale,
}: ProductEditFormProps) {
  const router = useRouter();
  const basePath = `/${country}/${locale}/admin`;

  // Product fields
  const [name, setName] = useState(initialProduct.name);
  const [slug, setSlug] = useState(initialProduct.slug);
  const [sku, setSku] = useState(initialProduct.sku || "");
  const [description, setDescription] = useState(initialProduct.description || "");
  const [metaTitle, setMetaTitle] = useState(initialProduct.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initialProduct.metaDescription || "");
  const [metaKeywords, setMetaKeywords] = useState(initialProduct.metaKeywords || "");
  const [status, setStatus] = useState(initialProduct.status);

  // Category IDs
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialProduct.categories.map((c) => c.id),
  );

  // Variants state
  const [variants, setVariants] = useState<FormVariant[]>(
    initialProduct.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      sizeOption: v.sizeOption || "",
      priceDollars:
        v.priceInCents != null ? (v.priceInCents / 100).toFixed(2) : "",
      compareAtDollars:
        v.compareAtPriceInCents != null ? (v.compareAtPriceInCents / 100).toFixed(2) : "",
      priceInr:
        v.priceInInrPaise != null
          ? (v.priceInInrPaise / 100).toFixed(2)
          : "",
      compareAtInr:
        v.compareAtPriceInInrPaise != null
          ? (v.compareAtPriceInInrPaise / 100).toFixed(2)
          : "",
      quantityOnHand: v.quantityOnHand,
      backorderable: v.backorderable,
      isDefault: v.isDefault,
      active: v.active,
      isNew: false,
    })),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Radix Archive confirmation dialog
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  // Unsaved changes detection
  const isDirty = useMemo(() => {
    if (name !== initialProduct.name) return true;
    if (slug !== initialProduct.slug) return true;
    if (sku !== (initialProduct.sku || "")) return true;
    if (description !== (initialProduct.description || "")) return true;
    if (metaTitle !== (initialProduct.metaTitle || "")) return true;
    if (metaDescription !== (initialProduct.metaDescription || "")) return true;
    if (metaKeywords !== (initialProduct.metaKeywords || "")) return true;

    // Category comparison
    const initCatIds = initialProduct.categories.map((c) => c.id).sort().join(",");
    const currCatIds = [...selectedCategoryIds].sort().join(",");
    if (initCatIds !== currCatIds) return true;

    // Variants comparison
    if (variants.length !== initialProduct.variants.length) return true;
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const initV = initialProduct.variants[i];
      if (!initV) return true;
      if (v.sku !== initV.sku) return true;
      if (v.sizeOption !== (initV.sizeOption || "")) return true;
      const initPriceUsd =
        initV.priceInCents != null ? (initV.priceInCents / 100).toFixed(2) : "";
      if (v.priceDollars !== initPriceUsd) return true;
      const initCompare =
        initV.compareAtPriceInCents != null
          ? (initV.compareAtPriceInCents / 100).toFixed(2)
          : "";
      if (v.compareAtDollars !== initCompare) return true;
      const initPriceInr =
        initV.priceInInrPaise != null
          ? (initV.priceInInrPaise / 100).toFixed(2)
          : "";
      if (v.priceInr !== initPriceInr) return true;
      const initCompareInr =
        initV.compareAtPriceInInrPaise != null
          ? (initV.compareAtPriceInInrPaise / 100).toFixed(2)
          : "";
      if (v.compareAtInr !== initCompareInr) return true;
      if (v.quantityOnHand !== initV.quantityOnHand) return true;
      if (v.backorderable !== initV.backorderable) return true;
      if (v.isDefault !== initV.isDefault) return true;
      if (v.active !== initV.active) return true;
    }

    return false;
  }, [
    name,
    slug,
    sku,
    description,
    metaTitle,
    metaDescription,
    metaKeywords,
    selectedCategoryIds,
    variants,
    initialProduct,
  ]);

  const handleCategoryToggle = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  const handleAddVariant = () => {
    const nextIndex = variants.length + 1;
    const baseSkuPrefix = sku.trim() ? `${sku.trim()}-` : `VAR-`;
    const newSku = `${baseSkuPrefix}${nextIndex}`;

    setVariants([
      ...variants,
      {
        sku: newSku,
        sizeOption: `${7 + nextIndex}`,
        priceDollars: variants[0]?.priceDollars || "",
        compareAtDollars: "",
        priceInr: variants[0]?.priceInr || "",
        compareAtInr: "",
        quantityOnHand: 10,
        backorderable: true,
        isDefault: variants.length === 0,
        active: true,
        isNew: true,
      },
    ]);
  };

  const handleVariantChange = (
    index: number,
    field: keyof FormVariant,
    value: string | number | boolean,
  ) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSetDefaultVariant = (selectedIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) => ({
        ...v,
        isDefault: i === selectedIndex,
      })),
    );
  };

  const handleSave = async (targetStatus?: "draft" | "active" | "archived") => {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setSuccessMsg(null);

    const newStatus = targetStatus || status;

    const formattedVariants: SaveProductVariantInput[] = variants.map((v, index) => {
      const priceCents = Math.round(parseFloat(v.priceDollars || "0") * 100);
      const compareCents = v.compareAtDollars.trim()
        ? Math.round(parseFloat(v.compareAtDollars) * 100)
        : null;
      const priceInrPaise = v.priceInr?.trim()
        ? Math.round(parseFloat(v.priceInr) * 100)
        : null;
      const compareAtInrPaise = v.compareAtInr?.trim()
        ? Math.round(parseFloat(v.compareAtInr) * 100)
        : null;

      return {
        id: v.id,
        sku: v.sku.trim(),
        sizeOption: v.sizeOption.trim() || null,
        priceInCents: priceCents,
        compareAtPriceInCents: compareCents,
        priceInInrPaise: priceInrPaise,
        compareAtPriceInInrPaise: compareAtInrPaise,
        quantityOnHand: Number(v.quantityOnHand) || 0,
        backorderable: Boolean(v.backorderable),
        isDefault: Boolean(v.isDefault),
        active: Boolean(v.active),
        position: index,
      };
    });

    const payload = {
      name,
      slug,
      sku: sku.trim() || null,
      description,
      status: newStatus,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      metaKeywords: metaKeywords.trim() || null,
      categoryIds: selectedCategoryIds,
      variants: formattedVariants,
    };

    const res = await saveProductAction(initialProduct.id, payload);
    setSaving(false);

    if (!res.success) {
      setError(res.error || "Failed to save product.");
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
    } else {
      setStatus(newStatus);
      setSuccessMsg(`Product saved successfully as ${newStatus}.`);
      router.refresh();
    }
  };

  const handleArchiveConfirm = async () => {
    setShowArchiveDialog(false);
    setSaving(true);
    setError(null);
    const res = await archiveProductAction(initialProduct.id);
    setSaving(false);

    if (!res.success) {
      setError(res.error || "Failed to archive product.");
    } else {
      setStatus("archived");
      setSuccessMsg("Product archived. It is now hidden from the public storefront.");
      router.refresh();
    }
  };

  const handleRestore = async () => {
    setSaving(true);
    setError(null);
    const res = await restoreProductAction(initialProduct.id);
    setSaving(false);

    if (!res.success) {
      setError(res.error || "Failed to restore product.");
    } else {
      setStatus("draft");
      setSuccessMsg("Product restored to draft status.");
      router.refresh();
    }
  };

  let statusBadgeClass = "admin-badge--draft";
  if (status === "active") statusBadgeClass = "admin-badge--active";
  else if (status === "archived") statusBadgeClass = "admin-badge--archived";

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Route Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#706257]">
        <Link href={`${basePath}/products`} className="hover:text-[#30261f] transition-colors">
          Products
        </Link>
        <span>/</span>
        <span className="text-[#30261f] truncate font-medium max-w-xs">{name}</span>
      </nav>

      {/* Main Editorial Header */}
      <div className="border-b border-[#cfc4b6] pb-6 flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="admin-title">{name || "Untitled Product"}</h1>
            <span className={`admin-badge ${statusBadgeClass}`}>{status}</span>
            {isDirty && (
              <span className="admin-dirty-badge" title="Unsaved modifications">
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#706257]">
            <span>
              SKU: <span className="text-[#30261f] tabular-nums">{sku || "—"}</span>
            </span>
            <span>·</span>
            <span>
              ID: <span>{initialProduct.id}</span>
            </span>
            {status === "active" && (
              <>
                <span>·</span>
                <Link
                  href={`/${country}/${locale}/products/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#30261f] underline hover:text-[#1f1813] inline-flex items-center gap-1 font-medium"
                >
                  View on storefront &nearr;
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="admin-feedback admin-feedback--error" role="alert">
          <svg className="w-5 h-5 shrink-0 text-[#8f2d2d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-semibold">Unable to complete action</div>
            <div className="mt-0.5">{error}</div>
          </div>
        </div>
      )}
      {successMsg && (
        <div className="admin-feedback admin-feedback--success" role="status">
          <svg className="w-5 h-5 shrink-0 text-[#2e5229]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <div className="font-semibold">Changes saved</div>
            <div className="mt-0.5">{successMsg}</div>
          </div>
        </div>
      )}

      {/* Action Band */}
      <div className="admin-action-band sticky top-16 z-30 shadow-sm">
        <div className="flex items-center gap-3 text-xs text-[#706257]">
          {isDirty ? (
            <span className="flex items-center gap-1.5 text-[#79571e] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#79571e] animate-ping" />
              You have unsaved changes
            </span>
          ) : (
            <span>All catalog details are saved to database.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === "draft" && (
            <>
              <button
                type="button"
                onClick={() => handleSave("draft")}
                disabled={saving}
                className="admin-btn admin-btn-secondary"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button
                type="button"
                onClick={() => handleSave("active")}
                disabled={saving}
                className="admin-btn admin-btn-primary"
              >
                {saving ? "Publishing..." : "Publish Product"}
              </button>
            </>
          )}

          {status === "active" && (
            <>
              <button
                type="button"
                onClick={() => setShowArchiveDialog(true)}
                disabled={saving}
                className="admin-btn admin-btn-danger"
              >
                Archive Product
              </button>
              <button
                type="button"
                onClick={() => handleSave("active")}
                disabled={saving}
                className="admin-btn admin-btn-primary"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}

          {status === "archived" && (
            <>
              <button
                type="button"
                onClick={handleRestore}
                disabled={saving}
                className="admin-btn admin-btn-secondary"
              >
                {saving ? "Restoring..." : "Restore to Draft"}
              </button>
              <button
                type="button"
                onClick={() => handleSave("archived")}
                disabled={saving}
                className="admin-btn admin-btn-primary"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Product Information */}
      <section className="admin-section space-y-5" aria-labelledby="product-info-heading">
        <div className="admin-section-header">
          <h2 id="product-info-heading" className="admin-section-title">Product Information</h2>
          <span className="admin-section-subtitle">Primary editorial details</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="product-name" className="admin-label">Product Name *</label>
            <input
              id="product-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="admin-input w-full"
              placeholder="e.g. The Sovereign Wholecut Oxford"
            />
            {fieldErrors.name && <p className="admin-field-error">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="product-slug" className="admin-label">Slug *</label>
            <input
              id="product-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="admin-input w-full text-xs"
              placeholder="e.g. the-sovereign-wholecut-oxford"
            />
            {fieldErrors.slug && <p className="admin-field-error">{fieldErrors.slug}</p>}
          </div>

          <div>
            <label htmlFor="product-sku" className="admin-label">Base SKU</label>
            <input
              id="product-sku"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              className="admin-input w-full text-xs tabular-nums"
              placeholder="e.g. SHOE-2026-09-001"
            />
            {fieldErrors.sku && <p className="admin-field-error">{fieldErrors.sku}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="product-desc" className="admin-label">
              Description (Plain Text — HTML characters escaped safely)
            </label>
            <textarea
              id="product-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="admin-input w-full font-sans leading-relaxed"
              placeholder="Enter plain text description. Double newlines create paragraphs."
            />
            {fieldErrors.description && (
              <p className="admin-field-error">{fieldErrors.description}</p>
            )}
            <p className="admin-help-text">
              Storefront descriptions render with safe editorial typography.
            </p>
          </div>
        </div>
      </section>

      {/* Category Membership */}
      <section className="admin-section space-y-4" aria-labelledby="category-heading">
        <div className="admin-section-header">
          <h2 id="category-heading" className="admin-section-title">Categories *</h2>
          <span className="admin-section-subtitle">Storefront collection taxonomy</span>
        </div>

        {fieldErrors.categoryIds && (
          <p className="admin-field-error">{fieldErrors.categoryIds}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {availableCategories.map((cat) => {
            const isSelected = selectedCategoryIds.includes(cat.id);
            return (
              <label
                key={cat.id}
                className={`flex items-center gap-3 p-3 border rounded-[2px] cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#e9e2d6]/60 border-[#30261f]"
                    : "bg-[#fffefc] border-[#cfc4b6] hover:bg-[#ece7de]/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleCategoryToggle(cat.id)}
                  className="w-4 h-4 accent-[#30261f] cursor-pointer"
                />
                <span className="text-xs font-medium text-[#30261f] select-none">
                  {cat.name}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Product Media Manager (Phase 6B Accepted Functionality Preserved) */}
      <ProductMediaManager
        productId={initialProduct.id}
        productStatus={status}
        initialMedia={initialProduct.media || []}
      />

      {/* Variants Operations Table */}
      <section className="admin-section space-y-4" aria-labelledby="variants-heading">
        <div className="admin-section-header">
          <h2 id="variants-heading" className="admin-section-title">
            Variants ({variants.length})
          </h2>
          <button
            type="button"
            onClick={handleAddVariant}
            className="admin-btn admin-btn-secondary !py-1.5 !px-3 !text-[10px]"
          >
            + Add Variant
          </button>
        </div>

        {fieldErrors.variants && (
          <p className="admin-field-error">{fieldErrors.variants}</p>
        )}

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col" className="admin-th w-14 text-center">Default</th>
                <th scope="col" className="admin-th">SKU</th>
                <th scope="col" className="admin-th">Size</th>
                <th scope="col" className="admin-th">Price ($ USD)</th>
                <th scope="col" className="admin-th">Compare-At ($)</th>
                <th scope="col" className="admin-th">Price (₹ INR)</th>
                <th scope="col" className="admin-th">Compare-At (₹)</th>
                <th scope="col" className="admin-th">Stock</th>
                <th scope="col" className="admin-th text-center">Backorder</th>
                <th scope="col" className="admin-th text-center">Active</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, idx) => (
                <tr key={v.id || `new-${idx}`} className="admin-tr">
                  <td className="admin-td text-center">
                    <input
                      type="radio"
                      name="defaultVariant"
                      checked={v.isDefault}
                      onChange={() => handleSetDefaultVariant(idx)}
                      className="w-4 h-4 accent-[#30261f] cursor-pointer"
                      title="Set as default variant"
                      aria-label={`Set ${v.sku} as default variant`}
                    />
                  </td>
                  <td className="admin-td">
                    {v.id && !v.isNew ? (
                      <span className="text-xs text-[#706257] px-2 py-0.5 bg-[#ece7de] rounded-[2px] tabular-nums">
                        {v.sku}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) =>
                          handleVariantChange(idx, "sku", e.target.value.toUpperCase())
                        }
                        className="admin-input !py-1 !px-2 text-xs w-32 tabular-nums"
                        placeholder="SKU"
                        aria-label="Variant SKU"
                      />
                    )}
                  </td>
                  <td className="admin-td">
                    <input
                      type="text"
                      value={v.sizeOption}
                      onChange={(e) =>
                        handleVariantChange(idx, "sizeOption", e.target.value)
                      }
                      className="admin-input !py-1 !px-2 text-xs w-20"
                      placeholder="Size"
                      aria-label="Variant Size"
                    />
                  </td>
                  <td className="admin-td">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={v.priceDollars}
                      onChange={(e) =>
                        handleVariantChange(idx, "priceDollars", e.target.value)
                      }
                      className="admin-input !py-1 !px-2 text-xs w-24"
                      aria-label="Variant Price"
                    />
                  </td>
                  <td className="admin-td">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={v.compareAtDollars}
                      onChange={(e) =>
                        handleVariantChange(idx, "compareAtDollars", e.target.value)
                      }
                      className="admin-input !py-1 !px-2 text-xs w-24"
                      placeholder="Optional"
                      aria-label="Variant Compare-At Price"
                    />
                  </td>
                  <td className="admin-td">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={v.priceInr}
                      onChange={(e) =>
                        handleVariantChange(idx, "priceInr", e.target.value)
                      }
                      className="admin-input !py-1 !px-2 text-xs w-28"
                      aria-label="Variant Price INR"
                    />
                  </td>
                  <td className="admin-td">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={v.compareAtInr}
                      onChange={(e) =>
                        handleVariantChange(idx, "compareAtInr", e.target.value)
                      }
                      className="admin-input !py-1 !px-2 text-xs w-28"
                      placeholder="Optional"
                      aria-label="Variant Compare-At Price INR"
                    />
                  </td>
                  <td className="admin-td">
                    <input
                      type="number"
                      min="0"
                      value={v.quantityOnHand}
                      onChange={(e) =>
                        handleVariantChange(
                          idx,
                          "quantityOnHand",
                          parseInt(e.target.value, 10) || 0,
                        )
                      }
                      className="admin-input !py-1 !px-2 text-xs w-20"
                      aria-label="Variant Quantity on Hand"
                    />
                  </td>
                  <td className="admin-td text-center">
                    <input
                      type="checkbox"
                      checked={v.backorderable}
                      onChange={(e) =>
                        handleVariantChange(idx, "backorderable", e.target.checked)
                      }
                      className="w-4 h-4 accent-[#30261f] cursor-pointer"
                      aria-label="Backorderable"
                    />
                  </td>
                  <td className="admin-td text-center">
                    <input
                      type="checkbox"
                      checked={v.active}
                      onChange={(e) =>
                        handleVariantChange(idx, "active", e.target.checked)
                      }
                      className="w-4 h-4 accent-[#30261f] cursor-pointer"
                      aria-label="Active"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Search & Meta Section */}
      <section className="admin-section space-y-5" aria-labelledby="seo-heading">
        <div className="admin-section-header">
          <h2 id="seo-heading" className="admin-section-title">Search & Meta</h2>
          <span className="admin-section-subtitle">Search indexing & storefront metadata</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="meta-title" className="admin-label">Meta Title</label>
            <input
              id="meta-title"
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="admin-input w-full"
              placeholder="Defaults to product title if omitted"
            />
          </div>

          <div>
            <label htmlFor="meta-keywords" className="admin-label">Meta Keywords</label>
            <input
              id="meta-keywords"
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              className="admin-input w-full"
              placeholder="e.g. wholecut, oxford, leather footwear"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="meta-desc" className="admin-label">Meta Description</label>
            <textarea
              id="meta-desc"
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="admin-input w-full leading-relaxed"
              placeholder="Search engine summary snippet"
            />
          </div>
        </div>
      </section>

      {/* Radix Archive Confirmation Dialog */}
      <DialogPrimitive.Root open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="admin-dialog-overlay" />
          <DialogPrimitive.Content className="admin-dialog-content outline-none">
            <DialogPrimitive.Title className="admin-dialog-title">
              Archive Product
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="admin-dialog-description">
              Archiving removes <strong className="text-[#30261f]">{name}</strong> from the public storefront immediately.
              All catalog imagery, variant configurations, and historical inventory data are preserved in the Mirza Studio and can be restored to draft at any time.
            </DialogPrimitive.Description>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#cfc4b6]">
              <DialogPrimitive.Close asChild>
                <button type="button" className="admin-btn admin-btn-secondary">
                  Cancel
                </button>
              </DialogPrimitive.Close>
              <button
                type="button"
                onClick={handleArchiveConfirm}
                className="admin-btn admin-btn-primary !bg-[#8f2d2d] !border-[#8f2d2d] text-white"
              >
                Archive Product
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
