import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthModal from '@/components/AuthModal'
import { Button } from '@/components/ui/Button'

export default function StaffLogin({ role = 'librarian' }) {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setOpen(true)
  }, [role])

  const handleClose = () => {
    setOpen(false)
    // navigate back if coming from somewhere, otherwise go to landing
    if (location?.state?.from) {
      navigate(-1)
    } else {
      navigate('/landing')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-3xl font-extrabold text-[#011039] mb-3">{role === 'admin' ? 'Admin Sign In' : 'Librarian Sign In'}</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to access the administrative portal.</p>
        <div className="mb-6">
          <Button variant="primary" onClick={() => setOpen(true)} className="px-8">
            Open Sign In
          </Button>
        </div>
      </div>

      <AuthModal
        isOpen={open}
        onClose={handleClose}
        initialMode="login"
        initialType={role}
      />
    </div>
  )
}
