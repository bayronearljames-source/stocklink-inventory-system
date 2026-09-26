import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import { apiClient } from "../../api/client";
import {
  Boxes,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";

// ─── Manager Dashboard ────────────────────────────────────────────────────────
// Layout: 3-col KPI row (branch-scoped) → side-by-side critical stock table + restock status list
// Distinct from Admin (4-col KPIs, system-wide) and Clerk (form-first, no stock overview)

export const ManagerDashboard = () => {
  const { user } = useAuth();

  const [stockRows, setStockRows] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        // Both endpoints are already server-scoped to this manager's branch_id via JWT.
        // We do NOT filter on the frontend — we trust what comes back.
        const [stockRes, requestsRes] = await Promise.allSettled([
          apiClient.get("/branch-stock"),
          apiClient.get("/restock-requests"),
        ]);

        if (!isMounted) return;

        if (stockRes.status === "fulfilled") setStockRows(stockRes.value);
        if (requestsRes.status === "fulfilled")
          setRestockRequests(requestsRes.value);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  // Derived KPIs — computed from real data
  const totalItems = stockRows.length;
  const lowStockItems = stockRows.filter(
    (r) => r.quantity < r.reorder_threshold,
  );
  const pendingRestocks = restockRequests.filter(
    (r) => r.status === "pending",
  ).length;

  const kpi = (val) => (isLoading ? "—" : val);

  return (
    <div>
      <PageHeader
        title="Branch Manager Dashboard"
        description="Live stock levels and restock status for your branch. Data is automatically scoped by the server to your assigned branch."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Branch Manager
          </span>
        }
      />

      {/* ── KPI Row: 3 cards — branch-scoped metrics only ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Branch Stock Lines
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {kpi(totalItems)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Items tracked at this branch
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Low Stock Warnings
              </p>
              <h3
                className={`text-2xl font-bold mt-1 ${lowStockItems.length > 0 ? "text-rose-600" : "text-slate-900"}`}
              >
                {kpi(lowStockItems.length)}
              </h3>
              <p className="text-[11px] text-rose-700 font-medium mt-1">
                Below reorder threshold
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Restocks
              </p>
              <h3
                className={`text-2xl font-bold mt-1 ${pendingRestocks > 0 ? "text-amber-600" : "text-slate-900"}`}
              >
                {kpi(pendingRestocks)}
              </h3>
              <p className="text-[11px] text-amber-700 font-medium mt-1">
                Awaiting admin approval
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Main Grid: Critical stock table + Restock status list ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Low Stock — items below threshold from real branch-stock data */}
        <Card
          title="Critical Low Stock Items"
          subtitle="PostgreSQL trigger auto-creates a restock request when any item drops below its threshold"
          action={
            <Link
              to="/stock"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              View All Stock <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {isLoading && (
            <div className="py-6 text-center text-sm text-slate-400">
              Loading…
            </div>
          )}
          {!isLoading && lowStockItems.length === 0 && (
            <div className="py-6 text-center text-sm text-emerald-600 font-medium">
              ✓ All items are above their reorder threshold.
            </div>
          )}
          {!isLoading && lowStockItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <th className="pb-3">Item</th>
                    <th className="pb-3 text-right">Qty</th>
                    <th className="pb-3 text-right">Threshold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {lowStockItems.map((row) => (
                    <tr key={row.stock_id} className="bg-rose-50/30">
                      <td className="py-3 font-medium">
                        {row.items?.item_name ?? `Item #${row.item_id}`}
                      </td>
                      <td className="py-3 text-right font-bold text-rose-600">
                        {row.quantity}
                      </td>
                      <td className="py-3 text-right text-slate-500">
                        {row.reorder_threshold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Restock Request Status — live status list for this branch */}
        <Card
          title="Restock Request Status"
          subtitle="Requests submitted for your branch and their current admin review status"
          action={
            <Link
              to="/restock-requests"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {isLoading && (
            <div className="py-6 text-center text-sm text-slate-400">
              Loading…
            </div>
          )}
          {!isLoading && restockRequests.length === 0 && (
            <div className="py-6 text-center text-sm text-slate-500">
              No restock requests for your branch yet.
            </div>
          )}
          {!isLoading && restockRequests.length > 0 && (
            <div className="space-y-3">
              {restockRequests.slice(0, 4).map((req) => (
                <div
                  key={req.request_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {req.items?.item_name ?? `Item #${req.item_id}`}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(req.requested_at).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {req.requested_qty} units requested
                    </div>
                  </div>
                  {/* Status badge — colour-coded to match real status values */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      req.status === "fulfilled"
                        ? "bg-emerald-100 text-emerald-800"
                        : req.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
              {restockRequests.length > 4 && (
                <Link
                  to="/restock-requests"
                  className="block text-center text-xs font-semibold text-blue-600 hover:underline pt-1"
                >
                  +{restockRequests.length - 4} more requests →
                </Link>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
