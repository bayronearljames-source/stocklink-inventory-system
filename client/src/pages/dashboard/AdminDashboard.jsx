import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import { Package, Boxes, ClipboardList, ShieldCheck, TrendingDown, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Central Warehouse Administration"
        description="Full system visibility, master item catalog, restock approval queue, and audit logs."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            HQ Central Admin
          </span>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Master Catalog Items</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">148</h3>
              <p className="text-[11px] text-slate-500 mt-1">Across 8 tool categories</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Restocks</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">5</h3>
              <p className="text-[11px] text-amber-700 font-medium mt-1">Triggered by low branch stock</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Branches</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">4</h3>
              <p className="text-[11px] text-slate-500 mt-1">Metro Manila & Calabarzon</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Log Events</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">1,240</h3>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">Postgres trigger active</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Pending Approval Queue & Database Automation Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Restock Requests Queue */}
        <div className="lg:col-span-2">
          <Card
            title="Auto-Generated Restock Requests"
            subtitle="Triggered automatically by PostgreSQL trigger when branch_stock drops below threshold"
            action={
              <Link
                to="/restock-requests"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                View Full Queue <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <th className="pb-3">Request ID</th>
                    <th className="pb-3">Branch</th>
                    <th className="pb-3">Item Name</th>
                    <th className="pb-3">Qty Needed</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-3 font-mono text-xs font-semibold text-purple-700">REQ-2024-001</td>
                    <td className="py-3 font-medium">Quezon City Branch #1</td>
                    <td className="py-3">Bosch Hammer Drill 13mm</td>
                    <td className="py-3 font-semibold text-rose-600">10 units</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        Pending Admin
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link to="/restock-requests" className="text-xs font-bold text-emerald-600 hover:underline">
                        Review
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono text-xs font-semibold text-purple-700">REQ-2024-002</td>
                    <td className="py-3 font-medium">Makati Branch #2</td>
                    <td className="py-3">Stanley Measuring Tape 8m</td>
                    <td className="py-3 font-semibold text-rose-600">25 units</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        Pending Admin
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link to="/restock-requests" className="text-xs font-bold text-emerald-600 hover:underline">
                        Review
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono text-xs font-semibold text-purple-700">REQ-2024-003</td>
                    <td className="py-3 font-medium">Cebu City Central</td>
                    <td className="py-3">Makita Angle Grinder 4"</td>
                    <td className="py-3 font-semibold text-rose-600">8 units</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Fulfilled (sp_fulfill)
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-xs text-slate-400">Completed</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Database Automation Architecture Highlight */}
        <div>
          <Card
            title="Database Layer Features"
            subtitle="Core PostgreSQL architectural components for defense"
          >
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Trigger: Auto Restock Generation
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  <code>AFTER UPDATE ON branch_stock</code> detects quantity &lt; reorder_threshold and immediately inserts into <code>restock_requests</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Stored Proc: Atomic Fulfillment
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  <code>sp_fulfill_restock_request()</code> deducts central stock, increments branch stock, and logs transfer in a single transaction.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Trigger: Automated Audit Logging
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Zero application logging — database captures who, what, when, old_qty &rarr; new_qty automatically.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
