import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Truck, Plus, Clock, Tag } from 'lucide-react';

export const SupplierManagement = () => {
  return (
    <div>
      <PageHeader
        title="Supplier Catalog & Pricing"
        description="Manage vendor relations and supplier_items junction records (unit costs, lead times, minimum order quantities)."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Admin Only
          </span>
        }
        action={
          <Button variant="primary" icon={Plus}>
            Add Supplier Record
          </Button>
        }
      />

      <Card
        title="Supplier Item Catalog Junction (supplier_items)"
        subtitle="Many-to-many relationship carrying supplier pricing and delivery lead times"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                <th className="py-3 px-3">Supplier Name</th>
                <th className="py-3 px-3">Supplied Item</th>
                <th className="py-3 px-3 text-right">Supplier Unit Cost</th>
                <th className="py-3 px-3 text-center">Lead Time</th>
                <th className="py-3 px-3 text-center">Min Order Qty</th>
                <th className="py-3 px-3">Contact Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900">Apex Industrial Tools Corp.</td>
                <td className="py-3 px-3 font-medium">Bosch Hammer Drill 13mm</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">₱2,800.00</td>
                <td className="py-3 px-3 text-center font-medium">3 days</td>
                <td className="py-3 px-3 text-center">5 units</td>
                <td className="py-3 px-3 text-xs text-slate-500">sales@apexindustrial.ph</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900">Stanley Black & Decker PH</td>
                <td className="py-3 px-3 font-medium">Stanley PowerLock Tape 8m</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">₱310.00</td>
                <td className="py-3 px-3 text-center font-medium">2 days</td>
                <td className="py-3 px-3 text-center">20 units</td>
                <td className="py-3 px-3 text-xs text-slate-500">orders@sbd-ph.com</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900">Makita Commercial Supplies</td>
                <td className="py-3 px-3 font-medium">Makita Angle Grinder 4"</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">₱2,350.00</td>
                <td className="py-3 px-3 text-center font-medium">4 days</td>
                <td className="py-3 px-3 text-center">10 units</td>
                <td className="py-3 px-3 text-xs text-slate-500">distro@makita-supplies.ph</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SupplierManagement;
