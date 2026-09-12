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
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full text-sm px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="e.g. The Sovereign Wholecut Oxford"
          />
          {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Slug *</label>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            className="w-full text-sm px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="e.g. office-footwear-01"
          />
          {fieldErrors.slug && <p className="text-xs text-red-600 mt-1">{fieldErrors.slug}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Base Product SKU (Optional for Draft)</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
            className="w-full text-sm px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900 font-mono"
            placeholder="e.g. MIRZA-OFF-001"
          />
          {fieldErrors.sku && <p className="text-xs text-red-600 mt-1">{fieldErrors.sku}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Description (Plain text — HTML characters safely escaped)
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="Enter product description..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Category Membership</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((c) => (
              <label
                key={c.id}
                className="flex items-center space-x-2 text-sm text-gray-700 p-2 border rounded-md cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(c.id)}
                  onChange={() => handleCategoryToggle(c.id)}
                  className="size-4 text-gray-900 rounded border-gray-300"
                />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t flex items-center justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Creating Draft..." : "Create Draft Product"}
        </button>
      </div>
    </form>
  );
}
