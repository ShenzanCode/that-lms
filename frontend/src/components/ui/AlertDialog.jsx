import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent } from './Card'
import { Button } from './Button'

const AlertDialog = ({
  isOpen,
  onClose,
  title = 'Information',
  message,
  buttonText = 'OK',
  type = 'info', // 'info', 'warning', 'danger', 'success'
}) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="h-12 w-12 sm:h-14 sm:w-14" style={{color: '#DC3545'}} />
      case 'warning':
        return <AlertTriangle className="h-12 w-12 sm:h-14 sm:w-14" style={{color: '#FFC107'}} />
      case 'success':
        return <CheckCircle className="h-12 w-12 sm:h-14 sm:w-14" style={{color: '#28A745'}} />
      default:
        return <Info className="h-12 w-12 sm:h-14 sm:w-14" style={{color: '#011039'}} />
    }
  }

  const getIconBgColor = () => {
    switch (type) {
      case 'danger':
        return '#DC354515'
      case 'warning':
        return '#FFC10715'
      case 'success':
        return '#28A74515'
      default:
        return '#01103915'
    }
  }

  const getButtonStyle = () => {
    switch (type) {
      case 'danger':
        return { backgroundColor: '#DC3545' }
      case 'warning':
        return { backgroundColor: '#FFC107', color: '#000' }
      case 'success':
        return { backgroundColor: '#28A745' }
      default:
        return { backgroundColor: '#E76800' }
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-sm sm:max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b">
            <h2 className="text-lg sm:text-xl font-bold" style={{color: '#011039'}}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 sm:px-6 py-6 sm:py-8">
            {/* Icon */}
            <div className="flex justify-center mb-5 sm:mb-6">
              <div 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center"
                style={{backgroundColor: getIconBgColor()}}
              >
                {getIcon()}
              </div>
            </div>

            {/* Message */}
            <div className="text-center mb-6 sm:mb-8">
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>

            {/* Action Button */}
            <Button
              onClick={onClose}
              className="w-full text-sm sm:text-base"
              style={getButtonStyle()}
            >
              {buttonText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AlertDialog
