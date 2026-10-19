import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/constants";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useToast } from "../../components/common/ToastContainer";
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
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  // Per-row action states so buttons disable only the row being acted on
  const [rejectingId, setRejectingId] = useState(null);
  const [fulfillingId, setFulfillingId] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [warehouseError, setWarehouseError] = useState(null);

  // Confirmation dialog states
  const [fulfillDialog, setFulfillDialog] = useState({ isOpen: false, request: null });
  const [rejectDialog, setRejectDialog] = useState({ isOpen: false, request: null });

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
      toast.error(`Failed to load restock requests: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (!isAdmin) return;
    let isMounted = true;
    apiClient.get("/warehouses")
      .then((data) => {
        if (!isMounted) return;
        setWarehouses(data);
        setSelectedWarehouseId((current) => current || String(data[0]?.warehouse_id ?? ""));
      })
      .catch((err) => {
        if (isMounted) {
          setWarehouseError(err.message);
          toast.error(`Failed to load warehouses: ${err.message}`);
        }
      });
    return () => { isMounted = false; };
  }, [isAdmin, toast]);

  // Open confirmation dialogs
  const openFulfillDialog = (request) => {
    if (!selectedWarehouseId) {
      toast.warning("Please select a central warehouse before fulfilling a request");
      return;
    }
    setFulfillDialog({ isOpen: true, request });
  };

  const openRejectDialog = (request) => {
    setRejectDialog({ isOpen: true, request });
  };

  const closeFulfillDialog = () => {
    setFulfillDialog({ isOpen: false, request: null });
  };

  const closeRejectDialog = () => {
    setRejectDialog({ isOpen: false, request: null });
  };

  // Confirm fulfill action
  const handleFulfillConfirm = async () => {
    const { request } = fulfillDialog;
    if (!request) return;

    setFulfillingId(request.request_id);
    try {
      await apiClient.post(`/restock-requests/${request.request_id}/fulfill`, {
        warehouse_id: Number(selectedWarehouseId),
      });

      const warehouseName = warehouses.find(w => String(w.warehouse_id) === selectedWarehouseId)?.warehouse_name || "warehouse";
      toast.success(`Request #${request.request_id} fulfilled from ${warehouseName}`);

      await loadRequests();
      closeFulfillDialog();
    } catch (err) {
      toast.error(`Failed to fulfill request: ${err.message}`);
      closeFulfillDialog();
    } finally {
      setFulfillingId(null);
    }
  };

  // Confirm reject action
  const handleRejectConfirm = async () => {
    const { request } = rejectDialog;
    if (!request) return;

    setRejectingId(request.request_id);
    try {
      await apiClient.post(`/restock-requests/${request.request_id}/reject`, {});
      toast.success(`Request #${request.request_id} rejected`);

      await loadRequests();
      closeRejectDialog();
    } catch (err) {
      toast.error(`Failed to reject request: ${err.message}`);
      closeRejectDialog();
    } finally {
      setRejectingId(null);
    }
  };

  // Filter to the active tab
  const visibleRows = requests.filter((r) => r.status === activeTab);

  // Dynamic tab counts from real data
  const countFor = (key) => requests.filter((r) => r.status === key).length;

  const selectedWarehouseName = warehouses.find(
    w => String(w.warehouse_id) === selectedWarehouseId
  )?.warehouse_name || "selected warehouse";

  return (
    <div>
      <PageHeader
        title="Restock Requests Queue"
        description="Review branch restock requests. Administrators can fulfill requests from a selected central warehouse or reject them."
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

      {/* Fulfillment requires an administrator-selected source warehouse. */}
      {isAdmin && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center gap-3">
          <label htmlFor="fulfillment-warehouse" className="font-semibold">Fulfill from warehouse</label>
          <select
            id="fulfillment-warehouse"
            value={selectedWarehouseId}
            onChange={(event) => setSelectedWarehouseId(event.target.value)}
            disabled={warehouses.length === 0}
            className="max-w-md px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {!warehouses.length && <option value="">No warehouses available</option>}
            {warehouses.map((warehouse) => (
              <option key={warehouse.warehouse_id} value={String(warehouse.warehouse_id)}>
                {warehouse.warehouse_name} — {warehouse.location}
              </option>
            ))}
          </select>
          {warehouseError && <span className="text-rose-700">Could not load warehouses: {warehouseError}</span>}
          {!warehouseError && warehouses.length === 0 && (
            <span className="text-amber-800">Add a central warehouse before fulfilling requests.</span>
          )}
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

        {isLoading && <LoadingOverlay message="Loading requests…" />}

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
                        <Button
                          variant="primary"
                          size="sm"
                          icon={fulfillingId === req.request_id ? Loader2 : Zap}
                          disabled={!selectedWarehouseId || fulfillingId === req.request_id || rejectingId === req.request_id}
                          onClick={() => openFulfillDialog(req)}
                        >
                          {fulfillingId === req.request_id ? "Fulfilling…" : "Fulfill"}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={
                            rejectingId === req.request_id ? Loader2 : XCircle
                          }
                          disabled={rejectingId === req.request_id || fulfillingId === req.request_id}
                          onClick={() => openRejectDialog(req)}
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

      {/* Fulfill Confirmation Dialog */}
      <ConfirmDialog
        isOpen={fulfillDialog.isOpen}
        onClose={closeFulfillDialog}
        onConfirm={handleFulfillConfirm}
        title="Fulfill Restock Request?"
        message={`This will fulfill request #${fulfillDialog.request?.request_id} for ${fulfillDialog.request?.requested_qty} units of "${fulfillDialog.request?.items?.item_name}" to ${fulfillDialog.request?.branches?.branch_name} from ${selectedWarehouseName}.`}
        confirmText="Fulfill Request"
        cancelText="Cancel"
        variant="success"
        isLoading={fulfillingId === fulfillDialog.request?.request_id}
      />

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        isOpen={rejectDialog.isOpen}
        onClose={closeRejectDialog}
        onConfirm={handleRejectConfirm}
        title="Reject Restock Request?"
        message={`Are you sure you want to reject request #${rejectDialog.request?.request_id} for ${rejectDialog.request?.requested_qty} units of "${rejectDialog.request?.items?.item_name}"? The branch will need to submit a new request.`}
        confirmText="Reject Request"
        cancelText="Cancel"
        variant="danger"
        isLoading={rejectingId === rejectDialog.request?.request_id}
      />
    </div>
  );
};

export default RestockRequests;
