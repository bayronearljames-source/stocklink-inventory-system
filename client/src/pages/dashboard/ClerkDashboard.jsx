import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import { ArrowLeftRight, CheckCircle2, AlertCircle, ShoppingCart, ArrowDownRight, History } from 'lucide-react';
import Button from '../../components/common/Button';

export const ClerkDashboard = () => {
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState('');
  const [movementType, setMovementType] = useState('SALE');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogMovement = (e) => {
    e.preventDefault();
    setSuccessMessage(
      `Logged: ${movementType} of ${quantity} unit(s). Database trigger evaluated branch stock!`
    );
    setTimeout(() => setSuccessMessage(''), 5000);
    setQuantity(1);
    setNotes('');
  };

  return (
    <div>
      <PageHeader
        title="Branch Staff / Clerk Workspace"
        description="Log day-to-day stock sales and withdrawals. Decrementing stock automatically fires the database low-stock trigger."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            {user?.branchName || 'Quezon City Branch #1'}
          </span>
        }
      />

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm font-medium">{successMessage}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Operational Logging Form */}
        <div className="lg:col-span-2">
          <Card
            title="Log Stock Movement / Sale"
            subtitle="Any reduction below threshold immediately creates a restock request via DB trigger"
          >
            <form onSubmit={handleLogMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Hardware Item</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">-- Choose an item in branch inventory --</option>
                  <option value="item-01">Bosch Hammer Drill 13mm (Current Qty: 2, Threshold: 5) [LOW STOCK]</option>
                  <option value="item-02">Stanley Measuring Tape 8m (Current Qty: 15, Threshold: 10)</option>
                  <option value="item-03">Makita Angle Grinder 4" (Current Qty: 8, Threshold: 4)</option>
                  <option value="item-04">WD-40 Multi-Use Lubricant 400ml (Current Qty: 20, Threshold: 8)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Type</label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="SALE">Customer Sale (Decrement)</option>
                    <option value="WITHDRAWAL">Store Withdrawal / Damaged</option>
                    <option value="RETURN">Customer Return (Increment)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Notes / Reference (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., POS Receipt #98421, Customer walk-in sale"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="lg" icon={ShoppingCart} className="w-full sm:w-auto">
                  Submit Movement & Decrement Stock
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Operational Scope & Audit Callout */}
        <div className="space-y-6">
          <Card title="Clerk Scope & Permissions" subtitle="Strict operational boundaries">
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Can log stock movements for assigned branch (Quezon City).</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Cannot view other branch inventories or central stock.</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Cannot approve or modify restock requests (Admin only).</span>
              </div>
            </div>
          </Card>

          <Card title="Recent Movements (Branch)" subtitle="Last 3 transactions logged">
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-800">Bosch Hammer Drill 13mm</div>
                <div className="text-slate-500 flex justify-between mt-1">
                  <span>Type: SALE (-1)</span>
                  <span className="font-mono">10 mins ago</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-800">Stanley Measuring Tape 8m</div>
                <div className="text-slate-500 flex justify-between mt-1">
                  <span>Type: SALE (-2)</span>
                  <span className="font-mono">1 hour ago</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClerkDashboard;
