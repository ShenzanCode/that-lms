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
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Books', path: '/books', icon: BookOpen },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Pending Approvals', path: '/members/pending', icon: User },
    { name: 'Issue Book', path: '/transactions/issue', icon: BookCheck },
    { name: 'Return Book', path: '/transactions/return', icon: BookX },
    { name: 'Issued Books', path: '/transactions/issued', icon: BookMarked },
    { name: 'Reservations', path: '/reservations', icon: Clock },
    { name: 'Fines', path: '/fines', icon: DollarSign },
    { name: 'Live Chat Support', path: '/live-chat', icon: MessageCircle },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => {
    // Handle dashboard route
    if (path === '/') return location.pathname === '/'
    
    // Exact match always wins
    if (location.pathname === path) return true
    
    // Prevent false positives for similar paths
    const currentPath = location.pathname
    
    // Don't highlight "/members" when on "/members/pending"  
    if (path === '/members' && currentPath.startsWith('/members/')) return false
    
    // Don't highlight "/transactions/issue" when on "/transactions/issued"
    if (path === '/transactions/issue' && currentPath === '/transactions/issued') return false
    
    // For other nested routes, allow parent highlighting
    if (currentPath.startsWith(path + '/')) return true
    
    return false
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
              alt={libraryName} 
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
          
          {/* Notification Icon */}
          <div className="flex items-center gap-4">
            <AdminNotificationDropdown />
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

          {/* Admin Profile Header */}
          <div className="p-4 relative" ref={adminMenuRef} style={{borderTop: '1px solid rgba(255,255,255,0.1)'}}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" style={{backgroundColor: '#E76800'}}>
                {user?.photo ? (
                  <img src={`http://localhost:5000${user.photo}`} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wide">System Administrator</p>
                <p className="text-sm font-semibold text-white truncate mt-0.5">{user?.name || 'Admin'}</p>
              </div>
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <MoreVertical className="h-5 w-5 text-gray-300" />
              </button>
            </div>

            {/* Admin Dropdown Menu */}
            {showAdminMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <a
                  href="/landing.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowAdminMenu(false)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>View Landing Page</span>
                </a>
                <button
                  onClick={() => {
                    setShowAdminMenu(false)
                    navigate('/admin/profile')
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <UserCog className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowAdminMenu(false)
                    navigate('/settings')
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>System Settings</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    setShowAdminMenu(false)
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
