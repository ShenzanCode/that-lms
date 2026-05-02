import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  LogOut, 
  ShieldCheck,
  ChevronDown,
  User,
  Users,
  BookOpen
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/authStore'

export default function AdminProfileDropdown() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isAuthenticated || !user) return null

  const displayName = user.name || 'Admin'
  const userPhoto = user.photo

  const navigation = [
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Manage Books', path: '/admin/books', icon: BookOpen },
    { name: 'Manage Members', path: '/admin/members', icon: Users },
  ]

  const handleLogout = () => {
    setIsOpen(false)
    logout()
    navigate('/')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-3 rounded-full border-2 border-slate-100 hover:border-[#011039]/30 transition-all bg-white shadow-sm"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
            {userPhoto ? (
                <img 
                    src={userPhoto.startsWith('http') ? userPhoto : `http://localhost:5000${userPhoto}`} 
                    alt={displayName} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=011039&color=fff'
                    }}
                />
            ) : (
                <ShieldCheck className="h-4 w-4 text-[#011039]" />
            )}
        </div>
        <span className="text-sm font-bold text-slate-700 hidden sm:block truncate max-w-[120px]">{displayName}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-slate-50 mb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Administrator</p>
            <p className="text-sm font-extrabold text-[#011039] truncate">{displayName}</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase mt-0.5">{user.role || 'Librarian'}</p>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {navigation.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#011039] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-50 mt-1 pt-1">
            <Link 
              to="/admin/profile"
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#011039] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Link>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
