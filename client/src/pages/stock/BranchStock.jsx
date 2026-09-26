import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/constants";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import { apiClient } from "../../api/client";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const BranchStock = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [stockRows, setStockRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin-only client-side branch filter — server already scopes non-admins to their own branch_id
  const [selectedBranch, setSelectedBranch] = useState("all");

  useEffect(() => {
    let isMounted = true;

    async function loadStock() {
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
    }

    loadStock();
    return () => {
      isMounted = false;
    };
  }, []);

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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BranchStock;
