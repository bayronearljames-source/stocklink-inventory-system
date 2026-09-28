import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { apiClient } from '../../api/client';
import { Truck, Plus } from 'lucide-react';

export const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields — match exactly what POST /api/suppliers destructures:
  // { supplier_name, contact_info }
  const [supplierName, setSupplierName] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  // Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // loadSuppliers as useCallback so it can be called both on mount and after create
  const loadSuppliers = useCallback(async (isMounted) => {
    setIsLoading(true);
    setError(null);
    try {
      // GET /api/suppliers — returns { supplier_id, supplier_name, contact_info }
      const data = await apiClient.get('/suppliers');
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
    return () => { isMounted = false; };
  }, [loadSuppliers]);

  const openModal = () => {
    setSupplierName('');
    setContactInfo('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // supplier_name is the only required field — contact_info is optional
    if (!supplierName.trim()) {
      setFormError('Supplier name is required.');
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      // POST /api/suppliers — body: { supplier_name, contact_info }
      await apiClient.post('/suppliers', {
        supplier_name: supplierName.trim(),
        contact_info: contactInfo.trim() || null,
      });

      setIsModalOpen(false);
      await loadSuppliers(true);
    } catch (err) {
      // Backend { error } message shown inside the form; modal stays open
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Supplier Directory"
        description="Vendor master records. Per-item pricing and lead times (supplier_items junction) require a separate backend endpoint — pending backend team."
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
        <div className="py-16 text-center text-sm text-slate-500">Loading suppliers…</div>
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
          <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <strong>Note:</strong> Showing supplier master records only. Per-item cost, lead time, and
            minimum order quantity live in the <code>supplier_items</code> junction table — a{' '}
            <code>/api/supplier-items</code> route is needed from the backend team.
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
                      <td className="py-3 px-3 font-mono text-xs text-purple-700 font-bold">
                        #{supplier.supplier_id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                        {supplier.supplier_name}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500">
                        {supplier.contact_info || (
                          <span className="italic text-slate-400">No contact on file</span>
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

      {/* ── Add Supplier Modal ── */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Add Supplier Record">
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
              <span className="ml-1 text-slate-400 font-normal">(optional — email, phone, or both)</span>
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
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Add Supplier'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SupplierManagement;
