import React from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
interface CardSubtitleProps extends React.HTMLAttributes<HTMLParagraphElement> {}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className, ...props }) => (
  <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm', className)} {...props} />
)

export const CardHeader: React.FC<CardHeaderProps> = ({ className, ...props }) => (
  <div className={cn('px-6 py-5 border-b border-slate-200 bg-slate-50/60', className)} {...props} />
)

export const CardTitle: React.FC<CardTitleProps> = ({ className, ...props }) => (
  <h3 className={cn('text-xl font-semibold text-slate-900', className)} {...props} />
)

export const CardSubtitle: React.FC<CardSubtitleProps> = ({ className, ...props }) => (
  <p className={cn('text-slate-500', className)} {...props} />
)

export const CardContent: React.FC<CardContentProps> = ({ className, ...props }) => (
  <div className={cn('p-6', className)} {...props} />
)

export default Card


