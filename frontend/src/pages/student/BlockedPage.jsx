import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ShieldOff, Mail, LogOut, Phone, MapPin, Clock, Building2, X } from 'lucide-react'
import { settingsService } from '@/services/settingsService'

export default function BlockedPage() {
  const navigate = useNavigate()
  const { student, logout } = useMemberAuthStore()
  const [showContactModal, setShowContactModal] = useState(false)
  const [librarySettings, setLibrarySettings] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLibrarySettings()
  }, [])

  const fetchLibrarySettings = async () => {
    try {
      setLoading(true)
      const response = await settingsService.getSettings()
      setLibrarySettings(response.data)
    } catch (error) {
      console.error('Error fetching library settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/student/login')
  }

  const handleContactAdmin = () => {
    setShowContactModal(true)
  }

  return (
    <>
      <div 
        className="min-h-screen flex items-center justify-center p-3 sm:p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(1,16,57,0.05) 0%, rgba(231,104,0,0.03) 50%, rgba(1,16,57,0.08) 100%)'
        }}
      >
        <Card className="w-full max-w-sm sm:max-w-md">
          <CardContent className="p-6 sm:p-8">
            {/* Icon */}
            <div className="flex justify-center mb-5 sm:mb-6">
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
                style={{backgroundColor: '#DC354520'}}
              >
                <ShieldOff className="h-8 w-8 sm:h-10 sm:w-10" style={{color: '#DC3545'}} />
              </div>
            </div>

            {/* Message */}
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4" style={{color: '#011039'}}>
                Hi {student?.name},
              </h2>
              <p className="text-gray-700 mb-2 text-sm sm:text-base">
                Access to your account has been restricted.
              </p>
              <p className="text-gray-600 text-xs sm:text-sm">
                Please contact the administrator if you believe this is a mistake.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <Button
                onClick={handleContactAdmin}
                className="w-full text-sm sm:text-base"
                style={{backgroundColor: '#E76800'}}
                disabled={loading}
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Administrator
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full text-sm sm:text-base"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information Modal */}
      {showContactModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50"
          onClick={() => setShowContactModal(false)}
        >
          <Card 
            className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-0">
              {/* Header */}
              <div 
                className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-b"
                style={{borderColor: '#E5E7EB'}}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1" style={{color: '#011039'}}>
                      Library Contact Information
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Get in touch with the library administration
                    </p>
                  </div>
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Contact Details */}
              {librarySettings && librarySettings.libraryInfo ? (
                <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-6">
                  <div className="grid gap-4 sm:gap-5 md:gap-6">
                    {/* Library Name */}
                    {librarySettings.libraryInfo.name && (
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div 
                          className="p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0" 
                          style={{backgroundColor: '#01103915'}}
                        >
                          <Building2 className="h-5 w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6" style={{color: '#011039'}} />
                        </div>
                        <div className="flex-1 pt-0.5 sm:pt-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Library Name</p>
                          <p className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                            {librarySettings.libraryInfo.name}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Phone Number */}
                    {librarySettings.libraryInfo.phone && (
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div 
                          className="p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0" 
                          style={{backgroundColor: '#01103915'}}
                        >
                          <Phone className="h-5 w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6" style={{color: '#011039'}} />
                        </div>
                        <div className="flex-1 pt-0.5 sm:pt-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Phone Number</p>
                          <a 
                            href={`tel:${librarySettings.libraryInfo.phone}`}
                            className="text-base sm:text-lg font-semibold hover:underline transition-colors inline-flex items-center gap-2 break-all"
                            style={{color: '#E76800'}}
                          >
                            {librarySettings.libraryInfo.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Email Address */}
                    {librarySettings.libraryInfo.email && (
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div 
                          className="p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0" 
                          style={{backgroundColor: '#01103915'}}
                        >
                          <Mail className="h-5 w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6" style={{color: '#011039'}} />
                        </div>
                        <div className="flex-1 pt-0.5 sm:pt-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Email Address</p>
                          <a 
                            href={`mailto:${librarySettings.libraryInfo.email}`}
                            className="text-base sm:text-lg font-semibold hover:underline transition-colors inline-flex items-center gap-2 break-all"
                            style={{color: '#E76800'}}
                          >
                            {librarySettings.libraryInfo.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Working Hours */}
                    {librarySettings.libraryInfo.workingHours && (
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div 
                          className="p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0" 
                          style={{backgroundColor: '#01103915'}}
                        >
                          <Clock className="h-5 w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6" style={{color: '#011039'}} />
                        </div>
                        <div className="flex-1 pt-0.5 sm:pt-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Working Hours</p>
                          <p className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                            {librarySettings.libraryInfo.workingHours}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    {librarySettings.libraryInfo.address && (
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div 
                          className="p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0" 
                          style={{backgroundColor: '#01103915'}}
                        >
                          <MapPin className="h-5 w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6" style={{color: '#011039'}} />
                        </div>
                        <div className="flex-1 pt-0.5 sm:pt-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Address</p>
                          <p className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                            {librarySettings.libraryInfo.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 sm:py-14 md:py-16 px-4 sm:px-6 md:px-8">
                  <div 
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                    style={{backgroundColor: '#01103910'}}
                  >
                    <Building2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" style={{color: '#011039'}} />
                  </div>
                  <p className="text-gray-500 text-sm sm:text-base md:text-lg">
                    {loading ? 'Loading contact information...' : 'Contact information not available'}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div 
                className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-t"
                style={{backgroundColor: '#F9FAFB', borderColor: '#E5E7EB'}}
              >
                <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed">
                  Please contact the library administration to request account unblock or for any assistance.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
