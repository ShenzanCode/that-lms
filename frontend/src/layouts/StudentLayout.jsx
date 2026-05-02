import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { studentAuthService } from '@/services/studentAuthService'
import { settingsService } from '@/services/settingsService'
import LiveChatButton from '@/components/LiveChatButton'
import PublicNavbar from '@/components/PublicNavbar'
import { useState } from 'react'

export default function StudentLayout() {
  const [liveChatEnabled, setLiveChatEnabled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, updateStudent } = useMemberAuthStore()

  // Fetch library settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsService.getSettings()
        if (response.success && response.data) {
          if (response.data.liveChat) {
            setLiveChatEnabled(response.data.liveChat.enabled)
          }
        }
      } catch (error) {
        console.error('Error fetching library settings:', error)
      }
    }
    
    fetchSettings()
  }, [])

  // Check student status periodically
  useEffect(() => {
    const checkStudentStatus = async () => {
      try {
        const response = await studentAuthService.getMe()
        const updatedStudent = response.data
        
        // Update student data in store
        updateStudent(updatedStudent)
        
        // If student is blocked, redirect to blocked page (but keep them authenticated)
        if (updatedStudent.isBlocked && location.pathname !== '/student/blocked') {
          navigate('/student/blocked', { replace: true })
        }
        
        // If student was unblocked, redirect to dashboard
        if (!updatedStudent.isBlocked && location.pathname === '/student/blocked') {
          navigate('/student/dashboard', { replace: true })
        }
      } catch (error) {
        // Only logout if it's a true authentication error (401)
        // Don't logout for other errors (network, 403, etc.)
        if (error.response?.status === 401) {
          console.log('Token invalid or expired, logging out')
          logout()
          navigate('/landing?auth=login&type=student', { replace: true })
        } else {
          console.error('Error checking student status:', error)
        }
      }
    }

    // Check immediately on mount
    checkStudentStatus()

    // Check every 30 seconds
    const interval = setInterval(checkStudentStatus, 30000)

    return () => clearInterval(interval)
  }, [navigate, logout, updateStudent, location.pathname])

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <PublicNavbar onOpenAuth={() => {}} />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center">
            <p className="text-slate-400 text-sm font-bold italic">
                © {new Date().getFullYear()} Wisdom Hall Thal University Bhakkar
            </p>
        </div>
      </footer>

      {/* Live Chat Button */}
      <LiveChatButton enabled={liveChatEnabled} />
    </div>
  )
}
