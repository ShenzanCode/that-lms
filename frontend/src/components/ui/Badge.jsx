import { cn, getStatusColor } from '@/lib/utils'

export const Badge = ({ children, variant = 'primary', className, ...props }) => {
  const variants = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success-600',
    warning: 'bg-warning/10 text-warning-600',
    danger: 'bg-danger/10 text-danger-600',
    secondary: 'bg-secondary/10 text-secondary',
    info: 'bg-blue-100 text-blue-700',
    default: 'bg-gray-100 text-gray-700',
  }
  
  return (
    <span 
      className={cn(
        'badge inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap', 
        variants[variant] || variants.default,
        className
      )} 
      {...props}
    >
      {children}
    </span>
  )
}

export const StatusBadge = ({ status }) => {
  const color = getStatusColor(status)
  return <Badge variant={color}>{status}</Badge>
}
