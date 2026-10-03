import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { apiClient } from '../../api/client';
import { ArrowLeftRight, Plus, ShoppingCart, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const StockMovements = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const canRecordMovement = [ROLES.CLERK, ROLES.BRANCH_MANAGER, ROLES.ADMIN].includes(user?.role);

  const [movements, setMovements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState([]);

  // Form fields
  const [selectedItemId, setSelectedItemId] = useState("");
  const [movementType, setMovementType] = useState("sale");
  const [quantity, setQuantity] = useState("");

  // Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadMovements = useCallback(async (isMounted = true) => {
    setIsLoading(true);
    setError(null);
    try {
      // GET /api/stock-movements
      // Returns array of:
      //   { movement_id, branch_id, item_id, moved_by, movement_type, quantity, moved_at,
      //     branches: { branch_name },
      //     items: { item_name },
      //     users: { username } }
      // Server filters non-admins to their own branch_id
      const data = await apiClient.get("/stock-movements");
      if (isMounted) setMovements(data);
    } catch (err) {
      if (isMounted) setError(err.message);
    } finally {
      if (isMounted) setIsLoading(false);
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
    loadMovements(isMounted);
    return () => { isMounted = false; };
  }, [loadMovements]);

  useEffect(() => {
    if (canRecordMovement) {
      loadItems();
    }
  }, [canRecordMovement, loadItems]);

  const openModal = () => {
    setSelectedItemId("");
    setMovementType("sale");
    setQuantity("");
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
    const qty = Number(quantity);
    if (quantity === "" || isNaN(qty) || qty <= 0) {
      setFormError("Quantity must be a positive number.");
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      // POST /api/stock-movements
      // Decrements branch_stock.quantity and fires both triggers:
      // 1. trg_branch_stock_low → auto-creates restock_request if qty < threshold
      // 2. trg_audit_branch_stock → logs the change to audit_logs
      await apiClient.post("/stock-movements", {
        item_id: Number(selectedItemId),
        movement_type: movementType,
        quantity: qty,
      });

      setIsModalOpen(false);
      await loadMovements(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getMovementTypeDisplay = (type) => {
    switch (type) {
      case 'sale':
        return {
          label: 'SALE',
          icon: <ArrowDownRight className="w-3 h-3" />,
          className: 'bg-rose-100 text-rose-800',
        };
      case 'withdrawal':
        return {
          label: 'WITHDRAWAL',
          icon: <ArrowDownRight className="w-3 h-3" />,
          className: 'bg-orange-100 text-orange-800',
        };
      case 'adjustment':
        return {
          label: 'ADJUSTMENT',
          icon: <ArrowLeftRight className="w-3 h-3" />,
          className: 'bg-blue-100 text-blue-800',
        };
      default:
        return {
          label: type.toUpperCase(),
          icon: <ArrowLeftRight className="w-3 h-3" />,
          className: 'bg-slate-100 text-slate-800',
        };
    }
  };

  return (
    <div>
      <PageHeader
        title="Branch Stock Movements (stock_movements)"
        description="Records of sales, store withdrawals, and restock receipts. Every decrement evaluates the low-stock trigger."
        badge={
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              user?.role === ROLES.CLERK ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {user?.role === ROLES.CLERK ? 'Clerk Operational Log' : 'Manager Audit View'}
          </span>
        }
        action={
          canRecordMovement && (
            <Button variant="primary" icon={Plus} onClick={openModal}>
              Record Stock Movement
            </Button>
          )
        }
      />

      <Card
        title="Movement Transaction History"
        subtitle={isAdmin ? "All branches consolidated view" : `Live branch ledger for your branch`}
      >
        {isLoading && (
          <div className="py-10 text-center text-sm text-slate-500">
            Loading movements…
          </div>
        )}

        {!isLoading && error && (
          <div className="py-10 text-center text-sm text-rose-600">
            Failed to load movements: {error}
          </div>
        )}

        {!isLoading && !error && movements.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">
            No stock movements recorded yet.
          </div>
        )}

        {!isLoading && !error && movements.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-3">Movement ID</th>
                  <th className="py-3 px-3">Timestamp</th>
                  {isAdmin && <th className="py-3 px-3">Branch</th>}
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3">Movement Type</th>
                  <th className="py-3 px-3 text-right">Quantity Change</th>
                  <th className="py-3 px-3">Moved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {movements.map((movement) => {
                  const typeDisplay = getMovementTypeDisplay(movement.movement_type);
                  return (
                    <tr key={movement.movement_id}>
                      <td className="py-3 px-3 font-mono text-xs text-purple-700 font-bold">
                        #{movement.movement_id}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500">
                        {new Date(movement.moved_at).toLocaleString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {movement.branches?.branch_name ?? `Branch #${movement.branch_id}`}
                        </td>
                      )}
                      <td className="py-3 px-3 font-medium">
                        {movement.items?.item_name ?? `Item #${movement.item_id}`}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${typeDisplay.className}`}>
                          {typeDisplay.icon} {typeDisplay.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600">
                        -{movement.quantity} units
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {movement.users?.username ?? `User #${movement.moved_by}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Record Stock Movement Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Record Stock Movement"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">Select an item...</option>
              {items.map((item) => (
                <option key={item.item_id} value={item.item_id}>
                  {item.item_name} ({item.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Movement Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="sale">Sale (customer purchase)</option>
              <option value="withdrawal">Withdrawal (store use, damage, etc.)</option>
              <option value="adjustment">Adjustment (inventory correction)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <strong>Note:</strong> This action decrements branch stock and fires PostgreSQL triggers:
            <ul className="mt-1 ml-4 list-disc">
              <li>Low-stock trigger → auto-creates restock request if below threshold</li>
              <li>Audit trigger → logs the change to audit_logs table</li>
            </ul>
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
              {isSaving ? "Recording…" : "Record Movement"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StockMovements;
