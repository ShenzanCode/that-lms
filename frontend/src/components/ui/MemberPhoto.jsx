import { useState } from 'react'
import { User } from 'lucide-react'

export function MemberPhoto({ src, alt, className = '', size = 'md', round = true }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  // Get base URL for images - images are served from the root server, not the API path
  const baseUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http') 
    ? import.meta.env.VITE_API_URL 
    : window.location.origin
  
  // Remove /api from baseUrl for image serving since images are served from root
  const imageBaseUrl = baseUrl.replace('/api', '')

  const containerClasses = `${sizeClasses[size]} ${className} ${round ? 'rounded-full' : 'rounded-md'} bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden relative`

  // Show default icon if no src or if image failed to load
  if (!src || imageError) {
    return (
      <div className={containerClasses}>
        <User className={`${iconSizes[size]}`} style={{color: '#E76800'}} />
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
        </div>
      )}
      <img
        src={src.startsWith('http') ? src : `${imageBaseUrl}${src.startsWith('/') ? src : `/${src}`}`}
        alt={alt}
        className={`w-full h-full object-cover ${round ? 'rounded-full' : 'rounded-md'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ display: imageLoading ? 'none' : 'block' }}
      />
    </div>
  )
}