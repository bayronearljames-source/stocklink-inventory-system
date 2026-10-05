export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  const variants = {
    primary: 'bg-[#176346] text-white shadow-sm hover:bg-[#124f38] focus-visible:outline-[#0d7d5b]',
    secondary: 'border border-[#dce5df] bg-white text-[#40584b] shadow-sm hover:bg-[#f6f9f6] focus-visible:outline-[#71917f]',
    danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:outline-rose-500',
    ghost: 'bg-transparent text-[#586d61] hover:bg-[#eef4ef] focus-visible:outline-[#71917f]',
    purple: 'bg-purple-600 text-white shadow-sm hover:bg-purple-700 focus-visible:outline-purple-500',
    blue: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:outline-blue-500',
  };

  const sizes = {
    sm: 'gap-1.5 px-3 py-2 text-xs',
    md: 'gap-2 px-4 py-2.5 text-sm',
    lg: 'gap-2.5 px-5 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
};

export default Button;
