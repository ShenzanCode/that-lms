import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { getServerRoot } from '@/lib/server'

export function BookCover({ src, alt, className = '', size = 'md' }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const sizeClasses = {
    sm: 'w-12 h-16',
    md: 'w-16 h-20',
    lg: 'w-20 h-28',
    xl: 'w-24 h-32',
    full: 'w-full h-full'
  }

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
    full: 'w-12 h-12'
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  // Base URL for images
  const imageBaseUrl = getServerRoot()

  // Show default icon if no src or if image failed to load
  if (!src || imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center`}>
        <BookOpen className={`${iconSizes[size]}`} style={{color: '#E76800'}} />
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative overflow-hidden rounded-md border border-gray-200`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        </div>
      )}
      <img
        src={src.startsWith('http') ? src : `${imageBaseUrl}${src.startsWith('/') ? src : `/${src}`}`}
        alt={alt}
        className="w-full h-full object-cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ display: imageLoading ? 'none' : 'block' }}
      />
    </div>
  )
}