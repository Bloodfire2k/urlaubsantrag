import React from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'

const sizeMap: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 h-9',
  md: 'text-sm px-4 h-10',
  lg: 'text-base px-5 h-12',
}

const variantMap: Record<ButtonVariant, string> = {
  primary: 'text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-sm hover:shadow',
  secondary: 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100',
  ghost: 'text-slate-700 hover:bg-slate-100',
  danger: 'text-white bg-rose-600 hover:bg-rose-700',
  outline: 'text-slate-700 border border-slate-300 hover:bg-slate-50',
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(base, sizeMap[size], variantMap[variant], fullWidth && 'w-full', className)}
      {...props}
    >
      {leftIcon && <span className="mr-2 -ml-1 flex items-center">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2 -mr-1 flex items-center">{rightIcon}</span>}
    </button>
  )
}

export default Button


