import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  LogOut, 
  BookOpen, 
  BookCheck, 
  Clock, 
  DollarSign, 
  MessageSquare, 
  Bell,
  ChevronDown
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { useMemberAuthStore } from '@/store/memberAuthStore'

export default function StudentProfileDropdown() {
  const { student, logout, isAuthenticated } = useMemberAuthStore()
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

  if (!isAuthenticated || !student) return null

  function studentDisplayName(s) {
    if (!s) return 'Student'
    return s.name || s.username || 'Student'
  }

  const displayName = studentDisplayName(student)
  const userPhoto = student?.photo

  const navigation = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Book Catalog', path: '/student/catalog', icon: BookOpen },
    { name: 'My Books', path: '/student/my-books', icon: BookCheck },
    { name: 'Reservations', path: '/student/reservations', icon: Clock },
    { name: 'My Fines', path: '/student/fines', icon: DollarSign },
    { name: 'Chat History', path: '/student/chat-history', icon: MessageSquare },
    { name: 'Notifications', path: '/student/notifications', icon: Bell },
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
        className="flex items-center gap-2 p-1 pr-3 rounded-full border-2 border-slate-100 hover:border-orange-500/30 transition-all bg-white shadow-sm"
      >
        <Avatar src={userPhoto} alt={displayName} size="sm" />
        <span className="text-sm font-bold text-slate-700 hidden sm:block truncate max-w-[120px]">{displayName}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-slate-50 mb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Signed in as</p>
            <p className="text-sm font-extrabold text-[#011039] truncate">{displayName}</p>
            <p className="text-[10px] font-bold text-orange-500 uppercase mt-0.5">Student Member</p>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {navigation.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-50 mt-1 pt-1">
            <Link 
              to="/student/profile"
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <SettingsIcon className="h-4 w-4" />
              Profile Settings
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
