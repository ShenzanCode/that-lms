import { Clock, CheckCircle, LogIn, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { studentAuthService } from '@/services/studentAuthService'
import { LoadingSpinner } from '@/components/ui/Loading'

export default function PendingApprovalPage() {
  const { student, logout } = useMemberAuthStore()
  const navigate = useNavigate()

  // Poll for status updates every 5 seconds
  const { data: updatedStudent, isLoading } = useQuery({
    queryKey: ['studentStatus', student?.id],
    queryFn: async () => {
      const response = await studentAuthService.getMe()
      return response.data
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    enabled: !!student?.id,
  })

  const handleLogout = () => {
    logout()
    navigate('/landing?auth=login&type=student')
  }

  const handleLogin = () => {
    logout()
    navigate('/landing?auth=login&type=student')
  }

  if (isLoading && !updatedStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Check current status from the polled data
  const currentStatus = updatedStudent?.registrationStatus || student?.registrationStatus
  const rejectionReason = updatedStudent?.rejectionReason || student?.rejectionReason

  // If approved, show login button
  if (currentStatus === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#F8F9FA'}}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{backgroundColor: '#D4EDDA'}}>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold mb-4" style={{color: '#011039'}}>
              Registration Approved!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Congratulations! Your registration has been approved by the library administration.
            </p>

            <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
              <p className="text-sm text-green-800">
                You can now login to access the full student dashboard with all features including book browsing, reservations, and more.
              </p>
            </div>

            <Button
              onClick={handleLogin}
              variant="primary"
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login Now
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If rejected, show in this component instead of redirecting
  if (currentStatus === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#F8F9FA'}}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{backgroundColor: '#FFE5E5'}}>
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold mb-4" style={{color: '#011039'}}>
              Registration Rejected
            </h1>
            
            <p className="text-gray-600 mb-6">
              Unfortunately, your registration has been rejected by the library administration.
            </p>

            {rejectionReason && (
              <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
                <div className="flex items-start gap-3 text-left">
                  <AlertTriangle className="h-5 w-5 mt-0.5 text-red-500" />
                  <div>
                    <p className="font-bold text-red-900">Rejection Reason:</p>
                    <p className="text-sm text-red-700 mt-1">
                      {rejectionReason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => navigate('/student/profile-setup')}
                variant="primary"
                className="w-full"
              >
                Update Profile & Resubmit
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Still pending
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#F8F9FA'}}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{backgroundColor: '#FFF3CD'}}>
            <Clock className="h-10 w-10" style={{color: '#E76800'}} />
          </div>
          
          <h1 className="text-2xl font-bold mb-4" style={{color: '#011039'}}>
            Pending Approval
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your profile has been submitted successfully and is currently under review by the library administration.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3 text-left">
              <CheckCircle className="h-5 w-5 mt-0.5" style={{color: '#E76800'}} />
              <div>
                <p className="font-bold" style={{color: '#011039'}}>What happens next?</p>
                <p className="text-sm text-gray-600 mt-1">
                  The librarian will review your information and either approve or reject your registration.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  This page will automatically update when your status changes.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Please wait or contact the library administration for more information.
          </p>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
