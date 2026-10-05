export const PageHeader = ({ title, description, badge, action }) => {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-[#dfe7e1] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[25px] font-bold leading-tight tracking-[-0.035em] text-[#18372c] sm:text-[30px]">
            {title}
          </h1>
          {badge && <span className="inline-flex">{badge}</span>}
        </div>
        {description && (
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[#6c7d73]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
};

export default PageHeader;
