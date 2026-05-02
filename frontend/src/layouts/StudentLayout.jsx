import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { studentAuthService } from '@/services/studentAuthService'
import { settingsService } from '@/services/settingsService'
import Avatar from '@/components/ui/Avatar'
import NotificationDropdown from '@/components/NotificationDropdown'
import LiveChatButton from '@/components/LiveChatButton'
import {
  Menu,
  X,
  Home,
  BookOpen,
  BookCheck,
  Clock,
  DollarSign,
  LogOut,
  User,
  Bell,
  MessageSquare,
  MoreVertical,
  UserCog,
} from 'lucide-react'

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showStudentMenu, setShowStudentMenu] = useState(false)
  const [libraryName, setLibraryName] = useState('Student Portal')
  const [liveChatEnabled, setLiveChatEnabled] = useState(false)
  const studentMenuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { student, logout, updateStudent } = useMemberAuthStore()

  // Fetch library settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsService.getSettings()
        if (response.success && response.data) {
          if (response.data.libraryInfo?.name) {
            setLibraryName(response.data.libraryInfo.name)
          }
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

  // Close student menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentMenuRef.current && !studentMenuRef.current.contains(event.target)) {
        setShowStudentMenu(false)
      }
    }

    if (showStudentMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStudentMenu])

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
          navigate('/student/login', { replace: true })
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

  const navigation = [
    { name: 'Dashboard', path: '/student/dashboard', icon: Home },
    { name: 'Book Catalog', path: '/student/catalog', icon: BookOpen },
    { name: 'My Books', path: '/student/my-books', icon: BookCheck },
    { name: 'Reservations', path: '/student/reservations', icon: Clock },
    { name: 'My Fines', path: '/student/fines', icon: DollarSign },
    { name: 'Chat History', path: '/student/chat-history', icon: MessageSquare },
    { name: 'Notifications', path: '/student/notifications', icon: Bell },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F8F9FA'}}>
      {/* Top Navbar */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50" style={{borderBottom: '2px solid #E76800'}}>
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden hover:text-primary-500"
              style={{color: '#011039'}}
            >
              <Menu className="h-6 w-6" />
            </button>
            <img 
              src="/Images/Logo.png" 
              alt="Library" 
              className="h-10 w-auto object-contain"
            />
          </div>
          
          {/* Title */}
          <h1 
            className="hidden sm:block text-2xl font-extrabold tracking-wide"
            style={{
              background: 'linear-gradient(135deg, #011039 0%, #E76800 45%, #E76800 55%, #011039 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '1px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {libraryName}
          </h1>
          
          {/* User Info */}
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <span className="text-sm font-medium hidden sm:block" style={{color: '#011039'}}>
              {student?.name}
            </span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className={`fixed left-0 z-40 w-64 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{backgroundColor: '#011039', top: '64px', bottom: 0}}>
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors hover:bg-opacity-80 ${active ? 'text-white font-medium' : 'text-gray-300 hover:text-white'}`}
                  style={active ? {backgroundColor: '#E76800'} : {}}
                  onMouseEnter={(e) => {
                    if (!active) e.target.closest('a').style.backgroundColor = 'rgba(231, 104, 0, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.target.closest('a').style.backgroundColor = 'transparent'
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Student Profile Section */}
          <div className="p-4 relative" ref={studentMenuRef} style={{borderTop: '1px solid rgba(255,255,255,0.1)'}}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" style={{backgroundColor: '#E76800'}}>
                {student?.photo ? (
                  <img 
                    src={student.photo.startsWith('http://') || student.photo.startsWith('https://') || student.photo.startsWith('blob:') ? student.photo : `http://localhost:5000${student.photo}`} 
                    alt={student?.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
                    }}
                  />
                ) : (
                  <User className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Student</p>
                <p className="text-sm font-semibold text-white truncate mt-0.5">{student?.name || 'Student'}</p>
              </div>
              <button
                onClick={() => setShowStudentMenu(!showStudentMenu)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <MoreVertical className="h-5 w-5 text-gray-300" />
              </button>
            </div>

            {/* Student Dropdown Menu */}
            {showStudentMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => {
                    setShowStudentMenu(false)
                    setSidebarOpen(false)
                    navigate('/student/profile')
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <UserCog className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    setShowStudentMenu(false)
                    handleLogout()
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64" style={{paddingTop: '64px'}}>
        {/* Page Content */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Live Chat Button */}
      <LiveChatButton enabled={liveChatEnabled} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{top: '64px'}}
        ></div>
      )}
    </div>
  )
}
