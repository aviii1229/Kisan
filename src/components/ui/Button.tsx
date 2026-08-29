import React from 'react';
import { Loader } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'harvest' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-agri-600 hover:bg-agri-500 text-white border-agri-700 shadow-md shadow-agri-600/10',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs',
    dark: 'bg-slate-900 hover:bg-slate-800 text-white border-slate-950 shadow-md',
    harvest: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-amber-600 shadow-md shadow-amber-500/20',
    danger: 'bg-clay-600 hover:bg-clay-500 text-white border-clay-700 shadow-md',
    outline: 'bg-transparent hover:bg-slate-100/80 text-slate-700 border-slate-300'
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-xl min-h-[36px]',
    md: 'px-4 py-2.5 text-xs font-bold rounded-xl min-h-[44px]',
    lg: 'px-5 py-3 text-sm font-extrabold rounded-2xl min-h-[48px]'
  };

  return (
    <button
      disabled={disabled || loading}
      className={`border transition-all btn-active-press flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader className="w-4 h-4 animate-spin flex-shrink-0" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
export default Button;
