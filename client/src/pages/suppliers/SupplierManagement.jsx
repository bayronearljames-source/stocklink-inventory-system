import { useState, useEffect, useCallback } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { apiClient } from "../../api/client";
import { Truck, Plus, Package, X, Edit2 } from "lucide-react";

export const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null); // null = create mode, object = edit mode

  // Items modal state
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierItems, setSupplierItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Add/Edit item link modal
  const [isItemLinkModalOpen, setIsItemLinkModalOpen] = useState(false);
  const [editingItemLink, setEditingItemLink] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [minOrderQty, setMinOrderQty] = useState("1");

  // Form fields
  const [supplierName, setSupplierName] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  // Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadSuppliers = useCallback(async (isMounted) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get("/suppliers");
      if (isMounted) setSuppliers(data);
    } catch (err) {
      if (isMounted) setError(err.message);
    } finally {
      if (isMounted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadSuppliers(isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadSuppliers]);

  const openModal = () => {
    setEditingSupplier(null);
    setSupplierName("");
    setContactInfo("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierName(supplier.supplier_name);
    setContactInfo(supplier.contact_info || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!supplierName.trim()) {
      setFormError("Supplier name is required.");
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      if (editingSupplier) {
        await apiClient.put(`/suppliers/${editingSupplier.supplier_id}`, {
          supplier_name: supplierName.trim(),
          contact_info: contactInfo.trim() || null,
        });
      } else {
        await apiClient.post("/suppliers", {
          supplier_name: supplierName.trim(),
          contact_info: contactInfo.trim() || null,
        });
      }

      setIsModalOpen(false);
      await loadSuppliers(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (supplierId) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await apiClient.delete(`/suppliers/${supplierId}`);
      await loadSuppliers(true);
    } catch (err) {
      alert(`Failed to delete supplier: ${err.message}`);
    }
  };

  // ========== SUPPLIER-ITEM LINKING FUNCTIONS ==========

  const openItemsModal = async (supplier) => {
    setSelectedSupplier(supplier);
    setIsItemsModalOpen(true);
    setIsLoadingItems(true);

    try {
      const [items, allItems] = await Promise.all([
        apiClient.get(`/suppliers/${supplier.supplier_id}/items`),
        apiClient.get("/items"),
      ]);
      setSupplierItems(items);
      setAvailableItems(allItems);
    } catch (err) {
      alert(`Failed to load items: ${err.message}`);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const closeItemsModal = () => {
    setIsItemsModalOpen(false);
    setSelectedSupplier(null);
    setSupplierItems([]);
  };

  const openAddItemLinkModal = () => {
    setEditingItemLink(null);
    setSelectedItemId("");
    setUnitCost("");
    setLeadTimeDays("");
    setMinOrderQty("1");
    setFormError(null);
    setIsItemLinkModalOpen(true);
  };

  const openEditItemLinkModal = (itemLink) => {
    setEditingItemLink(itemLink);
    setSelectedItemId(itemLink.item_id);
    setUnitCost(itemLink.unit_cost);
    setLeadTimeDays(itemLink.lead_time_days);
    setMinOrderQty(itemLink.min_order_qty);
    setFormError(null);
    setIsItemLinkModalOpen(true);
  };

  const closeItemLinkModal = () => {
    if (!isSaving) {
      setIsItemLinkModalOpen(false);
    }
  };

  const handleItemLinkSubmit = async (e) => {
    e.preventDefault();

    if (!editingItemLink && !selectedItemId) {
      setFormError("Please select an item.");
      return;
    }

    if (!unitCost || Number(unitCost) < 0) {
      setFormError("Unit cost must be a non-negative number.");
      return;
    }

    if (!leadTimeDays || !Number.isInteger(Number(leadTimeDays)) || Number(leadTimeDays) < 0) {
      setFormError("Lead time must be a non-negative integer.");
      return;
    }

    if (!minOrderQty || !Number.isInteger(Number(minOrderQty)) || Number(minOrderQty) < 1) {
      setFormError("Minimum order quantity must be at least 1.");
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      if (editingItemLink) {
        // Update existing link
        await apiClient.put(
          `/supplier-items/${selectedSupplier.supplier_id}/${selectedItemId}`,
          {
            unit_cost: Number(unitCost),
            lead_time_days: Number(leadTimeDays),
            min_order_qty: Number(minOrderQty),
          }
        );
      } else {
        // Create new link
        await apiClient.post("/supplier-items", {
          supplier_id: selectedSupplier.supplier_id,
          item_id: Number(selectedItemId),
          unit_cost: Number(unitCost),
          lead_time_days: Number(leadTimeDays),
          min_order_qty: Number(minOrderQty),
        });
      }

      setIsItemLinkModalOpen(false);

      // Reload supplier items
      const items = await apiClient.get(`/suppliers/${selectedSupplier.supplier_id}/items`);
      setSupplierItems(items);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItemLink = async (itemId) => {
    if (!window.confirm("Remove this item from the supplier?")) return;

    try {
      await apiClient.delete(`/supplier-items/${selectedSupplier.supplier_id}/${itemId}`);

      // Reload supplier items
      const items = await apiClient.get(`/suppliers/${selectedSupplier.supplier_id}/items`);
      setSupplierItems(items);
    } catch (err) {
      alert(`Failed to remove item link: ${err.message}`);
    }
  };

  const getAvailableItemsForAdd = () => {
    const linkedItemIds = supplierItems.map((si) => si.item_id);
    return availableItems.filter((item) => !linkedItemIds.includes(item.item_id));
  };

  return (
    <div>
      <PageHeader
        title="Supplier Directory"
        description="Manage vendor master records and link items with pricing and lead times."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Admin Only
          </span>
        }
        action={
          <Button variant="primary" icon={Plus} onClick={openModal}>
            Add Supplier Record
          </Button>
        }
      />

      {isLoading && (
        <div className="py-16 text-center text-sm text-slate-500">
          Loading suppliers…
        </div>
      )}

      {!isLoading && error && (
        <div className="py-10 text-center text-sm text-rose-600">
          Failed to load suppliers: {error}
        </div>
      )}

      {!isLoading && !error && suppliers.length === 0 && (
        <div className="py-10 text-center text-sm text-slate-500">
          No suppliers on record yet.
        </div>
      )}

      {!isLoading && !error && suppliers.length > 0 && (
        <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                    <th className="py-3 px-3">Supplier ID</th>
                    <th className="py-3 px-3">Supplier Name</th>
                    <th className="py-3 px-3">Contact Info</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.supplier_id}>
                      <td className="py-3 px-3 font-mono text-xs text-purple-700 font-bold">
                        #{supplier.supplier_id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                        {supplier.supplier_name}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500">
                        {supplier.contact_info || (
                          <span className="italic text-slate-400">
                            No contact on file
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => openItemsModal(supplier)}
                          className="text-xs font-semibold text-emerald-600 hover:underline"
                        >
                          Manage Items
                        </button>
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.supplier_id)}
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
          </Card>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSupplier ? "Edit Supplier Record" : "Add Supplier Record"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supplier Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Apex Industrial Tools Corp."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Info
              <span className="ml-1 text-slate-400 font-normal">
                (optional — email, phone, or both)
              </span>
            </label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="e.g. sales@apex.ph / (02) 8800-0000"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              {isSaving ? "Saving…" : editingSupplier ? "Save Changes" : "Add Supplier"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Supplier Items Management Modal */}
      <Modal
        isOpen={isItemsModalOpen}
        onClose={closeItemsModal}
        title={selectedSupplier ? `Manage Items for ${selectedSupplier.supplier_name}` : "Manage Items"}
        size="large"
      >
        {isLoadingItems ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading items...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">
                Linked items: <span className="font-semibold">{supplierItems.length}</span>
              </p>
              <Button
                variant="primary"
                icon={Plus}
                onClick={openAddItemLinkModal}
                disabled={getAvailableItemsForAdd().length === 0}
              >
                Link Item
              </Button>
            </div>

            {supplierItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No items linked to this supplier yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">Unit Cost</th>
                      <th className="py-2 px-3">Lead Time</th>
                      <th className="py-2 px-3">Min Order</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierItems.map((link) => (
                      <tr key={link.item_id}>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{link.items.item_name}</span>
                          </div>
                          <div className="text-xs text-slate-500">{link.items.category}</div>
                        </td>
                        <td className="py-2 px-3 font-mono text-sm">₱{Number(link.unit_cost).toFixed(2)}</td>
                        <td className="py-2 px-3">{link.lead_time_days} days</td>
                        <td className="py-2 px-3">{link.min_order_qty} {link.items.unit_of_measure}</td>
                        <td className="py-2 px-3 text-right space-x-2">
                          <button
                            onClick={() => openEditItemLinkModal(link)}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItemLink(link.item_id)}
                            className="text-xs font-semibold text-rose-600 hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit Item Link Modal */}
      <Modal
        isOpen={isItemLinkModalOpen}
        onClose={closeItemLinkModal}
        title={editingItemLink ? "Edit Item Pricing" : "Link Item to Supplier"}
      >
        <form onSubmit={handleItemLinkSubmit} className="space-y-4">
          {formError && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item <span className="text-rose-500">*</span>
            </label>
            {editingItemLink ? (
              <div className="px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                {editingItemLink.items.item_name}
              </div>
            ) : (
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select an item...</option>
                {getAvailableItemsForAdd().map((item) => (
                  <option key={item.item_id} value={item.item_id}>
                    {item.item_name} ({item.category})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unit Cost (₱) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="e.g. 125.50"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lead Time (days) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
              placeholder="e.g. 7"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Minimum Order Quantity <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={minOrderQty}
              onChange={(e) => setMinOrderQty(e.target.value)}
              placeholder="e.g. 10"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeItemLinkModal}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? "Saving..." : editingItemLink ? "Update Pricing" : "Link Item"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SupplierManagement;
