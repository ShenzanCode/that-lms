import { cn, getStatusColor } from '@/lib/utils'

export const Badge = ({ children, variant = 'primary', className, style, ...props }) => {
  const getVariantStyle = () => {
    switch(variant) {
      case 'primary':
        return { backgroundColor: '#FFF4E6', color: '#E76800' }
      case 'success':
        return { backgroundColor: '#E6F4EA', color: '#137333' }
      case 'warning':
        return { backgroundColor: '#FFF4E6', color: '#E76800' }
      case 'danger':
        return { backgroundColor: '#FFEAEA', color: '#D93025' }
      case 'secondary':
        return { backgroundColor: '#E6F2FF', color: '#011039' }
      case 'info':
        return { backgroundColor: '#E6F2FF', color: '#011039' }
      default:
        return { backgroundColor: '#F5F5F5', color: '#011039' }
    }
  }
  
  return (
    <span 
      className={cn('badge inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', className)} 
      style={{...getVariantStyle(), ...style}}
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
