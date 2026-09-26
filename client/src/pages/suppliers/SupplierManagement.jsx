import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { apiClient } from "../../api/client";
import { Truck, Plus, Mail, Phone } from "lucide-react";

export const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSuppliers() {
      setIsLoading(true);
      setError(null);
      try {
        // GET /api/suppliers — returns { supplier_id, supplier_name, contact_info }
        // NOTE: No /api/supplier-items route exists yet. The junction table data
        // (unit_cost, lead_time_days, min_order_qty per item) requires a new backend
        // endpoint — flagged for Bayron to add. This page shows supplier master records only.
        const data = await apiClient.get("/suppliers");
        if (isMounted) setSuppliers(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSuppliers();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Supplier Directory"
        description="Vendor master records. Per-item pricing and lead times (supplier_items junction) require a separate backend endpoint — pending Bayron."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Admin Only
          </span>
        }
        action={
          // POST /api/suppliers needs supplier_name, contact_info — form wiring deferred
          <Button
            variant="primary"
            icon={Plus}
            disabled
            title="Add supplier form — coming soon"
          >
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
        <>
          {/* Scope notice — honest about what the table can and can't show */}
          <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <strong>Note:</strong> Showing supplier master records only.
            Per-item cost, lead time, and minimum order quantity live in the{" "}
            <code>supplier_items</code> junction table — a{" "}
            <code>/api/supplier-items</code> route is needed from the backend
            team to display those columns here.
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                    <th className="py-3 px-3">Supplier ID</th>
                    <th className="py-3 px-3">Supplier Name</th>
                    <th className="py-3 px-3">Contact Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.supplier_id}>
                      {/* supplier_id is the real PK field name from Prisma */}
                      <td className="py-3 px-3 font-mono text-xs text-purple-700 font-bold">
                        #{supplier.supplier_id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                        {supplier.supplier_name}
                      </td>
                      {/* contact_info is a single text field — may contain email, phone, or both */}
                      <td className="py-3 px-3 text-xs text-slate-500">
                        {supplier.contact_info || (
                          <span className="italic text-slate-400">
                            No contact on file
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default SupplierManagement;
