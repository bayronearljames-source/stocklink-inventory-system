import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FileBarChart, Download, Calendar, Filter } from 'lucide-react';

export const Reports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  return (
    <div>
      <PageHeader
        title="Inventory & Distribution Reports"
        description="Consolidated analytics: low stock frequency, restock cycle times, and branch sales volume."
        badge={
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {isAdmin ? 'System-Wide Reports' : 'Branch Scoped Report'}
          </span>
        }
        action={
          <Button variant="secondary" icon={Download}>
            Export Summary (CSV)
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card title="Restock Frequency by Item" subtitle="Most frequently requested items across branches">
          <div className="space-y-3 mt-2">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Bosch Hammer Drill 13mm</span>
                <span className="font-bold">14 restocks</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[85%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Stanley Measuring Tape 8m</span>
                <span className="font-bold">9 restocks</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[55%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Makita Angle Grinder 4"</span>
                <span className="font-bold">6 restocks</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[35%]"></div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Average Restock Fulfillment Time" subtitle="From DB trigger creation to stored procedure execution">
          <div className="text-center py-4">
            <div className="text-3xl font-extrabold text-slate-900">4.2 hrs</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">↓ 68% faster than manual phone ordering</p>
            <p className="text-[11px] text-slate-400 mt-2">Measured over 48 restock cycles</p>
          </div>
        </Card>

        <Card title="Branch Consumption Share" subtitle="Stock movement volume by location">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded bg-slate-50">
              <span className="font-medium">Quezon City Branch #1</span>
              <span className="font-bold text-slate-900">42% (580 units)</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-50">
              <span className="font-medium">Makati Branch #2</span>
              <span className="font-bold text-slate-900">35% (485 units)</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-50">
              <span className="font-medium">Cebu Central Branch</span>
              <span className="font-bold text-slate-900">23% (315 units)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
