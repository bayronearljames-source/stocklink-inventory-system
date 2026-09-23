import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Package, Plus, Search, Filter } from 'lucide-react';

export const ItemCatalog = () => {
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
              placeholder="Search by SKU, item name, or category..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <Button variant="secondary" icon={Filter} size="sm">
            Filter Category
          </Button>
        </div>

        {/* Master Catalog Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Item Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Central Stock</th>
                <th className="py-3 px-3 text-right">Base Cost</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-3 font-mono text-xs font-bold text-slate-900">TL-DRL-001</td>
                <td className="py-3 px-3 font-medium">Bosch Hammer Drill 13mm 650W</td>
                <td className="py-3 px-3">Power Tools</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">120 units</td>
                <td className="py-3 px-3 text-right font-mono">₱3,450.00</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </td>
                <td className="py-3 px-3 text-right space-x-2">
                  <button className="text-xs font-semibold text-blue-600 hover:underline">Edit</button>
                  <button className="text-xs font-semibold text-rose-600 hover:underline">Deactivate</button>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono text-xs font-bold text-slate-900">TL-TAP-002</td>
                <td className="py-3 px-3 font-medium">Stanley PowerLock Tape Measure 8m</td>
                <td className="py-3 px-3">Hand Tools</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">450 units</td>
                <td className="py-3 px-3 text-right font-mono">₱420.00</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </td>
                <td className="py-3 px-3 text-right space-x-2">
                  <button className="text-xs font-semibold text-blue-600 hover:underline">Edit</button>
                  <button className="text-xs font-semibold text-rose-600 hover:underline">Deactivate</button>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono text-xs font-bold text-slate-900">TL-GRN-003</td>
                <td className="py-3 px-3 font-medium">Makita Angle Grinder 4" 840W</td>
                <td className="py-3 px-3">Power Tools</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">85 units</td>
                <td className="py-3 px-3 text-right font-mono">₱2,890.00</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </td>
                <td className="py-3 px-3 text-right space-x-2">
                  <button className="text-xs font-semibold text-blue-600 hover:underline">Edit</button>
                  <button className="text-xs font-semibold text-rose-600 hover:underline">Deactivate</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ItemCatalog;
