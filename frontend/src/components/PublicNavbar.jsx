import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { useAuthStore } from '@/store/authStore'
import StudentProfileDropdown from '@/components/StudentProfileDropdown'
import AdminProfileDropdown from '@/components/AdminProfileDropdown'
import NotificationDropdown from '@/components/NotificationDropdown'

export default function PublicNavbar({ onOpenAuth, view, setView }) {
  const { isAuthenticated: isStudentAuth } = useMemberAuthStore()
  const { isAuthenticated: isLibAuth } = useAuthStore()
  
  const isAuthenticated = isStudentAuth || isLibAuth
  const libraryName = 'Wisdom Hall Thal University Bhakkar'

  const handleNavClick = (e, targetId, targetView) => {
    if (setView && targetView) {
      e.preventDefault()
      setView(targetView)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (targetId) {
      if (location.pathname === '/landing' || location.pathname === '/') {
        e.preventDefault()
        const element = document.getElementById(targetId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm fixed top-0 left-0 right-0 z-50 transition-all border-b-2" style={{ borderColor: '#E76800' }}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Link to="/landing" onClick={(e) => handleNavClick(e, null, 'landing')} className="flex items-center">
            <img src="/Images/Logo.png" alt={libraryName} className="h-10 w-auto object-contain" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link 
            to="/landing" 
            onClick={(e) => handleNavClick(e, null, 'landing')} 
            className={`transition-colors font-bold ${view === 'landing' ? 'text-[#E76800]' : 'text-slate-600 hover:text-[#E76800]'}`}
          >
            Home
          </Link>
          
          <a 
            href="/landing#books" 
            onClick={(e) => handleNavClick(e, 'books')}
            className="text-slate-600 hover:text-[#E76800] transition-colors font-bold"
          >
            Books Collection
          </a>

          {isAuthenticated && (
            <Link 
              to={isLibAuth ? "/admin" : "/student/dashboard"}
              className={`transition-colors font-bold ${view === 'dashboard' ? 'text-[#E76800]' : 'text-slate-600 hover:text-[#E76800]'}`}
            >
              Dashboard
            </Link>
          )}
          
          <a 
            href="/landing#actions" 
            onClick={(e) => handleNavClick(e, 'actions')}
            className="text-slate-600 hover:text-[#E76800] transition-colors font-bold"
          >
            Our Services
          </a>
          
          <a 
            href="/landing#contact" 
            onClick={(e) => handleNavClick(e, 'contact')}
            className="text-slate-600 hover:text-[#E76800] transition-colors font-bold"
          >
            Contact Us
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {isStudentAuth && <NotificationDropdown />}
              <div className="h-8 w-[1px] bg-slate-100 mx-1 hidden sm:block"></div>
              {isStudentAuth ? (
                <StudentProfileDropdown />
              ) : (
                <AdminProfileDropdown />
              )}
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenAuth('login')} className="px-5 text-[#011039] hover:bg-[#011039]/5 font-extrabold">Login</Button>
              <Button variant="primary" onClick={() => onOpenAuth('signup')} className="px-6 rounded-lg shadow-md font-extrabold shadow-orange-500/20">Signup</Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
