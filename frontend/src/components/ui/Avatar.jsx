import { User } from 'lucide-react'

/**
 * Avatar Component
 * Displays user profile image with automatic fallback to icon
 * Handles all edge cases: null, broken URLs, loading errors
 * 
 * @param {string} src - Image URL (can be null, relative, or absolute)
 * @param {string} alt - Alt text for accessibility
 * @param {string} size - Size variant: 'sm', 'md', 'lg', 'xl'
 * @param {string} className - Additional CSS classes
 */
import { getServerRoot } from '@/lib/server'

export default function Avatar({ 
  src, 
  alt = 'User', 
  size = 'md',
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const sizeClass = sizeClasses[size] || sizeClasses.md
  const iconSize = iconSizes[size] || iconSizes.md

  // Build proper image URL
  const getImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url
    const root = getServerRoot()
    return `${root}${url.startsWith('/') ? url : '/' + url}`
  }

  const imageUrl = getImageUrl(src)

  // If no src, show fallback immediately
  if (!imageUrl) {
    return (
      <div 
        className={`${sizeClass} rounded-full flex items-center justify-center ${className}`}
        style={{backgroundColor: '#E76800'}}
      >
        <User className={`${iconSize} text-white`} />
      </div>
    )
  }

  return (
    <div 
      className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden ${className}`}
      style={{backgroundColor: '#E76800'}}
    >
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          // On error, hide image and show icon
          e.target.style.display = 'none'
          const fallback = e.target.nextSibling
          if (fallback) fallback.style.display = 'flex'
        }}
      />
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{display: 'none'}}
      >
        <User className={`${iconSize} text-white`} />
      </div>
    </div>
  )
}
