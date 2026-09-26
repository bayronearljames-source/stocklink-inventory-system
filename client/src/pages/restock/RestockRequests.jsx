import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/constants";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { apiClient } from "../../api/client";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Zap,
  Loader2,
} from "lucide-react";

// Real status values from the DB: 'pending', 'fulfilled', 'rejected'
// There is no 'approved' / 'in_transit' intermediate state — removed that tab.
const TABS = [
  {
    key: "pending",
    label: "Pending Review",
    activeClass: "bg-amber-100 text-amber-900",
  },
  {
    key: "fulfilled",
    label: "Fulfilled History",
    activeClass: "bg-emerald-100 text-emerald-900",
  },
  {
    key: "rejected",
    label: "Rejected",
    activeClass: "bg-rose-100 text-rose-900",
  },
];

const STATUS_BADGE = {
  pending:
    "px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800",
  fulfilled:
    "px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800",
  rejected:
    "px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800",
};

export const RestockRequests = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  // Per-row action states so buttons disable only the row being acted on
  const [rejectingId, setRejectingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // GET /api/restock-requests
      // Returns array of:
      //   { request_id, branch_id, item_id, requested_qty, status,
      //     requested_at, approved_by,
      //     branches: { branch_name },
      //     items:    { item_name } }
      // Server scopes non-admins to their own branch_id automatically via JWT.
      const data = await apiClient.get("/restock-requests");
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // POST /api/restock-requests/:id/reject — no extra body params needed
  const handleReject = async (requestId) => {
    setRejectingId(requestId);
    setActionError(null);
    setActionSuccess("");
    try {
      await apiClient.post(`/restock-requests/${requestId}/reject`, {});
      setActionSuccess(`Request #${requestId} rejected.`);
      // Refresh so the row moves to the Rejected tab
      await loadRequests();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setRejectingId(null);
    }
  };

  // Filter to the active tab
  const visibleRows = requests.filter((r) => r.status === activeTab);

  // Dynamic tab counts from real data
  const countFor = (key) => requests.filter((r) => r.status === key).length;

  return (
    <div>
      <PageHeader
        title="Restock Requests Queue"
        description="Database-trigger-generated restock requests. Admin can reject here; fulfillment via sp_fulfill_restock_request requires a warehouse_id lookup endpoint (pending backend)."
        badge={
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isAdmin
                ? "bg-purple-100 text-purple-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {isAdmin ? "Admin Approval Queue" : "Branch Restock Status"}
          </span>
        }
      />

      {/* Feedback banners */}
      {actionSuccess && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Fulfill notice — honest about what's not wired yet */}
      {isAdmin && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <strong>Approve &amp; Fulfill</strong> calls{" "}
          <code>sp_fulfill_restock_request()</code> and requires a{" "}
          <code>warehouse_id</code> — no <code>/api/warehouses</code> list route
          exists yet. Reject is fully wired. Fulfill button is placeholder until
          Bayron exposes that route.
        </div>
      )}

      <Card>
        {/* Tabs — built from TABS constant, counts from real data */}
        <div className="flex gap-2 border-b border-slate-100 pb-3 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === tab.key
                  ? tab.activeClass
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {tab.label}
              {!isLoading && (
                <span className="ml-1.5 opacity-70">({countFor(tab.key)})</span>
              )}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="py-10 text-center text-sm text-slate-500">
            Loading requests…
          </div>
        )}

        {!isLoading && error && (
          <div className="py-10 text-center text-sm text-rose-600">
            Failed to load requests: {error}
          </div>
        )}

        {!isLoading && !error && visibleRows.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">
            No {activeTab} requests.
          </div>
        )}

        {!isLoading && !error && visibleRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-3">Request ID</th>
                  {/* Branch column — admin sees all; branch staff only see their own so it's redundant */}
                  {isAdmin && <th className="py-3 px-3">Target Branch</th>}
                  <th className="py-3 px-3">Item</th>
                  <th className="py-3 px-3 text-right">Requested Qty</th>
                  <th className="py-3 px-3">Requested At</th>
                  <th className="py-3 px-3">Status</th>
                  {/* Action column only visible to admin, only on pending tab */}
                  {isAdmin && activeTab === "pending" && (
                    <th className="py-3 px-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visibleRows.map((req) => (
                  <tr key={req.request_id}>
                    {/* request_id is the real PK from Prisma */}
                    <td className="py-3 px-3 font-mono text-xs font-bold text-purple-700">
                      #{req.request_id}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {/* branches is the Prisma include — branch_name is the field */}
                        {req.branches?.branch_name ??
                          `Branch #${req.branch_id}`}
                      </td>
                    )}
                    <td className="py-3 px-3">
                      {/* items is the Prisma include — item_name is the field */}
                      {req.items?.item_name ?? `Item #${req.item_id}`}
                    </td>
                    {/* requested_qty is the real column name, not "quantity" */}
                    <td className="py-3 px-3 text-right font-bold text-rose-600">
                      {req.requested_qty} units
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500">
                      {/* requested_at is the Prisma timestamp field */}
                      {new Date(req.requested_at).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={
                          STATUS_BADGE[req.status] ?? STATUS_BADGE.pending
                        }
                      >
                        {req.status.charAt(0).toUpperCase() +
                          req.status.slice(1)}
                      </span>
                    </td>
                    {isAdmin && activeTab === "pending" && (
                      <td className="py-3 px-3 text-right space-x-2">
                        {/* Fulfill — placeholder, warehouse_id lookup not yet available */}
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Zap}
                          disabled
                          title="Requires /api/warehouses endpoint — pending backend"
                        >
                          Fulfill (sp_fulfill)
                        </Button>
                        {/* Reject — fully wired to POST /api/restock-requests/:id/reject */}
                        <Button
                          variant="danger"
                          size="sm"
                          icon={
                            rejectingId === req.request_id ? Loader2 : XCircle
                          }
                          disabled={rejectingId === req.request_id}
                          onClick={() => handleReject(req.request_id)}
                        >
                          {rejectingId === req.request_id
                            ? "Rejecting…"
                            : "Reject"}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RestockRequests;
