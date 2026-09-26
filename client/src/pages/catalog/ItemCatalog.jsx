import { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { apiClient } from '../../api/client';
import { Package, Plus, Search, Filter } from 'lucide-react';

export const ItemCatalog = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadItems() {
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
    }

    loadItems();
    return () => {
      isMounted = false;
    };
  }, []);

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
          <Button variant="primary" icon={Plus}>
            Add New Master Item
          </Button>
        }
      />

      <Card>
        {/* Search & Filter Bar */}
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
    </div>
  );
};

export default ItemCatalog;
