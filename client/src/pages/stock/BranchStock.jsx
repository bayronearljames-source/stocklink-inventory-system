import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Boxes, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const BranchStock = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const [selectedBranch, setSelectedBranch] = useState(isAdmin ? 'all' : 'BR-01');

  return (
    <div>
      <PageHeader
        title="Branch Stock Tracking (branch_stock)"
        description={
          isAdmin
            ? 'Viewing stock levels across all branches. Trigger will auto-create restock request if quantity < threshold.'
            : `Stock levels for ${user?.branchName || 'your branch'}. When stock is low, restock request is generated automatically.`
        }
        badge={
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {isAdmin ? 'Multi-Branch Admin View' : 'Branch-Scoped View'}
          </span>
        }
      />

      <Card>
        {/* Branch Filter for Admin */}
        {isAdmin && (
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase">Filter Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="all">All Branches (Consolidated View)</option>
              <option value="BR-01">Quezon City Branch #1</option>
              <option value="BR-02">Makati Branch #2</option>
              <option value="BR-03">Cebu Central Branch</option>
            </select>
          </div>
        )}

        {/* Stock Level Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                {isAdmin && <th className="py-3 px-3">Branch</th>}
                <th className="py-3 px-3">Item Name</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 text-right">Current Qty</th>
                <th className="py-3 px-3 text-right">Reorder Threshold</th>
                <th className="py-3 px-3">Stock Health</th>
                <th className="py-3 px-3">Last Restocked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="bg-rose-50/40">
                {isAdmin && <td className="py-3 px-3 font-semibold text-slate-900">Quezon City #1</td>}
                <td className="py-3 px-3 font-medium">Bosch Hammer Drill 13mm</td>
                <td className="py-3 px-3 font-mono text-xs text-slate-500">TL-DRL-001</td>
                <td className="py-3 px-3 text-right font-bold text-rose-600">2 units</td>
                <td className="py-3 px-3 text-right font-medium text-slate-600">5 units</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    <AlertTriangle className="w-3 h-3" /> Below Threshold (Auto-Restocking)
                  </span>
                </td>
                <td className="py-3 px-3 text-xs text-slate-500">2024-09-15</td>
              </tr>
              <tr>
                {isAdmin && <td className="py-3 px-3 font-semibold text-slate-900">Quezon City #1</td>}
                <td className="py-3 px-3 font-medium">Stanley Measuring Tape 8m</td>
                <td className="py-3 px-3 font-mono text-xs text-slate-500">TL-TAP-002</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">18 units</td>
                <td className="py-3 px-3 text-right font-medium text-slate-600">10 units</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> Adequate
                  </span>
                </td>
                <td className="py-3 px-3 text-xs text-slate-500">2024-09-18</td>
              </tr>
              <tr>
                {isAdmin && <td className="py-3 px-3 font-semibold text-slate-900">Makati #2</td>}
                <td className="py-3 px-3 font-medium">Makita Angle Grinder 4"</td>
                <td className="py-3 px-3 font-mono text-xs text-slate-500">TL-GRN-003</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">12 units</td>
                <td className="py-3 px-3 text-right font-medium text-slate-600">6 units</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> Adequate
                  </span>
                </td>
                <td className="py-3 px-3 text-xs text-slate-500">2024-09-10</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default BranchStock;
