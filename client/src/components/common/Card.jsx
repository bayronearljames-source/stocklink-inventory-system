export const Card = ({ children, className = '', title, subtitle, action }) => {
  return (
    <section className={`overflow-hidden rounded-2xl border border-[#e1e8e3] bg-white shadow-[0_2px_8px_rgba(25,55,42,0.035)] ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-[#edf1ee] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold tracking-[-0.01em] text-[#203b30]">{title}</h3>}
            {subtitle && <p className="mt-1 text-xs leading-relaxed text-[#718078]">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
};

export default Card;
