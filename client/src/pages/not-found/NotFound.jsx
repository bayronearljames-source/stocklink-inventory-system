import { useNavigate } from 'react-router-dom';
import { HelpCircle, Home, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <HelpCircle className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900">404</h1>
        <h2 className="text-base font-semibold text-slate-700 mt-1">Page Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">
          The route you are attempting to visit does not exist in StockLink.
        </p>

        <div className="flex gap-3 justify-center mt-6">
          <Button variant="secondary" onClick={() => navigate(-1)} icon={ArrowLeft}>
            Go Back
          </Button>
          <Button variant="primary" onClick={() => navigate('/')} icon={Home}>
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
