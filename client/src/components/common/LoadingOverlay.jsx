import Spinner from "./Spinner";

export const LoadingOverlay = ({ message = "Loading…" }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Spinner size="lg" className="text-emerald-600" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
};

export default LoadingOverlay;
