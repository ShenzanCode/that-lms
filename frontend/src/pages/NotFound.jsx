import { Link } from 'react-router-dom'
import { Home, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { useAuthStore } from '@/store/authStore'

export default function NotFound() {
  const { isAuthenticated: isStudentAuth } = useMemberAuthStore()
  const { isAuthenticated: isLibAuth } = useAuthStore()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-[150px] font-black leading-none" style={{color: '#E76800'}}>404</h1>
        <div className="h-2 w-24 bg-[#011039] mx-auto -mt-4 mb-8 rounded-full"></div>
        
        <h2 className="text-3xl font-extrabold mb-4" style={{color: '#011039'}}>Lost in the Stacks?</h2>
        <p className="text-slate-500 mb-10 text-lg">
          The page you are looking for has been moved or doesn't exist in our library archives.
        </p>
        
        <div className="flex flex-col gap-3">
          {isStudentAuth && (
            <Link to="/student/dashboard" className="w-full">
              <Button variant="primary" className="w-full h-12 rounded-md shadow-lg shadow-orange-500/20">
                <LayoutDashboard className="h-5 w-5" />
                Go to Student Dashboard
              </Button>
            </Link>
          )}

          {isLibAuth && (
            <Link to="/admin" className="w-full">
              <Button variant="primary" className="w-full h-12 rounded-md shadow-lg shadow-blue-500/20" style={{ backgroundColor: '#011039' }}>
                <ShieldCheck className="h-5 w-5" />
                Go to Admin Panel
              </Button>
            </Link>
          )}

          <Link to="/landing" className="w-full">
            <Button variant="outline" className="w-full h-12 rounded-md hover:bg-slate-50 transition-all font-bold">
              <Home className="h-5 w-5" />
              Return to Website
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
