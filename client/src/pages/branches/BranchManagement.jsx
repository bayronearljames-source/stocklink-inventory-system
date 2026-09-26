import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { apiClient } from "../../api/client";
import { Building2, Plus, MapPin, Phone } from "lucide-react";

export const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBranches() {
      setIsLoading(true);
      setError(null);
      try {
        // GET /api/branches — returns array of { branch_id, branch_name, location, contact_phone }
        const data = await apiClient.get("/branches");
        if (isMounted) setBranches(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadBranches();
    return () => {
      isMounted = false;
    };
  }, []);

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
          // POST /api/branches needs branch_name, location, contact_phone — wiring deferred
          <Button
            variant="primary"
            icon={Plus}
            disabled
            title="Add branch form — coming soon"
          >
            Register New Branch
          </Button>
        }
      />

      {isLoading && (
        <div className="py-16 text-center text-sm text-slate-500">
          Loading branches…
        </div>
      )}

      {!isLoading && error && (
        <div className="py-10 text-center text-sm text-rose-600">
          Failed to load branches: {error}
        </div>
      )}

      {!isLoading && !error && branches.length === 0 && (
        <div className="py-10 text-center text-sm text-slate-500">
          No branches found. Register the first branch to get started.
        </div>
      )}

      {!isLoading && !error && branches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <Card
              key={branch.branch_id}
              className="hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                {/* No "active" flag in current schema — all returned rows are active */}
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>

              {/* branch_name and branch_id are the real field names from Prisma */}
              <h3 className="font-bold text-slate-900 text-base mt-3">
                {branch.branch_name}
              </h3>
              <p className="text-xs font-mono text-purple-700 mt-0.5">
                ID: {branch.branch_id}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                {branch.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{branch.location}</span>
                  </div>
                )}
                {branch.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{branch.contact_phone}</span>
                  </div>
                )}
                {!branch.location && !branch.contact_phone && (
                  <span className="text-slate-400 italic">
                    No contact info on record
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchManagement;
