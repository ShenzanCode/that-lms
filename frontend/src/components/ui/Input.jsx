import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export const Input = forwardRef(({ className, type = 'text', error, label, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="label block mb-1.5 text-sm font-bold" style={{color: '#011039'}}>
          {label}
          {props.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        className={cn(
          'input',
          error && 'border-danger-500 focus:ring-danger-500',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
