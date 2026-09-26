import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import { apiClient } from "../../api/client";
import {
  Package,
  Boxes,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
// Layout: Full-width KPI row (4 cards) → 2-col grid (restock queue + DB layer panel)
// Distinct from Manager (3-col KPIs, no approval queue) and Clerk (form-first layout)

export const AdminDashboard = () => {
  const { user } = useAuth();

  // Live KPI data — pulled from the same endpoints the other pages use
  const [itemCount, setItemCount] = useState(null);
  const [pendingCount, setPendingCount] = useState(null);
  const [branchCount, setBranchCount] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        // Fire all 3 fetches in parallel — Promise.allSettled so one failure
        // doesn't blank the whole dashboard.
        const [itemsRes, requestsRes, branchesRes] = await Promise.allSettled([
          apiClient.get("/items"),
          apiClient.get("/restock-requests"),
          apiClient.get("/branches"),
        ]);

        if (!isMounted) return;

        if (itemsRes.status === "fulfilled") {
          setItemCount(itemsRes.value.length);
        }
        if (requestsRes.status === "fulfilled") {
          const allRequests = requestsRes.value;
          // Count only pending ones for the KPI badge
          setPendingCount(
            allRequests.filter((r) => r.status === "pending").length,
          );
          // Show the 3 most recent pending requests in the approval queue widget
          setPendingRequests(
            allRequests.filter((r) => r.status === "pending").slice(0, 3),
          );
        }
        if (branchesRes.status === "fulfilled") {
          setBranchCount(branchesRes.value.length);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper: show a dash while loading, real number when ready
  const kpi = (val) => (isLoading ? "—" : (val ?? "?"));

  return (
    <div>
      <PageHeader
        title="Central Warehouse Administration"
        description="Full system visibility — master item catalog, restock approval queue, and audit logs."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            HQ Central Admin
          </span>
        }
      />

      {/* ── KPI Row: 4 cards across full width ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Master Catalog Items
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {kpi(itemCount)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Across all categories
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Restocks
              </p>
              {/* Amber text when there are pending items, slate when zero */}
              <h3
                className={`text-2xl font-bold mt-1 ${pendingCount > 0 ? "text-amber-600" : "text-slate-900"}`}
              >
                {kpi(pendingCount)}
              </h3>
              <p className="text-[11px] text-amber-700 font-medium mt-1">
                Awaiting admin approval
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Branches
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {kpi(branchCount)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Registered in system
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                DB Automation
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                Active
              </h3>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                Triggers &amp; stored procs live
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Main Grid: 2/3 restock queue + 1/3 DB feature panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approval Queue — live data */}
        <div className="lg:col-span-2">
          <Card
            title="Pending Restock Requests"
            subtitle="Auto-generated by PostgreSQL trigger when branch_stock drops below reorder_threshold"
            action={
              <Link
                to="/restock-requests"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                Full Queue <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {isLoading && (
              <div className="py-6 text-center text-sm text-slate-400">
                Loading…
              </div>
            )}
            {!isLoading && pendingRequests.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-500">
                No pending restock requests. All branches are stocked.
              </div>
            )}
            {!isLoading && pendingRequests.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                      <th className="pb-3">ID</th>
                      <th className="pb-3">Branch</th>
                      <th className="pb-3">Item</th>
                      <th className="pb-3">Qty</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {pendingRequests.map((req) => (
                      <tr key={req.request_id}>
                        <td className="py-3 font-mono text-xs font-bold text-purple-700">
                          #{req.request_id}
                        </td>
                        <td className="py-3 font-medium">
                          {req.branches?.branch_name ??
                            `Branch #${req.branch_id}`}
                        </td>
                        <td className="py-3 text-slate-600">
                          {req.items?.item_name ?? `Item #${req.item_id}`}
                        </td>
                        <td className="py-3 font-semibold text-rose-600">
                          {req.requested_qty} units
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to="/restock-requests"
                            className="text-xs font-bold text-emerald-600 hover:underline"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* DB Architecture Highlight — static, for defense context */}
        <div>
          <Card
            title="Database Layer"
            subtitle="Core PostgreSQL automation components"
          >
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Trigger: Auto Restock
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  <code>AFTER UPDATE ON branch_stock</code> — inserts into{" "}
                  <code>restock_requests</code> when qty &lt; threshold.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Zap className="w-4 h-4 text-purple-600" />
                  Stored Proc: Fulfillment
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  <code>sp_fulfill_restock_request()</code> — deducts central
                  stock, increments branch stock, single atomic transaction.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Trigger: Audit Logging
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Zero application-layer logging — DB captures who, what, when,
                  old_qty → new_qty automatically.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
