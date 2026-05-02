import { useEffect, useState } from 'react'
import { XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { useNavigate } from 'react-router-dom'
import { studentAuthService } from '@/services/studentAuthService'

export default function RejectedStatusPage() {
  const { student, logout, updateStudent } = useMemberAuthStore()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  // Fetch fresh student data when component mounts to sync the store
  useEffect(() => {
    const syncStudentData = async () => {
      try {
        const response = await studentAuthService.getMe()
        updateStudent(response.data)
      } catch (error) {
        console.error('Failed to sync student data:', error)
      }
    }
    syncStudentData()
  }, [updateStudent])

  const handleUpdateProfile = async () => {
    setIsLoading(true)
    try {
      // Fetch fresh data and update store before navigation
      const response = await studentAuthService.getMe()
      updateStudent(response.data)
      
      // Small delay to ensure store is updated
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Navigate to profile setup
      navigate('/student/profile-setup')
    } catch (error) {
      console.error('Failed to sync data:', error)
      // Navigate anyway
      navigate('/student/profile-setup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/landing?auth=login&type=student')
  }

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

          {student?.rejectionReason && (
            <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
              <div className="flex items-start gap-3 text-left">
                <AlertTriangle className="h-5 w-5 mt-0.5 text-red-500" />
                <div>
                  <p className="font-medium text-red-900">Rejection Reason:</p>
                  <p className="text-sm text-red-700 mt-1">
                    {student.rejectionReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-6">
            You can update your profile and resubmit for approval.
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleUpdateProfile}
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Update Profile & Resubmit'}
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
