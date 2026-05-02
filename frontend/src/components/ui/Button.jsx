import { cn } from '@/lib/utils'

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  disabled,
  loading,
  ...props 
}) => {
  const baseStyles = 'btn inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'text-white hover:opacity-90 focus:ring-2 focus:ring-offset-2',
    secondary: 'text-white hover:opacity-90 focus:ring-2 focus:ring-offset-2',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2',
    ghost: 'hover:bg-gray-100 focus:ring-gray-300',
    danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500',
    success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  
  const getButtonStyle = () => {
    if (variant === 'primary') {
      return { backgroundColor: '#E76800' }
    }
    if (variant === 'secondary') {
      return { backgroundColor: '#011039' }
    }
    if (variant === 'outline') {
      return { color: '#011039', borderColor: '#011039' }
    }
    if (variant === 'ghost') {
      return { color: '#011039' }
    }
    if (variant === 'danger') {
      return { backgroundColor: '#dc2626', color: '#ffffff' }
    }
    return {}
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      style={getButtonStyle()}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}

export default Button
