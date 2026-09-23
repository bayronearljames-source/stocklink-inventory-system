import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ClipboardList, CheckCircle2, XCircle, ArrowRight, Zap } from 'lucide-react';

export const RestockRequests = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const [activeTab, setActiveTab] = useState('pending');
  const [successNotice, setSuccessNotice] = useState('');

  const handleFulfillRequest = (reqId) => {
    setSuccessNotice(
      `Called stored procedure sp_fulfill_restock_request('${reqId}'): Deducted central stock, incremented branch stock atomically!`
    );
    setTimeout(() => setSuccessNotice(''), 6000);
  };

  return (
    <div>
      <PageHeader
        title="Restock Requests Queue"
        description="Database-triggered restock requests. Admin approval executes stored procedure sp_fulfill_restock_request for atomic multi-table transfer."
        badge={
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {isAdmin ? 'Admin Approval Queue' : 'Branch Restock Status'}
          </span>
        }
      />

      {successNotice && (
        <div className="mb-6 p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center gap-3">
          <Zap className="w-5 h-5 text-purple-600 shrink-0" />
          <div className="text-xs font-mono">{successNotice}</div>
        </div>
      )}

      <Card>
        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-slate-100 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'pending' ? 'bg-amber-100 text-amber-900' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Pending Review (2)
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'approved' ? 'bg-blue-100 text-blue-900' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            In Transit / Approved (1)
          </button>
          <button
            onClick={() => setActiveTab('fulfilled')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'fulfilled' ? 'bg-emerald-100 text-emerald-900' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Fulfilled History
          </button>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                <th className="py-3 px-3">Request ID</th>
                <th className="py-3 px-3">Target Branch</th>
                <th className="py-3 px-3">Item Requested</th>
                <th className="py-3 px-3 text-right">Requested Qty</th>
                <th className="py-3 px-3">Generation Reason</th>
                <th className="py-3 px-3">Status</th>
                {isAdmin && <th className="py-3 px-3 text-right">Procedure Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-3 font-mono text-xs font-bold text-purple-700">REQ-2024-001</td>
                <td className="py-3 px-3 font-semibold text-slate-900">Quezon City Branch #1</td>
                <td className="py-3 px-3">Bosch Hammer Drill 13mm</td>
                <td className="py-3 px-3 text-right font-bold text-rose-600">10 units</td>
                <td className="py-3 px-3 text-xs text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                    DB Trigger: qty (2) &lt; threshold (5)
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    Pending Admin
                  </span>
                </td>
                {isAdmin && (
                  <td className="py-3 px-3 text-right space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleFulfillRequest('REQ-2024-001')}
                      icon={CheckCircle2}
                    >
                      Approve & Fulfill (sp_fulfill)
                    </Button>
                    <Button variant="danger" size="sm" icon={XCircle}>
                      Reject
                    </Button>
                  </td>
                )}
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono text-xs font-bold text-purple-700">REQ-2024-002</td>
                <td className="py-3 px-3 font-semibold text-slate-900">Makati Branch #2</td>
                <td className="py-3 px-3">Stanley Measuring Tape 8m</td>
                <td className="py-3 px-3 text-right font-bold text-rose-600">25 units</td>
                <td className="py-3 px-3 text-xs text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                    DB Trigger: qty (4) &lt; threshold (10)
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    Pending Admin
                  </span>
                </td>
                {isAdmin && (
                  <td className="py-3 px-3 text-right space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleFulfillRequest('REQ-2024-002')}
                      icon={CheckCircle2}
                    >
                      Approve & Fulfill (sp_fulfill)
                    </Button>
                    <Button variant="danger" size="sm" icon={XCircle}>
                      Reject
                    </Button>
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default RestockRequests;
