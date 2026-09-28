import { useEffect } from 'react';
import { X } from 'lucide-react';

// A simple modal overlay used by the three admin Create forms.
// Props:
//   isOpen  — boolean controlling visibility
//   onClose — called when the user clicks the backdrop or the X button
//   title   — string shown in the modal header
//   children — the form content
export const Modal = ({ isOpen, onClose, title, children }) => {
  // Close on Escape key so keyboard users can dismiss without the mouse
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Nothing in the DOM when closed — no hidden element, no layout shift
  if (!isOpen) return null;

  return (
    // Semi-transparent backdrop — clicking it closes the modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
      onClick={onClose}
    >
      {/* Stop click events on the panel itself from bubbling up to the backdrop */}
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form content passed in as children */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
