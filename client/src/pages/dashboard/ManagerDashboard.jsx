import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import { Boxes, ClipboardList, ArrowLeftRight, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ManagerDashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Branch Manager Dashboard"
        description="Scoped view for your assigned branch: live shelf stock, restock request status, and delivery confirmations."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            {user?.branchName || 'Branch Manager'}
          </span>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch Stocked Items</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">42</h3>
              <p className="text-[11px] text-slate-500 mt-1">Managed at this location</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Warnings</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">3 Items</h3>
              <p className="text-[11px] text-rose-700 font-medium mt-1">Below reorder threshold</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Transactions</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">18</h3>
              <p className="text-[11px] text-slate-500 mt-1">Logged by branch staff</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Critical Stock Table */}
        <Card
          title="Critical Low Stock Items"
          subtitle="Auto-request generated and sent to central warehouse"
          action={
            <Link to="/stock" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View All Stock <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="pb-3">Item Name</th>
                  <th className="pb-3">Current Qty</th>
                  <th className="pb-3">Threshold</th>
                  <th className="pb-3">Restock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 font-medium">Bosch Hammer Drill 13mm</td>
                  <td className="py-3 font-bold text-rose-600">2 units</td>
                  <td className="py-3 text-slate-500">5 units</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      Pending Admin Review
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Stanley Measuring Tape 8m</td>
                  <td className="py-3 font-bold text-rose-600">4 units</td>
                  <td className="py-3 text-slate-500">10 units</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      In Transit from HQ
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">WD-40 Specialist Spray 400ml</td>
                  <td className="py-3 font-bold text-rose-600">3 units</td>
                  <td className="py-3 text-slate-500">8 units</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      Auto-Queued
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Incoming Deliveries & Confirmation */}
        <Card
          title="Incoming Restock Deliveries"
          subtitle="Confirm delivery receipt to execute atomic stock update via stored procedure"
        >
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 text-sm">Delivery #DEL-9041 (Stanley Tape 8m)</div>
                <div className="text-xs text-slate-500 mt-0.5">Dispatched from Central Warehouse • Qty: 25</div>
              </div>
              <button className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm">
                Confirm Receipt
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 text-sm">Delivery #DEL-9038 (Makita Cut-Off Disc)</div>
                <div className="text-xs text-slate-500 mt-0.5">Dispatched from Central Warehouse • Qty: 50</div>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-lg">
                Received & Updated
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
