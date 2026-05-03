import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { User, Mail, Lock, Save, AlertCircle, CheckCircle, Camera, X, ArrowLeft } from 'lucide-react'

export default function AdminProfile() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(user?.photo ? `http://localhost:5000${user.photo}` : null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (data) => {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      // Update user data in store
      updateUser({
        ...user,
        name: data.data.name,
        email: data.data.email,
        username: data.data.username,
        photo: data.data.photo,
      })
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setPhotoFile(null)
      setShowPasswordFields(false)
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    },
    onError: (error) => {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      })
      // Clear message after 5 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    },
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhotoFile(file)
      setRemovePhoto(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setRemovePhoto(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    // Validate password fields if changing password
    if (showPasswordFields) {
      if (!formData.currentPassword) {
        setMessage({ type: 'error', text: 'Please enter your current password' })
        return
      }
      if (!formData.newPassword) {
        setMessage({ type: 'error', text: 'Please enter a new password' })
        return
      }
      if (formData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'New password must be at least 6 characters' })
        return
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match' })
        return
      }
    }

    // Prepare FormData for multipart upload
    const formDataToSend = new FormData()
    formDataToSend.append('name', formData.name)
    formDataToSend.append('email', formData.email)
    formDataToSend.append('username', formData.username)

    if (photoFile) {
      formDataToSend.append('adminPhoto', photoFile)
    }

    if (removePhoto) {
      formDataToSend.append('removePhoto', 'true')
    }

    if (showPasswordFields && formData.newPassword) {
      formDataToSend.append('currentPassword', formData.currentPassword)
      formDataToSend.append('newPassword', formData.newPassword)
    }

    updateProfileMutation.mutate(formDataToSend)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#011039' }}>
            Edit Profile
          </h1>
          <p className="mt-1 text-gray-600">Update your profile information</p>
        </div>
        <Button
          onClick={() => navigate('/admin')}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Profile Form */}
      <Card className="shadow-lg">
        <CardHeader className="border-b" style={{backgroundColor: '#F9FAFB'}}>
          <CardTitle style={{color: '#011039'}}>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success/Error Message */}
            {message.text && (
              <div
                className={`flex items-center gap-2 p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            {/* Profile Photo */}
            <div className="flex flex-col items-center py-6 px-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-dashed border-gray-200 hover:border-orange-300 transition-colors">
              <div className="relative mb-4">
                {photoPreview ? (
                  <>
                    <img 
                      src={photoPreview} 
                      alt="Profile" 
                      className="w-40 h-40 rounded-full object-cover border-4 shadow-xl"
                      style={{borderColor: '#E76800'}}
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors"
                      title="Remove photo"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </>
                ) : (
                  <div className="w-40 h-40 rounded-full flex items-center justify-center border-4 shadow-xl" 
                    style={{backgroundColor: '#E76800', borderColor: '#FFFFFF'}}
                  >
                    <User className="h-20 w-20 text-white" />
                  </div>
                )}
                <label
                  htmlFor="adminPhoto"
                  className="absolute bottom-0 right-0 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform"
                  style={{backgroundColor: '#011039'}}
                  title="Upload Photo"
                >
                  <Camera className="h-6 w-6 text-white" />
                  <input
                    id="adminPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold mb-1" style={{color: '#011039'}}>Profile Photo</p>
                <p className="text-xs" style={{color: '#6B7280'}}>Click the camera icon to upload</p>
                <p className="text-xs" style={{color: '#E76800'}}>Max size: 5MB • JPG, PNG, GIF</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-4 flex items-center" style={{color: '#011039'}}>
                  <User className="h-4 w-4 mr-2" style={{color: '#E76800'}} />
                  Account Information
                </h3>
                <div className="space-y-4">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#011039' }}>
                      Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Role (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#011039' }}>
                      Role
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        value={user?.role || ''}
                        disabled
                        className="pl-10 bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-4 flex items-center" style={{color: '#011039'}}>
                  <Mail className="h-4 w-4 mr-2" style={{color: '#E76800'}} />
                  Personal Information
                </h3>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#011039' }}>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#011039' }}>
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Toggle */}
            <div className="border-t pt-6">
              <button
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="text-sm font-medium hover:underline flex items-center gap-2"
                style={{ color: '#E76800' }}
              >
                <Lock className="h-4 w-4" />
                {showPasswordFields ? 'Cancel Password Change' : 'Change Password'}
              </button>
            </div>

            {/* Password Fields */}
            {showPasswordFields && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-4 flex items-center" style={{color: '#011039'}}>
                  <Lock className="h-4 w-4 mr-2" style={{color: '#E76800'}} />
                  Change Password
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#011039' }}>
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Enter current password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#011039' }}>
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Enter new password"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#011039' }}>
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="submit"
                className="flex-1 py-3 text-base font-semibold"
                style={{backgroundColor: '#E76800', color: 'white'}}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    <span>Updating...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Save className="h-4 w-4 mr-2" />
                    Update Profile
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin')}
                disabled={updateProfileMutation.isPending}
                className="px-8 py-3"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
