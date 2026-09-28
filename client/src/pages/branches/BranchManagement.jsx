import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { apiClient } from '../../api/client';
import { Building2, Plus, MapPin, Phone } from 'lucide-react';

export const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields — match exactly what POST /api/branches destructures:
  // { branch_name, location, contact_phone }
  const [branchName, setBranchName] = useState('');
  const [location, setLocation] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // loadBranches as useCallback so it can be called both on mount and after a create
  const loadBranches = useCallback(async (isMounted) => {
    setIsLoading(true);
    setError(null);
    try {
      // GET /api/branches — returns { branch_id, branch_name, location, contact_phone }
      const data = await apiClient.get('/branches');
      if (isMounted) setBranches(data);
    } catch (err) {
      if (isMounted) setError(err.message);
    } finally {
      if (isMounted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadBranches(isMounted);
    return () => { isMounted = false; };
  }, [loadBranches]);

  const openModal = () => {
    setBranchName('');
    setLocation('');
    setContactPhone('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // branch_name is the only required field — location and contact_phone are optional
    if (!branchName.trim()) {
      setFormError('Branch name is required.');
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      // POST /api/branches — body: { branch_name, location, contact_phone }
      // contact_phone is optional so we include it even if empty — Prisma accepts null
      await apiClient.post('/branches', {
        branch_name: branchName.trim(),
        location: location.trim() || null,
        contact_phone: contactPhone.trim() || null,
      });

      setIsModalOpen(false);
      await loadBranches(true);
    } catch (err) {
      // Backend { error } message shown inside the form; modal stays open
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

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
          <Button variant="primary" icon={Plus} onClick={openModal}>
            Register New Branch
          </Button>
        }
      />

      {isLoading && (
        <div className="py-16 text-center text-sm text-slate-500">Loading branches…</div>
      )}

      {!isLoading && error && (
        <div className="py-10 text-center text-sm text-rose-600">
          Failed to load branches: {error}
        </div>
      )}

      {!isLoading && !error && branches.length === 0 && (
        <div className="py-10 text-center text-sm text-slate-500">
          No branches registered yet. Add your first branch to get started.
        </div>
      )}

      {!isLoading && !error && branches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <Card key={branch.branch_id} className="hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base mt-3">{branch.branch_name}</h3>
              <p className="text-xs font-mono text-purple-700 mt-0.5">ID: {branch.branch_id}</p>

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
                  <span className="text-slate-400 italic">No contact info on record</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Register New Branch Modal ── */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Register New Branch">
        <form onSubmit={handleSubmit} className="space-y-4">

          {formError && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Branch Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="e.g. Quezon City Branch #4"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location / Address
              <span className="ml-1 text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Commonwealth Ave., Quezon City"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Phone
              <span className="ml-1 text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. (02) 8921-4451"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Register Branch'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BranchManagement;
