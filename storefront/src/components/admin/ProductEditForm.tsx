"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

  // Product fields
  const [name, setName] = useState(initialProduct.name);
  const [slug, setSlug] = useState(initialProduct.slug);
  const [sku, setSku] = useState(initialProduct.sku || "");
  const [description, setDescription] = useState(initialProduct.description || "");
  const [metaTitle, setMetaTitle] = useState(initialProduct.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initialProduct.metaDescription || "");
  const [metaKeywords, setMetaKeywords] = useState(initialProduct.metaKeywords || "");
  const [status, setStatus] = useState(initialProduct.status);

  // Selected Category IDs
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialProduct.categories.map((c) => c.id),
  );

  // Variants state
  const [variants, setVariants] = useState<FormVariant[]>(
    initialProduct.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      sizeOption: v.sizeOption || "",
      priceDollars: (v.priceInCents / 100).toFixed(2),
      compareAtDollars: v.compareAtPriceInCents != null ? (v.compareAtPriceInCents / 100).toFixed(2) : "",
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
        priceDollars: variants[0]?.priceDollars || "285.00",
        compareAtDollars: "",
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
    value: any,
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

  const handleSave = async (targetStatus?: "draft" | "active") => {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setSuccessMsg(null);

    const newStatus = targetStatus || status;

    // Convert variants to DTO format
    const formattedVariants: SaveProductVariantInput[] = variants.map((v, index) => {
      const priceCents = Math.round(parseFloat(v.priceDollars || "0") * 100);
      const compareCents = v.compareAtDollars.trim()
        ? Math.round(parseFloat(v.compareAtDollars) * 100)
        : null;

      return {
        id: v.id,
        sku: v.sku.trim(),
        sizeOption: v.sizeOption.trim() || null,
        priceInCents: priceCents,
        compareAtPriceInCents: compareCents,
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
      setSuccessMsg(`Product saved successfully as ${newStatus}!`);
      router.refresh();
    }
  };

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this product? It will be removed from the public storefront.")) {
      return;
    }

    setSaving(true);
    setError(null);
    const res = await archiveProductAction(initialProduct.id);
    setSaving(false);

    if (!res.success) {
      setError(res.error || "Failed to archive product.");
    } else {
      setStatus("archived");
      setSuccessMsg("Product archived.");
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

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Action Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 flex items-start gap-2">
          <span className="font-bold">Error:</span>
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-800 flex items-start gap-2">
          <span className="font-bold">Success:</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Top Lifecycle Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{name || "Untitled Product"}</h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                status === "active"
                  ? "bg-green-100 text-green-800"
                  : status === "archived"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {status.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">ID: {initialProduct.id}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>

          {status !== "active" ? (
            <button
              type="button"
              onClick={() => handleSave("active")}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-semibold disabled:opacity-50"
            >
              {saving ? "Publishing..." : "Publish / Activate"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleArchive}
              disabled={saving}
              className="px-4 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md text-sm font-medium disabled:opacity-50"
            >
              Archive Product
            </button>
          )}

          {status === "archived" && (
            <button
              type="button"
              onClick={handleRestore}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-semibold disabled:opacity-50"
            >
              Restore to Draft
            </button>
          )}
        </div>
      </div>

      {/* Basic Details Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Product Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="w-full text-sm px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            {fieldErrors.slug && <p className="text-xs text-red-600 mt-1">{fieldErrors.slug}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Base Product SKU *</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              className="w-full text-sm px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900 font-mono"
            />
            {fieldErrors.sku && <p className="text-xs text-red-600 mt-1">{fieldErrors.sku}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Description (Plain Text — HTML characters escaped safely)
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900 font-sans"
            placeholder="Enter plain text description. Double newlines create paragraphs."
          />
        </div>
      </div>

      {/* Category Membership */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Category Membership *</h3>
        {fieldErrors.categoryIds && (
          <p className="text-xs text-red-600">{fieldErrors.categoryIds}</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableCategories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center space-x-2 text-sm text-gray-700 p-2 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedCategoryIds.includes(cat.id)}
                onChange={() => handleCategoryToggle(cat.id)}
                className="size-4 text-gray-900 rounded border-gray-300"
              />
              <span>{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Variants Editor */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-base font-semibold text-gray-900">Variants ({variants.length})</h3>
          <button
            type="button"
            onClick={handleAddVariant}
            className="text-xs font-semibold px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            + Add Variant
          </button>
        </div>

        {fieldErrors.variants && (
          <p className="text-xs text-red-600">{fieldErrors.variants}</p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-gray-50 font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2">Default</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Price ($ USD)</th>
                <th className="px-3 py-2">Compare-At ($)</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Backorder</th>
                <th className="px-3 py-2">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {variants.map((v, idx) => (
                <tr key={v.id || `new-${idx}`} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-center">
                    <input
                      type="radio"
                      name="defaultVariant"
                      checked={v.isDefault}
                      onChange={() => handleSetDefaultVariant(idx)}
                      className="size-4 text-gray-900"
                      title="Set as default variant"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {v.id && !v.isNew ? (
                      <span className="font-mono text-gray-600 px-2 py-1 bg-gray-100 rounded text-xs">
                        {v.sku}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) =>
                          handleVariantChange(idx, "sku", e.target.value.toUpperCase())
                        }
                        className="px-2 py-1 border rounded text-xs font-mono w-32"
                        placeholder="SKU"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={v.sizeOption}
                      onChange={(e) =>
                        handleVariantChange(idx, "sizeOption", e.target.value)
                      }
                      className="px-2 py-1 border rounded text-xs w-20"
                      placeholder="Size"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={v.priceDollars}
                      onChange={(e) =>
                        handleVariantChange(idx, "priceDollars", e.target.value)
                      }
                      className="px-2 py-1 border rounded text-xs w-24"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={v.compareAtDollars}
                      onChange={(e) =>
                        handleVariantChange(idx, "compareAtDollars", e.target.value)
                      }
                      className="px-2 py-1 border rounded text-xs w-24"
                      placeholder="Optional"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      value={v.quantityOnHand}
                      onChange={(e) =>
                        handleVariantChange(idx, "quantityOnHand", parseInt(e.target.value, 10) || 0)
                      }
                      className="px-2 py-1 border rounded text-xs w-20"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={v.backorderable}
                      onChange={(e) =>
                        handleVariantChange(idx, "backorderable", e.target.checked)
                      }
                      className="size-4 text-gray-900 rounded"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={v.active}
                      onChange={(e) =>
                        handleVariantChange(idx, "active", e.target.checked)
                      }
                      className="size-4 text-green-600 rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEO & Meta Fields */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 border-b pb-2">SEO & Metadata (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Meta Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full text-sm px-3 py-2 border rounded-md border-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Meta Keywords</label>
            <input
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              className="w-full text-sm px-3 py-2 border rounded-md border-gray-300"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Meta Description</label>
            <textarea
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full text-sm px-3 py-2 border rounded-md border-gray-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
