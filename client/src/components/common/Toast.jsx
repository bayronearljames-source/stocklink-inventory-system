import { useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";

const VARIANTS = {
  success: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-800",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
  },
  error: {
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-800",
    icon: XCircle,
    iconColor: "text-rose-600",
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    icon: AlertCircle,
    iconColor: "text-amber-600",
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
    icon: Info,
    iconColor: "text-blue-600",
  },
};

export const Toast = ({ id, variant = "info", message, duration = 5000, onClose }) => {
  const config = VARIANTS[variant] || VARIANTS.info;
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${config.bg} animate-slide-in-right`}
      role="alert"
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <p className={`text-sm font-medium flex-1 ${config.text}`}>{message}</p>
      <button
        onClick={() => onClose(id)}
        className={`shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5 ${config.text}`}
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
