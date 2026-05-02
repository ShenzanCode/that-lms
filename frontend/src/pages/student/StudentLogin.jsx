import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { studentAuthService } from '../../services/studentAuthService'
import { useMemberAuthStore } from '../../store/memberAuthStore'
import Logo from '/Images/Logo.png'

export default function StudentLogin() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useMemberAuthStore()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password')
      return
    }

    setLoading(true)
    try {
      const response = await studentAuthService.login(formData)
      const { token, data: student } = response

      // Store authentication data (even if blocked - they need to see blocked page)
      login(student, token)

      // Check if account is blocked - redirect to blocked page
      if (student.isBlocked) {
        navigate('/student/blocked', { replace: true })
        return
      }

      // Redirect based on student status and profile completion
      if (!student.profileCompleted) {
        navigate('/student/profile-setup')
      } else if (student.registrationStatus === 'pending') {
        navigate('/student/pending')
      } else if (student.registrationStatus === 'rejected') {
        navigate('/student/rejected')
      } else if (student.registrationStatus === 'approved') {
        navigate('/student/dashboard')
      } else {
        // Default fallback
        navigate('/student/profile-setup')
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      style={{
        background: 'linear-gradient(135deg, rgba(1, 16, 57, 0.05) 0%, rgba(231, 104, 0, 0.03) 50%, rgba(1, 16, 57, 0.08) 100%)',
        backgroundColor: '#F8F9FA'
      }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={Logo} alt="Library Logo" className="h-20 w-auto" />
            </div>
            <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Student Login</h1>
            <p className="text-gray-600 mt-2">Welcome back! Please login to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#011039'}}>
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#011039'}}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 rounded-md text-white font-medium"
              disabled={loading}
              style={{backgroundColor: '#E76800'}}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/student/register" className="font-medium hover:underline" style={{color: '#E76800'}}>
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
