"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProductAction } from "@/lib/actions/admin-catalog";
import type { AdminCategoryRecord } from "@/lib/db/admin-catalog";

interface ProductNewFormProps {
  categories: AdminCategoryRecord[];
  country: string;
  locale: string;
}

export function ProductNewForm({
  categories,
  country,
  locale,
}: ProductNewFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const handleCategoryToggle = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const res = await createProductAction({
      name: name.trim(),
      slug: slug.trim(),
      sku: sku.trim() || null,
      description: description.trim() || null,
      status: "draft",
      categoryIds: selectedCategoryIds,
    });

    setSaving(false);

    if (!res.success) {
      setError(res.error || "Failed to create draft product.");
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
    } else if (res.data?.id) {
      router.push(`/${country}/${locale}/admin/products/${res.data.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-section space-y-6">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Product Details</h2>
        <span className="admin-section-subtitle">Core silhouette information</span>
      </div>

      {error && (
        <div className="admin-feedback admin-feedback--error" role="alert">
          <svg className="w-5 h-5 shrink-0 text-[#8f2d2d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-semibold">Creation Error</div>
            <div className="mt-0.5">{error}</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="new-product-name" className="admin-label">Product Name *</label>
          <input
            id="new-product-name"
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="admin-input w-full"
            placeholder="e.g. The Sovereign Wholecut Oxford"
          />
          {fieldErrors.name && <p className="admin-field-error">{fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="new-product-slug" className="admin-label">Slug *</label>
          <input
            id="new-product-slug"
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            className="admin-input w-full font-mono text-xs"
            placeholder="e.g. sovereign-wholecut-oxford"
          />
          {fieldErrors.slug && <p className="admin-field-error">{fieldErrors.slug}</p>}
        </div>

        <div>
          <label htmlFor="new-product-sku" className="admin-label">Base Product SKU (Optional for Draft)</label>
          <input
            id="new-product-sku"
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
            className="admin-input w-full font-mono text-xs"
            placeholder="e.g. SHOE-2026-09-032"
          />
          {fieldErrors.sku && <p className="admin-field-error">{fieldErrors.sku}</p>}
        </div>

        <div>
          <label htmlFor="new-product-desc" className="admin-label">
            Description (Plain text — HTML characters safely escaped)
          </label>
          <textarea
            id="new-product-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="admin-input w-full font-sans leading-relaxed"
            placeholder="Enter plain text description. Double newlines create paragraphs."
          />
          {fieldErrors.description && (
            <p className="admin-field-error">{fieldErrors.description}</p>
          )}
        </div>

        <div>
          <label className="admin-label mb-2">Category Membership</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {categories.map((c) => {
              const isSelected = selectedCategoryIds.includes(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 p-3 border rounded-[2px] cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#e9e2d6]/60 border-[#30261f]"
                      : "bg-[#fffefc] border-[#cfc4b6] hover:bg-[#ece7de]/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCategoryToggle(c.id)}
                    className="w-4 h-4 accent-[#30261f] cursor-pointer"
                  />
                  <span className="text-xs font-medium text-[#30261f] select-none">
                    {c.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-5 border-t border-[#cfc4b6] flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="admin-btn admin-btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="admin-btn admin-btn-primary"
        >
          {saving ? "Creating Draft..." : "Create Draft Product"}
        </button>
      </div>
    </form>
  );
}
