import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/constants";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { apiClient } from "../../api/client";
import { AlertTriangle, CheckCircle2, Plus, Pencil, Trash2 } from "lucide-react";

export const BranchStock = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const canModify = isAdmin || user?.role === ROLES.BRANCH_MANAGER;

  const [stockRows, setStockRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin-only client-side branch filter — server already scopes non-admins to their own branch_id
  const [selectedBranch, setSelectedBranch] = useState("all");

  // Modal state for Add/Edit stock
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null); // null = create mode, object = edit mode

  // Dropdown options
  const [branches, setBranches] = useState([]);
  const [items, setItems] = useState([]);

  // Form fields
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reorderThreshold, setReorderThreshold] = useState("");

  // Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadStock = useCallback(async (isMounted = true) => {
    setIsLoading(true);
    setError(null);
    try {
      // GET /api/branch-stock
      // Returns array of:
      //   { stock_id, branch_id, item_id, quantity, reorder_threshold,
      //     branches: { branch_name },
      //     items:    { item_name, sku } }
      // Server already filters to req.user.branch_id for non-admin roles — we trust that.
      const data = await apiClient.get("/branch-stock");
      if (isMounted) setStockRows(data);
    } catch (err) {
      if (isMounted) setError(err.message);
    } finally {
      if (isMounted) setIsLoading(false);
    }
  }, []);

  const loadBranches = useCallback(async () => {
    try {
      const data = await apiClient.get("/branches");
      setBranches(data);
    } catch (err) {
      console.error("Failed to load branches:", err.message);
    }
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const data = await apiClient.get("/items");
      setItems(data);
    } catch (err) {
      console.error("Failed to load items:", err.message);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadStock(isMounted);
    return () => { isMounted = false; };
  }, [loadStock]);

  useEffect(() => {
    if (canModify) {
      loadBranches();
      loadItems();
    }
  }, [canModify, loadBranches, loadItems]);

  // Build unique branch list from results for the admin dropdown
  const branchOptions = isAdmin
    ? [
        ...new Map(
          stockRows.map((r) => [r.branch_id, r.branches?.branch_name]),
        ).entries(),
      ]
    : [];

  // Apply client-side branch filter (admin only — non-admins already get scoped data from server)
  const visibleRows =
    isAdmin && selectedBranch !== "all"
      ? stockRows.filter((r) => String(r.branch_id) === selectedBranch)
      : stockRows;

  // Open modal in CREATE mode
  const openModal = () => {
    setEditingStock(null);
    setSelectedBranchId(isAdmin ? "" : String(user.branch_id));
    setSelectedItemId("");
    setQuantity("");
    setReorderThreshold("");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal in EDIT mode
  const openEditModal = (stock) => {
    setEditingStock(stock);
    setSelectedBranchId(String(stock.branch_id));
    setSelectedItemId(String(stock.item_id));
    setQuantity(String(stock.quantity));
    setReorderThreshold(String(stock.reorder_threshold));
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedItemId) {
      setFormError("Please select an item.");
      return;
    }
    if (!selectedBranchId && isAdmin) {
      setFormError("Please select a branch.");
      return;
    }
    const qty = Number(quantity);
    const threshold = Number(reorderThreshold);
    if (quantity === "" || isNaN(qty) || qty < 0) {
      setFormError("Quantity must be 0 or greater.");
      return;
    }
    if (reorderThreshold === "" || isNaN(threshold) || threshold < 0) {
      setFormError("Reorder threshold must be 0 or greater.");
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      const branchId = isAdmin ? Number(selectedBranchId) : user.branch_id;

      if (editingStock) {
        // PUT /api/branch-stock/:branch_id/:item_id
        await apiClient.put(`/branch-stock/${branchId}/${selectedItemId}`, {
          quantity: qty,
          reorder_threshold: threshold,
        });
      } else {
        // POST /api/branch-stock
        await apiClient.post("/branch-stock", {
          branch_id: branchId,
          item_id: Number(selectedItemId),
          quantity: qty,
          reorder_threshold: threshold,
        });
      }

      setIsModalOpen(false);
      await loadStock(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (branchId, itemId) => {
    if (!window.confirm("Are you sure you want to delete this stock record?")) return;
    try {
      await apiClient.delete(`/branch-stock/${branchId}/${itemId}`);
      await loadStock(true);
    } catch (err) {
      alert(`Failed to delete stock record: ${err.message}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Branch Stock Tracking"
        description={
          isAdmin
            ? "Viewing live stock levels across all branches. PostgreSQL trigger auto-creates a restock request when quantity falls below reorder_threshold."
            : `Live stock levels for your branch. A restock request is created automatically when stock drops below threshold.`
        }
        badge={
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isAdmin
                ? "bg-purple-100 text-purple-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {isAdmin ? "Multi-Branch Admin View" : "Branch-Scoped View"}
          </span>
        }
        action={
          canModify && (
            <Button variant="primary" icon={Plus} onClick={openModal}>
              Assign Stock to Branch
            </Button>
          )
        }
      />

      <Card>
        {/* Branch filter dropdown — built from real API data, only shown to admin */}
        {isAdmin && !isLoading && !error && branchOptions.length > 0 && (
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase">
              Filter Branch:
            </span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="all">All Branches (Consolidated View)</option>
              {branchOptions.map(([branchId, branchName]) => (
                <option key={branchId} value={String(branchId)}>
                  {branchName ?? `Branch #${branchId}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {isLoading && (
          <div className="py-10 text-center text-sm text-slate-500">
            Loading stock levels…
          </div>
        )}

        {!isLoading && error && (
          <div className="py-10 text-center text-sm text-rose-600">
            Failed to load stock: {error}
          </div>
        )}

        {!isLoading && !error && visibleRows.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">
            No stock records found for this view.
          </div>
        )}

        {!isLoading && !error && visibleRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                  {/* Branch column only visible to admin — non-admins already know their branch */}
                  {isAdmin && <th className="py-3 px-3">Branch</th>}
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3 text-right">Current Qty</th>
                  <th className="py-3 px-3 text-right">Reorder Threshold</th>
                  <th className="py-3 px-3">Stock Health</th>
                  {canModify && <th className="py-3 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visibleRows.map((row) => {
                  // quantity and reorder_threshold come back as numbers from Prisma
                  const isBelowThreshold = row.quantity < row.reorder_threshold;

                  return (
                    <tr
                      key={row.stock_id}
                      className={isBelowThreshold ? "bg-rose-50/40" : undefined}
                    >
                      {isAdmin && (
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {/* branches is the included relation — branch_name is the field */}
                          {row.branches?.branch_name ??
                            `Branch #${row.branch_id}`}
                        </td>
                      )}
                      <td className="py-3 px-3 font-medium">
                        {/* items is the included relation */}
                        {row.items?.item_name ?? `Item #${row.item_id}`}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-bold ${
                          isBelowThreshold ? "text-rose-600" : "text-slate-900"
                        }`}
                      >
                        {row.quantity} units
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        {row.reorder_threshold} units
                      </td>
                      <td className="py-3 px-3">
                        {isBelowThreshold ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            Below Threshold — Auto-Restocking
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Adequate
                          </span>
                        )}
                      </td>
                      {canModify && (
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(row)}
                            className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                            title="Edit quantity and threshold"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(row.branch_id, row.item_id)}
                              className="text-xs font-semibold text-rose-600 hover:underline inline-flex items-center gap-1"
                              title="Delete this stock record"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Add / Edit Stock Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingStock ? "Edit Branch Stock" : "Assign Stock to Branch"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          {/* Branch selector — only shown to admin in create mode */}
          {isAdmin && !editingStock && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select a branch...</option>
                {branches.map((branch) => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Item selector — disabled in edit mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              disabled={!!editingStock}
            >
              <option value="">Select an item...</option>
              {items.map((item) => (
                <option key={item.item_id} value={item.item_id}>
                  {item.item_name} ({item.category})
                </option>
              ))}
            </select>
            {editingStock && (
              <p className="mt-1 text-xs text-slate-500">
                Item cannot be changed when editing. Delete and create a new record if needed.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reorder Threshold <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={reorderThreshold}
                onChange={(e) => setReorderThreshold(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <strong>Note:</strong> When quantity falls below the reorder threshold, a PostgreSQL trigger automatically creates a restock request.
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
              {isSaving ? "Saving…" : editingStock ? "Save Changes" : "Assign Stock"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BranchStock;
