import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { apiClient } from '../../api/client';
import { FileBarChart, Download, Calendar, Filter, Loader2 } from 'lucide-react';

export const Reports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [restockFrequency, setRestockFrequency] = useState([]);
  const [fulfillmentTime, setFulfillmentTime] = useState(null);
  const [branchConsumption, setBranchConsumption] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      setIsLoading(true);
      setError(null);
      try {
        const [frequencyRes, timeRes, consumptionRes] = await Promise.allSettled([
          apiClient.get('/reports/restock-frequency'),
          apiClient.get('/reports/fulfillment-time'),
          // Branch consumption is admin-only
          isAdmin ? apiClient.get('/reports/branch-consumption') : Promise.resolve([]),
        ]);

        if (!isMounted) return;

        if (frequencyRes.status === 'fulfilled') {
          setRestockFrequency(frequencyRes.value);
        }
        if (timeRes.status === 'fulfilled') {
          setFulfillmentTime(timeRes.value);
        }
        if (consumptionRes.status === 'fulfilled' && isAdmin) {
          setBranchConsumption(consumptionRes.value);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReports();
    return () => { isMounted = false; };
  }, [isAdmin]);

  // Helper: calculate bar width percentage for restock frequency
  const getBarWidth = (count) => {
    if (restockFrequency.length === 0) return 0;
    const max = Math.max(...restockFrequency.map(r => r.restock_count));
    return max > 0 ? (count / max) * 100 : 0;
  };

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

      {isLoading && (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading analytics...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card>
          <div className="py-10 text-center text-sm text-rose-600">
            Failed to load reports: {error}
          </div>
        </Card>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Restock Frequency */}
          <Card title="Restock Frequency by Item" subtitle="Most frequently requested items across branches">
            {restockFrequency.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No restock requests recorded yet.
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {restockFrequency.slice(0, 5).map((item) => (
                  <div key={item.item_id}>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="truncate">{item.item_name}</span>
                      <span className="font-bold ml-2">{item.restock_count} restocks</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${getBarWidth(item.restock_count)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Fulfillment Time */}
          <Card title="Average Restock Fulfillment Time" subtitle="From request creation to admin approval">
            {!fulfillmentTime || fulfillmentTime.sample_size === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No fulfilled requests yet.
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-3xl font-extrabold text-slate-900">
                  {fulfillmentTime.average_hours.toFixed(1)} hrs
                </div>
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  Automated trigger-to-fulfillment cycle
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Based on {fulfillmentTime.sample_size} fulfilled request{fulfillmentTime.sample_size !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </Card>

          {/* Branch Consumption (Admin Only) */}
          {isAdmin ? (
            <Card title="Branch Consumption Share" subtitle="Stock movement volume by location">
              {branchConsumption.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No stock movements recorded yet.
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {branchConsumption.map((branch) => (
                    <div key={branch.branch_id} className="flex justify-between p-2 rounded bg-slate-50">
                      <span className="font-medium truncate">{branch.branch_name}</span>
                      <span className="font-bold text-slate-900 ml-2 whitespace-nowrap">
                        {branch.percentage}% ({branch.total_units} units)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card title="Branch Performance" subtitle="Your branch metrics">
              <div className="py-8 text-center text-xs text-slate-500">
                Branch-level analytics available to managers.
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
