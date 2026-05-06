import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
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

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[calc(100vh-400px)]">
        <div>
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#011039] py-12 px-4 sm:px-8 text-white mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="/Images/Logo.png" alt="Logo" className="h-10 w-auto brightness-0 invert" />
            <h3 className="font-bold">Wisdom Hall Thal University Bhakkar</h3>
          </div>
          <div className="flex gap-6 text-sm text-slate-300">
            <Link to="/landing" className="hover:text-white transition-colors">Home</Link>
            <Link to="/catalog" className="hover:text-white transition-colors">Catalog</Link>
            <Link to="/student/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
          <p className="text-xs text-slate-400 font-bold">© {new Date().getFullYear()} Wisdom Hall Thal University Bhakkar</p>
        </div>
      </footer>

      {/* Live Chat Button */}
      <LiveChatButton enabled={liveChatEnabled} />
    </div>
  )
}
