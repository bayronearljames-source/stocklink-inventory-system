import { useState, useEffect, useCallback } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useToast } from "../../components/common/ToastContainer";
import { apiClient } from "../../api/client";
import { Plus, Search, Filter } from "lucide-react";

export const ItemCatalog = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // Modal open/close state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = create mode, object = edit mode

  // Controlled form fields
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("pcs");

  // Submission state for the form
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, item: null });

  const loadItems = useCallback(async (isMounted) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get("/items");
      if (isMounted) setItems(data);
    } catch (err) {
      if (isMounted) {
        setError(err.message);
        toast.error(`Failed to load items: ${err.message}`);
      }
    } finally {
      if (isMounted) setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let isMounted = true;
    loadItems(isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadItems]);

  const openModal = () => {
    setEditingItem(null);
    setItemName("");
    setCategory("");
    setUnitPrice("");
    setUnitOfMeasure("pcs");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setItemName(item.item_name);
    setCategory(item.category);
    setUnitPrice(item.unit_price);
    setUnitOfMeasure(item.unit_of_measure);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!itemName.trim()) {
      setFormError("Item name is required.");
      return;
    }
    if (!category.trim()) {
      setFormError("Category is required.");
      return;
    }
    const price = Number(unitPrice);
    if (unitPrice === "" || isNaN(price) || price < 0) {
      setFormError("Unit price must be a number of 0 or greater.");
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      if (editingItem) {
        await apiClient.put(`/items/${editingItem.item_id}`, {
          item_name: itemName.trim(),
          category: category.trim(),
          unit_price: price,
          unit_of_measure: unitOfMeasure.trim() || "pcs",
        });
        toast.success(`Item "${itemName}" updated successfully`);
      } else {
        await apiClient.post("/items", {
          item_name: itemName.trim(),
          category: category.trim(),
          unit_price: price,
          unit_of_measure: unitOfMeasure.trim() || "pcs",
        });
        toast.success(`Item "${itemName}" created successfully`);
      }

      setIsModalOpen(false);
      await loadItems(true);
    } catch (err) {
      setFormError(err.message);
      toast.error(`Failed to save item: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (item) => {
    setDeleteDialog({ isOpen: true, item });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, item: null });
  };

  const handleDeleteConfirm = async () => {
    const { item } = deleteDialog;
    if (!item) return;

    try {
      await apiClient.delete(`/items/${item.item_id}`);
      toast.success(`Item "${item.item_name}" deleted successfully`);
      await loadItems(true);
      closeDeleteDialog();
    } catch (err) {
      toast.error(`Failed to delete item: ${err.message}`);
      closeDeleteDialog();
    }
  };

  // Get unique categories from items
  const categories = ["All Categories", ...new Set(items.map(item => item.category).filter(Boolean))];

  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === "" ||
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All Categories" ||
      item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <PageHeader
        title="Master Item Catalog"
        description="Centralized master repository of all hardware tools, categories, SKUs, and central warehouse baselines."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Admin Only
          </span>
        }
        action={
          <Button variant="primary" icon={Plus} onClick={openModal}>
            Add New Master Item
          </Button>
        }
      />

      <Card>
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by item name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-3 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white appearance-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Filter className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {isLoading && <LoadingOverlay message="Loading items…" />}

        {!isLoading && error && (
          <div className="py-10 text-center text-sm text-rose-600">
            Failed to load items: {error}
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">
            No items found. Add your first master item to get started.
          </div>
        )}

        {!isLoading && !error && items.length > 0 && filteredItems.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">
            No items match your search or filter criteria.
          </div>
        )}

        {!isLoading && !error && filteredItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3 text-right">Base Price</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.item_id}>
                    <td className="py-3 px-3 font-medium">{item.item_name}</td>
                    <td className="py-3 px-3">{item.category}</td>
                    <td className="py-3 px-3">{item.unit_of_measure}</td>
                    <td className="py-3 px-3 text-right font-mono">
                      ₱
                      {Number(item.unit_price).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteDialog(item)}
                        className="text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Master Item" : "Add New Master Item"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Bosch Hammer Drill 13mm"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Power Tools"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Price (₱) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                placeholder="pcs"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? "Saving…" : editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Item?"
        message={`Are you sure you want to delete "${deleteDialog.item?.item_name}"? This will also remove it from all branch stock records and supplier links.`}
        confirmText="Delete Item"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default ItemCatalog;
