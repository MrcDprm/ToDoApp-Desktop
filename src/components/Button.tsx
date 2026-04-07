import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 disabled:bg-violet-600/40',
  secondary:
    'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 disabled:bg-slate-700/40',
  ghost:
    'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40',
  danger:
    'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 disabled:opacity-40',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled ?? loading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}
