import { X } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', 
  className,
  showHeader = true,
  noPadding = false
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-7xl',
  }
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>
        
        {/* Modal */}
        <div className={cn(
          'relative bg-white rounded-lg shadow-lg w-full animate-in fade-in zoom-in duration-300',
          sizes[size],
          className
        )}>
          {/* Header */}
          {showHeader && (
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold" style={{color: '#011039'}}>{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-all"
                style={{color: '#E76800'}}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className={cn(
            noPadding ? 'p-0' : 'p-6',
            'overflow-hidden rounded-lg'
          )}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal
