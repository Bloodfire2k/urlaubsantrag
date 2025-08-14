import React from 'react'
import { cn } from '../../lib/cn'

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantMap: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  success: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  warning: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  danger: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
  info: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200',
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'neutral', ...props }) => (
  <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', variantMap[variant], className)} {...props} />
)

export default Badge


