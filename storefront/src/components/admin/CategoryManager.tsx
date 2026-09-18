"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/lib/actions/admin-catalog";
import type { AdminCategoryRecord } from "@/lib/db/admin-catalog";

interface CategoryManagerProps {
  categories: AdminCategoryRecord[];
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();

  // Create / Edit modal state
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryRecord | null>(null);

  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formParentId, setFormParentId] = useState("");

  // Delete modal state (replaces browser confirm / alert)
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategoryRecord | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormDesc("");
    setFormParentId("");
    setError(null);
  };

  const handleOpenEdit = (cat: AdminCategoryRecord) => {
    setModalMode("edit");
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDesc(cat.description || "");
    setFormParentId(cat.parentId || "");
    setError(null);
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setEditingCategory(null);
    setError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    if (modalMode === "create") {
      const res = await createCategoryAction({
        name: formName.trim(),
        slug: formSlug.trim() || undefined,
        description: formDesc.trim() || null,
        parentId: formParentId || null,
      });
      setBusy(false);

      if (!res.success) {
        setError(res.error || "Failed to create category.");
      } else {
        setSuccess(`Category "${formName.trim()}" created successfully.`);
        handleCloseModal();
        router.refresh();
      }
    } else if (modalMode === "edit" && editingCategory) {
      const res = await updateCategoryAction(editingCategory.id, {
        name: formName.trim(),
        slug: formSlug.trim(),
        description: formDesc.trim() || null,
        parentId: formParentId || null,
      });
      setBusy(false);

      if (!res.success) {
        setError(res.error || "Failed to update category.");
      } else {
        setSuccess(`Category "${formName.trim()}" updated successfully.`);
        handleCloseModal();
        router.refresh();
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setBusy(true);
    setError(null);
    setSuccess(null);

    const res = await deleteCategoryAction(categoryToDelete.id);
    setBusy(false);

    if (!res.success) {
      setError(res.error || "Failed to delete category.");
      setCategoryToDelete(null);
    } else {
      setSuccess(`Category "${categoryToDelete.name}" deleted successfully.`);
      setCategoryToDelete(null);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-[#cfc4b6] pb-6">
        <div>
          <span className="admin-eyebrow">Taxonomy</span>
          <h1 className="admin-title mt-1">Categories</h1>
          <p className="admin-subtitle mt-1">
            Structure the collection and its storefront groupings.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="admin-btn admin-btn-primary"
          >
            + New Category
          </button>
        </div>
      </div>

      {/* Feedback Banners */}
      {error && (
        <div className="admin-feedback admin-feedback--error" role="alert">
          <svg className="w-5 h-5 shrink-0 text-[#8f2d2d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-semibold">Action Failed</div>
            <div className="mt-0.5">{error}</div>
          </div>
        </div>
      )}
      {success && (
        <div className="admin-feedback admin-feedback--success" role="status">
          <svg className="w-5 h-5 shrink-0 text-[#2e5229]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <div className="font-semibold">Success</div>
            <div className="mt-0.5">{success}</div>
          </div>
        </div>
      )}

      {/* Categories Operational Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col" className="admin-th">Category</th>
              <th scope="col" className="admin-th">Slug</th>
              <th scope="col" className="admin-th">Parent</th>
              <th scope="col" className="admin-th">Products</th>
              <th scope="col" className="admin-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-td text-center text-[#706257] py-12">
                  No categories found. Create a new category to organize products.
                </td>
              </tr>
            ) : (
              categories.map((c) => {
                const isChild = Boolean(c.parentId);

                return (
                  <tr key={c.id} className="admin-tr">
                    <td className="admin-td">
                      <div className={`flex items-start ${isChild ? "pl-5" : ""}`}>
                        {isChild && (
                          <span className="text-[#8c7e73] font-mono mr-2 select-none">
                            └─
                          </span>
                        )}
                        <div>
                          <div className="font-medium text-[#30261f] text-sm">
                            {c.name}
                          </div>
                          {c.description && (
                            <div className="text-xs text-[#706257] mt-0.5 max-w-md line-clamp-1">
                              {c.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="admin-td font-mono text-xs text-[#706257]">
                      {c.slug}
                    </td>
                    <td className="admin-td text-xs text-[#706257]">
                      {c.parentName ? (
                        <span className="text-[#30261f]">{c.parentName}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="admin-td text-xs">
                      <span className="text-[#30261f] font-medium">
                        {c.productCount}
                      </span>{" "}
                      <span className="text-[#706257]">products</span>
                    </td>
                    <td className="admin-td text-right whitespace-nowrap space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        className="admin-btn admin-btn-quiet !py-1 !px-2.5 !text-[10px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setCategoryToDelete(c)}
                        className="admin-btn admin-btn-quiet !py-1 !px-2.5 !text-[10px] text-[#8f2d2d] hover:!bg-[#faefef]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Radix Create / Edit Dialog */}
      <DialogPrimitive.Root open={modalMode !== null} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="admin-dialog-overlay" />
          <DialogPrimitive.Content className="admin-dialog-content outline-none">
            <DialogPrimitive.Title className="admin-dialog-title">
              {modalMode === "create" ? "New Category" : "Edit Category"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="admin-dialog-description">
              {modalMode === "create"
                ? "Add a new taxonomy grouping for the Mirza catalog."
                : `Update taxonomy details for "${editingCategory?.name}".`}
            </DialogPrimitive.Description>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="cat-name" className="admin-label">Name *</label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const prevExpectedSlug = formName
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "");
                    setFormName(val);
                    if (modalMode === "create" && (!formSlug || formSlug === prevExpectedSlug)) {
                      setFormSlug(
                        val
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, ""),
                      );
                    }
                  }}
                  className="admin-input w-full"
                  placeholder="e.g. Formal Footwear"
                />
              </div>

              <div>
                <label htmlFor="cat-slug" className="admin-label">Slug *</label>
                <input
                  id="cat-slug"
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value.toLowerCase())}
                  className="admin-input w-full font-mono text-xs"
                  placeholder="e.g. formal-footwear"
                />
              </div>

              <div>
                <label htmlFor="cat-desc" className="admin-label">Description</label>
                <textarea
                  id="cat-desc"
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="admin-input w-full leading-relaxed"
                  placeholder="Storefront description and collection context..."
                />
              </div>

              <div>
                <label htmlFor="cat-parent" className="admin-label">Parent Category</label>
                <select
                  id="cat-parent"
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="admin-select w-full"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#cfc4b6]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="admin-btn admin-btn-primary"
                >
                  {busy ? "Saving..." : modalMode === "create" ? "Create Category" : "Save Changes"}
                </button>
              </div>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Radix Delete Dialog (Block vs Safe Confirm) */}
      <DialogPrimitive.Root
        open={categoryToDelete !== null}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="admin-dialog-overlay" />
          <DialogPrimitive.Content className="admin-dialog-content outline-none">
            {categoryToDelete && categoryToDelete.productCount > 0 ? (
              <>
                <DialogPrimitive.Title className="admin-dialog-title text-[#8f2d2d]">
                  Cannot Delete Category
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="admin-dialog-description">
                  This category contains{" "}
                  <strong className="text-[#30261f]">{categoryToDelete.productCount}</strong>{" "}
                  associated products and cannot be deleted. Reassign or remove all products from{" "}
                  <strong className="text-[#30261f]">{categoryToDelete.name}</strong> before attempting deletion.
                </DialogPrimitive.Description>
                <div className="flex items-center justify-end pt-4 border-t border-[#cfc4b6]">
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(null)}
                    className="admin-btn admin-btn-secondary"
                  >
                    Understood
                  </button>
                </div>
              </>
            ) : (
              <>
                <DialogPrimitive.Title className="admin-dialog-title">
                  Delete Category
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="admin-dialog-description">
                  Are you sure you want to delete category{" "}
                  <strong className="text-[#30261f]">"{categoryToDelete?.name}"</strong>?
                  This action permanently removes the category from the catalog taxonomy.
                </DialogPrimitive.Description>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#cfc4b6]">
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(null)}
                    className="admin-btn admin-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleConfirmDelete}
                    className="admin-btn admin-btn-primary !bg-[#8f2d2d] !border-[#8f2d2d] text-white"
                  >
                    {busy ? "Deleting..." : "Delete Category"}
                  </button>
                </div>
              </>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
