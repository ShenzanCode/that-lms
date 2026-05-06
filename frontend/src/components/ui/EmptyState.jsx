import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      {Icon && (
        <div className="w-16 h-16 mb-4 text-gray-400">
          <Icon className="w-full h-full" />
        </div>
      )}
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-center max-w-md mb-4" style={{color: '#011039'}}>{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}

export const Alert = ({ variant = 'info', title, children, className }) => {
  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      content: 'text-blue-700',
      Icon: Info,
    },
    success: {
      container: 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      title: 'text-green-800',
      content: 'text-green-700',
      Icon: CheckCircle2,
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      content: 'text-yellow-700',
      Icon: AlertCircle,
    },
    danger: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      content: 'text-red-700',
      Icon: XCircle,
    },
  }
  
  const { container, icon, title: titleClass, content, Icon } = variants[variant]
  
  return (
    <div className={cn('border rounded-lg p-4', container, className)}>
      <div className="flex gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0', icon)} />
        <div className="flex-1">
          {title && <h4 className={cn('font-bold mb-1', titleClass)}>{title}</h4>}
          <div className={cn('text-sm', content)}>{children}</div>
        </div>
      </div>
    </div>
  )
}
