import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { apiClient } from "../../api/client";
import {
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// ─── Clerk Dashboard ──────────────────────────────────────────────────────────
// Layout: Form-first (2/3 width) + sidebar (permissions + recent movements)
// No KPI row — clerks don't need system-wide numbers, they need to act fast.
// Distinct from Admin (KPI-heavy, read-only overview) and Manager (stock monitoring)

// Valid movement types the backend accepts — see index.js validation
const MOVEMENT_TYPES = [
  { value: "sale", label: "Customer Sale" },
  { value: "withdrawal", label: "Store Withdrawal / Damaged" },
  { value: "adjustment", label: "Stock Adjustment" },
];

export const ClerkDashboard = () => {
  const { user } = useAuth();

  // Stock items for the item selector dropdown — loaded from real API
  const [stockRows, setStockRows] = useState([]);
  const [stockLoading, setStockLoading] = useState(true);

  // Recent movements for the sidebar — loaded from real API
  const [recentMovements, setRecentMovements] = useState([]);

  // Form state
  const [selectedStockId, setSelectedStockId] = useState("");
  const [movementType, setMovementType] = useState("sale");
  const [quantity, setQuantity] = useState(1);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Load branch stock (for the item dropdown) and recent movements in parallel
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setStockLoading(true);
      const [stockRes, movementsRes] = await Promise.allSettled([
        apiClient.get("/branch-stock"),
        apiClient.get("/stock-movements"),
      ]);
      if (!isMounted) return;

      if (stockRes.status === "fulfilled") setStockRows(stockRes.value);
      if (movementsRes.status === "fulfilled") {
        // Show only the 3 most recent — already ordered by moved_at desc from backend
        setRecentMovements(movementsRes.value.slice(0, 3));
      }
      setStockLoading(false);
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // The selected stock row — used to read item_id for the POST body
  const selectedRow = stockRows.find(
    (r) => String(r.stock_id) === selectedStockId,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRow) return;

    setSubmitError("");
    setSubmitSuccess("");
    setIsSubmitting(true);

    try {
      // POST /api/stock-movements
      // Body: { item_id, movement_type, quantity }
      // branch_id is taken from the JWT server-side — we don't send it.
      // This UPDATE to branch_stock fires both PostgreSQL triggers:
      //   1. trg_branch_stock_low  → auto-inserts a restock_request if qty < threshold
      //   2. trg_audit_branch_stock → writes a before/after snapshot to audit_logs
      await apiClient.post("/stock-movements", {
        item_id: selectedRow.item_id,
        movement_type: movementType,
        quantity: Number(quantity),
      });

      const itemName =
        selectedRow.items?.item_name ?? `Item #${selectedRow.item_id}`;
      setSubmitSuccess(
        `Logged: ${movementType} of ${quantity} unit(s) of "${itemName}". DB trigger evaluated branch stock.`,
      );

      // Reset form
      setSelectedStockId("");
      setMovementType("sale");
      setQuantity(1);

      // Refresh both stock and movements so the sidebar shows the new entry
      const [stockRes, movementsRes] = await Promise.allSettled([
        apiClient.get("/branch-stock"),
        apiClient.get("/stock-movements"),
      ]);
      if (stockRes.status === "fulfilled") setStockRows(stockRes.value);
      if (movementsRes.status === "fulfilled")
        setRecentMovements(movementsRes.value.slice(0, 3));
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Branch Staff / Clerk Workspace"
        description="Log day-to-day stock sales and withdrawals. Decrementing stock automatically fires the low-stock database trigger."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Branch Clerk
          </span>
        }
      />

      {/* ── Form-first layout: big form takes 2/3, sidebar takes 1/3 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Action Form — the primary thing a clerk does */}
        <div className="lg:col-span-2">
          <Card
            title="Log Stock Movement"
            subtitle="Any quantity decrement below the reorder threshold immediately creates a restock request via DB trigger"
          >
            {/* Feedback banners */}
            {submitSuccess && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                {submitSuccess}
              </div>
            )}
            {submitError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Item selector — built from real branch-stock data */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Item (branch inventory)
                </label>
                {stockLoading ? (
                  <div className="text-xs text-slate-400 py-2">
                    Loading items…
                  </div>
                ) : (
                  <select
                    value={selectedStockId}
                    onChange={(e) => setSelectedStockId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">— Choose an item —</option>
                    {stockRows.map((row) => {
                      const isBelowThreshold =
                        row.quantity < row.reorder_threshold;
                      return (
                        <option key={row.stock_id} value={String(row.stock_id)}>
                          {row.items?.item_name ?? `Item #${row.item_id}`} (Qty:{" "}
                          {row.quantity}, Threshold: {row.reorder_threshold})
                          {isBelowThreshold ? " ⚠ LOW" : ""}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Movement type — values match backend VALID_TYPES: sale/withdrawal/adjustment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Movement Type
                  </label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {MOVEMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity — must be a positive integer (backend validates) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  icon={isSubmitting ? Loader2 : ShoppingCart}
                  disabled={isSubmitting || !selectedStockId}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting
                    ? "Submitting…"
                    : "Submit Movement & Decrement Stock"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar — scope reminder + recent movements from real API */}
        <div className="space-y-6">
          <Card title="Clerk Permissions" subtitle="What you can and cannot do">
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Log stock movements (sale, withdrawal, adjustment) for your
                  branch.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  View branch stock levels and restock request status.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  Cannot view other branches' inventory or central stock.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  Cannot approve, reject, or fulfill restock requests (Admin
                  only).
                </span>
              </div>
            </div>
          </Card>

          {/* Recent Movements — live from /api/stock-movements */}
          <Card
            title="Recent Movements"
            subtitle="Last 3 logged by your branch"
          >
            {recentMovements.length === 0 ? (
              <div className="text-xs text-slate-400 italic">
                No movements logged yet.
              </div>
            ) : (
              <div className="space-y-2">
                {recentMovements.map((mv) => (
                  <div
                    key={mv.movement_id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="font-semibold text-slate-800">
                      {mv.items?.item_name ?? `Item #${mv.item_id}`}
                    </div>
                    <div className="text-slate-500 flex justify-between mt-1">
                      <span className="capitalize">
                        {mv.movement_type} (−{mv.quantity})
                      </span>
                      <span className="font-mono">
                        {new Date(mv.moved_at).toLocaleTimeString("en-PH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClerkDashboard;
