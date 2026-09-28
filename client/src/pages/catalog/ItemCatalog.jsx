import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { apiClient } from '../../api/client';
import { Package, Plus, Search, Filter } from 'lucide-react';

export const ItemCatalog = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal open/close state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Controlled form fields — one piece of state per field so the instructor
  // can follow exactly which value goes into which POST body key
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('pcs');

  // Submission state for the form
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // useCallback so loadItems can be called both on mount (via useEffect)
  // and after a successful create, without being re-created on every render
  const loadItems = useCallback(async (isMounted) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/items');
      if (isMounted) setItems(data);
    } catch (err) {
      if (isMounted) setError(err.message);
    } finally {
      if (isMounted) setIsLoading(false);
    }
  }, []); // no dependencies — apiClient is module-level, never changes

  useEffect(() => {
    let isMounted = true;
    loadItems(isMounted);
    return () => { isMounted = false; };
  }, [loadItems]);

  // Reset form fields and error back to defaults when the modal opens
  const openModal = () => {
    setItemName('');
    setCategory('');
    setUnitPrice('');
    setUnitOfMeasure('pcs');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    // Don't close while a save is in flight — prevents accidental dismissal
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation before hitting the network
    if (!itemName.trim()) {
      setFormError('Item name is required.');
      return;
    }
    if (!category.trim()) {
      setFormError('Category is required.');
      return;
    }
    const price = Number(unitPrice);
    if (unitPrice === '' || isNaN(price) || price < 0) {
      setFormError('Unit price must be a number of 0 or greater.');
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      // POST /api/items — body matches exactly what index.js destructures:
      // { item_name, category, unit_price, unit_of_measure }
      // unit_price is sent as a Number, not a string, because the DB column is decimal
      await apiClient.post('/items', {
        item_name: itemName.trim(),
        category: category.trim(),
        unit_price: price,
        unit_of_measure: unitOfMeasure.trim() || 'pcs',
      });

      // Success: close the modal, then refresh the list
      setIsModalOpen(false);
      // Pass true as isMounted — we're still mounted here
      await loadItems(true);
    } catch (err) {
      // apiClient throws Error with the backend's { error } message on non-2xx.
      // Show it inside the form — do NOT close the modal on failure.
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Master Item Catalog"
        description="Centralized master repository of all hardware tools, categories, SKUs, and central warehouse baselines."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Admin Only
          </span>
        }
        action={
          // onClick now opens the modal instead of doing nothing
          <Button variant="primary" icon={Plus} onClick={openModal}>
            Add New Master Item
          </Button>
        }
      />

      <Card>
        {/* Search & Filter Bar — unchanged */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by item name or category..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <Button variant="secondary" icon={Filter} size="sm">
            Filter Category
          </Button>
        </div>

        {isLoading && (
          <div className="py-10 text-center text-sm text-slate-500">Loading items…</div>
        )}

        {!isLoading && error && (
          <div className="py-10 text-center text-sm text-rose-600">
            Failed to load items: {error}
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">
            No items found. Add your first master item to get started.
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3 text-right">Base Price</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.map((item) => (
                  <tr key={item.item_id}>
                    <td className="py-3 px-3 font-medium">{item.item_name}</td>
                    <td className="py-3 px-3">{item.category}</td>
                    <td className="py-3 px-3">{item.unit_of_measure}</td>
                    <td className="py-3 px-3 text-right font-mono">
                      ₱{Number(item.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {/* Edit/Deactivate need PUT/DELETE routes that don't exist yet — left as-is */}
                      <button className="text-xs font-semibold text-blue-600 hover:underline">Edit</button>
                      <button className="text-xs font-semibold text-rose-600 hover:underline">Deactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Add Item Modal ── */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Add New Master Item">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Backend error banner — shown inside the form, modal stays open */}
          {formError && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Bosch Hammer Drill 13mm"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Power Tools"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Price (₱) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                placeholder="pcs"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ItemCatalog;
