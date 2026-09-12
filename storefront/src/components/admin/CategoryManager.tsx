"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

  // New category state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newParentId, setNewParentId] = useState("");

  // Edit category state
  const [editingCategory, setEditingCategory] = useState<AdminCategoryRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editParentId, setEditParentId] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    const res = await createCategoryAction({
      name: newName.trim(),
      slug: newSlug.trim() || undefined,
      description: newDesc.trim() || null,
      parentId: newParentId || null,
    });

    setBusy(false);

    if (!res.success) {
      setError(res.error || "Failed to create category");
    } else {
      setSuccess("Category created successfully");
      setShowAddModal(false);
      setNewName("");
      setNewSlug("");
      setNewDesc("");
      setNewParentId("");
      router.refresh();
    }
  };

  const handleStartEdit = (cat: AdminCategoryRecord) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditDesc(cat.description || "");
    setEditParentId(cat.parentId || "");
    setError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setBusy(true);
    setError(null);
    setSuccess(null);

    const res = await updateCategoryAction(editingCategory.id, {
      name: editName.trim(),
      slug: editSlug.trim(),
      description: editDesc.trim() || null,
      parentId: editParentId || null,
    });

    setBusy(false);

    if (!res.success) {
      setError(res.error || "Failed to update category");
    } else {
      setSuccess("Category updated successfully");
      setEditingCategory(null);
      router.refresh();
    }
  };

  const handleDelete = async (cat: AdminCategoryRecord) => {
    if (cat.productCount > 0) {
      alert(`Cannot delete "${cat.name}": It has ${cat.productCount} associated products.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    const res = await deleteCategoryAction(cat.id);
    setBusy(false);

    if (!res.success) {
      setError(res.error || "Failed to delete category");
    } else {
      setSuccess("Category deleted successfully");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize catalog products into hierarchical departments and collections.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          + Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3">Category Name</th>
              <th className="px-6 py-3">Slug</th>
              <th className="px-6 py-3">Parent</th>
              <th className="px-6 py-3">Products Linked</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    {c.description && <div className="text-xs text-gray-500">{c.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-600">{c.slug}</td>
                  <td className="px-6 py-4 text-xs text-gray-600">{c.parentName || "—"}</td>
                  <td className="px-6 py-4 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        c.productCount > 0 ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.productCount} products
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs space-x-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(c)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(c)}
                      className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Add New Category</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newSlug) {
                      setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                    }
                  }}
                  className="w-full text-sm px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase())}
                  className="w-full text-sm px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-sm px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Parent Category</label>
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="w-full text-sm px-3 py-2 border rounded-md"
                >
                  <option value="">None (Top Level)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  {busy ? "Saving..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Edit Category</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value.toLowerCase())}
                  className="w-full text-sm px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full text-sm px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Parent Category</label>
                <select
                  value={editParentId}
                  onChange={(e) => setEditParentId(e.target.value)}
                  className="w-full text-sm px-3 py-2 border rounded-md"
                >
                  <option value="">None (Top Level)</option>
                  {categories
                    .filter((c) => c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  {busy ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
