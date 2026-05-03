import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Mail, Lock, User, UserPlus, LogIn, ArrowRight, ShieldCheck } from 'lucide-react'
import { studentAuthService } from '@/services/studentAuthService'
import { authService } from '@/services/authService'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
export default function AuthModal({ isOpen, onClose, initialMode = 'login', initialType = 'student' }) {
  const [mode, setMode] = useState(initialMode) // 'login' or 'signup'
  const [userType, setUserType] = useState(initialType) // 'student' or 'librarian'
  const [loading, setLoading] = useState(false)

  // Update internal state when props change
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode, isOpen])

  useEffect(() => {
    setUserType(initialType)
  }, [initialType, isOpen])
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    memberType: 'Student'
  })

  const navigate = useNavigate()
  const { login: studentLogin } = useMemberAuthStore()
  const { login: adminLogin } = useAuthStore()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (userType === 'student') {
        const response = await studentAuthService.login({
          username: formData.username,
          password: formData.password
        })
        studentLogin(response.data, response.token)
        toast.success('Welcome back!')
        onClose()
        navigate('/student/dashboard')
      } else {
        const response = await authService.login({
          username: formData.username,
          password: formData.password
        })
        adminLogin(response.data, response.token)
        toast.success('Admin access granted')
        onClose()
        // Admin goes to the actual admin dashboard route
        navigate('/admin')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match')
    }
    setLoading(true)
    try {
      const response = await studentAuthService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        memberType: formData.memberType
      })
      studentLogin(response.data, response.token)
      toast.success('Account created successfully!')
      onClose()
      navigate('/student/profile-setup')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'login' ? 'Welcome Back' : 'Join Our Library'}
      size="sm"
      className="rounded-xl overflow-hidden"
    >
      <div className="flex flex-col">
        {/* Toggle Mode */}
        <div className="flex bg-slate-100 p-1.5 rounded-lg mb-8">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${
              mode === 'login' ? 'bg-white text-[#011039] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${
              mode === 'signup' ? 'bg-white text-[#011039] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* User Type Selector (Login Only) */}
        {mode === 'login' && (
          <div className="flex justify-center gap-4 mb-8">
            <button 
              onClick={() => setUserType('student')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                userType === 'student' 
                  ? 'border-[#E76800] bg-orange-50 text-[#E76800]' 
                  : 'border-slate-100 text-slate-500'
              }`}
            >
              <User className="h-4 w-4" />
              <span className="text-xs font-bold">Student</span>
            </button>
            <button 
              onClick={() => setUserType('librarian')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                userType === 'librarian' 
                  ? 'border-[#011039] bg-slate-50 text-[#011039]' 
                  : 'border-slate-100 text-slate-500'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-bold">Librarian</span>
            </button>
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 ml-1">Member Type</label>
              <select
                name="memberType"
                value={formData.memberType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-lg focus:outline-none focus:border-orange-500 transition-all font-bold text-slate-700"
              >
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 ml-1">Username</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-lg focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-300 font-medium"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@university.edu"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-lg focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-lg focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-300 font-medium"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 ml-1">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-lg focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full h-14 rounded-lg shadow-xl shadow-orange-600/20 text-lg font-bold mt-4"
            loading={loading}
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight className="h-5 w-5 ml-2" />}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-orange-600 font-bold hover:underline"
          >
            {mode === 'login' ? 'Register Now' : 'Sign In instead'}
          </button>
        </p>

        <p className="mt-6 text-[10px] text-center text-slate-400 leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy. Secured by 256-bit SSL encryption.
        </p>
      </div>
    </Modal>
  )
}
