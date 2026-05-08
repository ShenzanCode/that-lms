import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { useAuthStore } from '@/store/authStore'
import StudentProfileDropdown from '@/components/StudentProfileDropdown'
import AdminProfileDropdown from '@/components/AdminProfileDropdown'
import NotificationDropdown from '@/components/NotificationDropdown'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function PublicNavbar({ onOpenAuth, view, setView }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated: isStudentAuth } = useMemberAuthStore()
  const { isAuthenticated: isLibAuth } = useAuthStore()
  const location = useLocation()
  
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
    setMobileMenuOpen(false)
  }

  const navLinks = [
    { label: 'Home', target: 'landing', href: '/landing' },
    { label: 'Books Collection', targetId: 'books', href: '/landing#books' },
    ...(isAuthenticated ? [{ label: 'Dashboard', target: 'dashboard', href: isLibAuth ? '/admin' : '/student/dashboard' }] : []),
    { label: 'Our Services', targetId: 'actions', href: '/landing#actions' },
    { label: 'Contact Us', targetId: 'contact', href: '/landing#contact' },
  ]

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm fixed top-0 left-0 right-0 z-50 transition-all border-b-2 border-primary">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-8 max-w-7xl mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/landing" onClick={(e) => handleNavClick(e, null, 'landing')} className="flex items-center">
            <img src="/Images/Logo.png" alt={libraryName} className="h-8 sm:h-10 w-auto object-contain" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-8 text-[11px] lg:text-[13px] font-black uppercase tracking-widest">
          {navLinks.map((link, idx) => (
            <Link 
              key={idx}
              to={link.href}
              onClick={(e) => handleNavClick(e, link.targetId, link.target)}
              className={`transition-all duration-300 ${(link.target && view === link.target) || (link.targetId && location.hash === `#${link.targetId}`) ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {isStudentAuth && <div className="hidden sm:block"><NotificationDropdown /></div>}
              <div className="h-6 sm:h-8 w-[1px] bg-slate-100 mx-1 hidden sm:block"></div>
              {isStudentAuth ? (
                <StudentProfileDropdown />
              ) : (
                <AdminProfileDropdown />
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" onClick={() => onOpenAuth('login')} className="px-4 sm:px-6 h-8 sm:h-10 text-secondary hover:bg-secondary/5 font-black uppercase tracking-widest text-[9px] sm:text-[11px] rounded-md transition-all active:scale-[0.98]">Login</Button>
              <Button variant="primary" onClick={() => onOpenAuth('signup')} className="px-4 sm:px-7 h-8 sm:h-10 rounded-md shadow-lg shadow-orange-500/20 font-black uppercase tracking-widest text-[9px] sm:text-[11px] transition-all active:scale-[0.98]">Signup</Button>
            </div>
          )}
          
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 text-secondary hover:text-primary transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary bg-white/98 backdrop-blur-sm">
          <nav className="flex flex-col py-3 px-3 space-y-1 max-h-[calc(100vh-60px)] overflow-y-auto">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.href}
                onClick={(e) => handleNavClick(e, link.targetId, link.target)}
                className={`block px-4 py-2 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${(link.target && view === link.target) || (link.targetId && location.hash === `#${link.targetId}`) ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {link.label}
              </Link>
            ))}
            
            {!isAuthenticated && (
              <div className="border-t border-slate-100 mt-3 pt-3 flex flex-col gap-2">
                <Button 
                  variant="ghost" 
                  onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false) }} 
                  className="w-full h-9 text-secondary hover:bg-secondary/5 font-black uppercase tracking-widest text-xs rounded-md transition-all"
                >
                  Login
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => { onOpenAuth('signup'); setMobileMenuOpen(false) }} 
                  className="w-full h-9 rounded-md shadow-lg shadow-orange-500/20 font-black uppercase tracking-widest text-xs transition-all"
                >
                  Signup
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
