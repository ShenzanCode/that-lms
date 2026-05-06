import { cn } from '@/lib/utils'

export const Card = ({ children, className, ...props }) => {
  return (
    <div className={cn('card p-6', className)} {...props}>
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className, ...props }) => {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export const CardTitle = ({ children, className, ...props }) => {
  return (
    <h3 className={cn('text-lg font-bold', className)} style={{color: '#011039'}} {...props}>
      {children}
    </h3>
  )
}

export const CardContent = ({ children, className, ...props }) => {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

export default Card
