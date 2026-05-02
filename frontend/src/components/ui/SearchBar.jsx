import { Search } from 'lucide-react'
import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export const SearchBar = ({ value, onChange, placeholder = 'Search...', className }) => {
  const inputRef = useRef(null)
  
  // Maintain focus when value changes
  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) {
      // Keep focus if input was focused
      inputRef.current.focus()
    }
  }, [value])

  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pl-10"
        placeholder={placeholder}
      />
    </div>
  )
}
