import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Button from '../../components/common/Button';

export const Unauthorized = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900">403 — Access Denied</h1>
        <p className="text-sm text-slate-600 mt-2">
          Your active role (<strong className="text-slate-900">{user ? ROLE_LABELS[user.role] : 'Unauthenticated'}</strong>) is not authorized to access this route.
        </p>

        <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-left">
          <p className="font-semibold text-slate-700 mb-1">RBAC Security Rule Enforcement:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Clerk:</strong> Limited to Stock Movements logging.</li>
            <li><strong>Manager:</strong> Scoped strictly to their own branch stock and restock view.</li>
            <li><strong>Admin:</strong> Master catalog, branch management, suppliers, audit logs.</li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => navigate(-1)} icon={ArrowLeft}>
            Go Back
          </Button>
          <Button variant="primary" onClick={() => navigate('/')} icon={Home}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
