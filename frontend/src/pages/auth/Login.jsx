import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import Logo from '/Images/Logo.png'

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      const { token, ...userData } = data.data
      login(userData, token)
      toast.success('Login successful!')
      navigate('/')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Login failed')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.username || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }
    loginMutation.mutate(formData)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <Card className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <img src={Logo} alt="Library Logo" className="h-20 w-auto" />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{color: '#011039'}}>
          Library Management System
        </h1>
        <p style={{color: '#011039'}}>Sign in to manage your library</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              className="input pl-10"
              required
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="input pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={loginMutation.isPending}
        >
          Sign In
        </Button>
      </form>

      {/* Student Portal Link */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 mb-2">Are you a student?</p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/student/login')}
        >
          Student Portal Login
        </Button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p>
        <p className="text-xs text-blue-700">Username: <span className="font-mono">admin</span></p>
        <p className="text-xs text-blue-700">Password: <span className="font-mono">admin123</span></p>
      </div>
    </Card>
  )
}
