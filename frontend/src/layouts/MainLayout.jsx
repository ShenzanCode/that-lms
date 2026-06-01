import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { settingsService } from '@/services/settingsService'
import AdminNotificationDropdown from '@/components/AdminNotificationDropdown'
import NewChatPopup from '@/components/NewChatPopup'
import {
  Menu,
  X,
  Home,
  BookOpen,
  Users,
  BookCheck,
  BookX,
  Clock,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  BookMarked,
  User,
  MoreVertical,
  UserCog,
  MessageCircle,
} from 'lucide-react'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [libraryName, setLibraryName] = useState('Wisdom Hall')
  const adminMenuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuthStore()

  // Fetch library name from settings
  useEffect(() => {
    // Only fetch if user is authenticated and has token
    if (!user || !isAuthenticated || !user.id || !localStorage.getItem('token')) {
      return
    }

    const fetchLibraryName = async () => {
      try {
        const data = await settingsService.getSettings()
        if (data?.data?.libraryInfo?.name) {
          setLibraryName(data.data.libraryInfo.name)
        }
      } catch (error) {
        console.error('Failed to fetch library name:', error)
      }
    }
    
    // Only fetch once on component mount
    fetchLibraryName()

    // Listen for settings update event
    const handleSettingsUpdate = () => {
      fetchLibraryName()
    }
    window.addEventListener('settingsUpdated', handleSettingsUpdate)
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate)
    }
  }, [user, isAuthenticated]) // Depend on both user and isAuthenticated

  // Close admin menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setShowAdminMenu(false)
      }
    }

    if (showAdminMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAdminMenu])

  const navigation = [
    { name: 'Dashboard', path: '/admin', icon: Home },
    { name: 'Books', path: '/admin/books', icon: BookOpen },
    { name: 'Members', path: '/admin/members', icon: Users },
    { name: 'Pending Approvals', path: '/admin/members/pending', icon: User },
    { name: 'Issue Book', path: '/admin/transactions/issue', icon: BookCheck },
    { name: 'Return Book', path: '/admin/transactions/return', icon: BookX },
    { name: 'Issued Books', path: '/admin/transactions/issued', icon: BookMarked },
    { name: 'Reservations', path: '/admin/reservations', icon: Clock },
    { name: 'Fines', path: '/admin/fines', icon: DollarSign },
    { name: 'Live Chat Support', path: '/admin/live-chat', icon: MessageCircle },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Staff', path: '/admin/staff', icon: UserCog },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin' || location.pathname === '/admin/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm fixed top-0 left-0 right-0 z-50 border-b-2 border-primary">
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6">
          {/* Logo Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-secondary hover:text-primary transition-colors p-1"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <Link to="/admin" className="flex items-center">
              <img 
                src="/Images/Logo.png" 
                alt={libraryName} 
                className="h-8 sm:h-10 w-auto object-contain"
              />
            </Link>
          </div>
          
          {/* Title */}
          <h1 
            className="hidden sm:block text-lg sm:text-2xl font-extrabold tracking-wide flex-1 text-center mx-4 truncate"
            style={{
              background: 'linear-gradient(135deg, #011039 0%, #E76800 45%, #E76800 55%, #011039 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '1px'
            }}
          >
            {libraryName}
          </h1>
          
          {/* Notification Icon */}
          <div className="flex items-center gap-2 sm:gap-4">
            <AdminNotificationDropdown />
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className={`fixed left-0 z-40 w-56 sm:w-64 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 bg-secondary overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ top: '64px', maxHeight: 'calc(100vh - 64px)' }}>
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 sm:py-6 px-2 sm:px-3">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-md mb-1 sm:mb-2 transition-all group text-xs sm:text-sm ${active ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-primary transition-colors'}`} />
                  <span className="font-bold truncate">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Admin Profile Header */}
          <div className="p-2 sm:p-4 relative" ref={adminMenuRef} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-md bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-primary shadow-inner">
                {user?.photo ? (
                  <img src={`http://localhost:5000${user.photo}`} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest">Administrator</p>
                <p className="text-xs sm:text-sm font-bold text-white truncate">{user?.name || 'Admin'}</p>
              </div>
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all flex-shrink-0"
              >
                <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>

            {/* Admin Dropdown Menu */}
            {showAdminMenu && (
              <div className="absolute bottom-full left-2 sm:left-4 right-2 sm:right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => {
                    setShowAdminMenu(false)
                    navigate('/admin/profile')
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <UserCog className="h-4 w-4 flex-shrink-0" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowAdminMenu(false)
                    navigate('/admin/settings')
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Settings className="h-4 w-4 flex-shrink-0" />
                  <span>System Settings</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    setShowAdminMenu(false)
                    handleLogout()
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 pt-14 sm:pt-16">
        {/* Page Content */}
        <main className="p-3 sm:p-4 md:p-6 max-w-full">
          <Outlet />
        </main>
      </div>

      {/* New Chat Popup for Admins */}
      <NewChatPopup />

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
