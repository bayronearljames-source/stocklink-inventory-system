import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Building2, Plus, MapPin, Phone } from 'lucide-react';

export const BranchManagement = () => {
  return (
    <div>
      <PageHeader
        title="Branch Locations Management"
        description="Configure retail branch profiles, physical locations, and assigned managers."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Admin Only
          </span>
        }
        action={
          <Button variant="primary" icon={Plus}>
            Register New Branch
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Active
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-base mt-3">Quezon City Branch #1</h3>
          <p className="text-xs font-mono text-purple-700 mt-0.5">Code: BR-01</p>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Commonwealth Ave., Quezon City</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>(02) 8921-4451</span>
            </div>
          </div>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Active
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-base mt-3">Makati Branch #2</h3>
          <p className="text-xs font-mono text-purple-700 mt-0.5">Code: BR-02</p>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Chino Roces Ave., Makati City</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>(02) 8812-3390</span>
            </div>
          </div>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Active
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-base mt-3">Cebu Central Branch</h3>
          <p className="text-xs font-mono text-purple-700 mt-0.5">Code: BR-03</p>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Mandaue City, Cebu</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>(032) 345-8812</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BranchManagement;
