import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ArrowLeftRight, Plus, ShoppingCart, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const StockMovements = () => {
  const { user } = useAuth();
  const isClerk = user?.role === ROLES.CLERK;

  return (
    <div>
      <PageHeader
        title="Branch Stock Movements (stock_movements)"
        description="Records of sales, store withdrawals, and restock receipts. Every decrement evaluates the low-stock trigger."
        badge={
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isClerk ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {isClerk ? 'Clerk Operational Log' : 'Manager Audit View'}
          </span>
        }
      />

      <Card
        title="Movement Transaction History"
        subtitle={`Live branch ledger for ${user?.branchName || 'Quezon City Branch #1'}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                <th className="py-3 px-3">Tx ID</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Item Name</th>
                <th className="py-3 px-3">Movement Type</th>
                <th className="py-3 px-3 text-right">Quantity Change</th>
                <th className="py-3 px-3">Staff / Clerk</th>
                <th className="py-3 px-3">Reference / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-3 font-mono text-xs text-purple-700 font-bold">TX-9012</td>
                <td className="py-3 px-3 text-xs text-slate-500">2024-09-22 14:32</td>
                <td className="py-3 px-3 font-medium">Bosch Hammer Drill 13mm</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                    <ArrowDownRight className="w-3 h-3" /> SALE
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-bold text-rose-600">-1 unit</td>
                <td className="py-3 px-3 text-xs">Marco Santos (Clerk)</td>
                <td className="py-3 px-3 text-xs text-slate-500">POS-RC-98412</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono text-xs text-purple-700 font-bold">TX-9011</td>
                <td className="py-3 px-3 text-xs text-slate-500">2024-09-22 11:15</td>
                <td className="py-3 px-3 font-medium">Stanley Measuring Tape 8m</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                    <ArrowDownRight className="w-3 h-3" /> SALE
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-bold text-rose-600">-2 units</td>
                <td className="py-3 px-3 text-xs">Marco Santos (Clerk)</td>
                <td className="py-3 px-3 text-xs text-slate-500">POS-RC-98409</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono text-xs text-purple-700 font-bold">TX-9010</td>
                <td className="py-3 px-3 text-xs text-slate-500">2024-09-21 16:40</td>
                <td className="py-3 px-3 font-medium">Makita Angle Grinder 4"</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <ArrowUpRight className="w-3 h-3" /> RESTOCK_RECEIPT
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-bold text-emerald-600">+10 units</td>
                <td className="py-3 px-3 text-xs">Elena Ramos (Manager)</td>
                <td className="py-3 px-3 text-xs text-slate-500">sp_fulfill DEL-9022</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StockMovements;
