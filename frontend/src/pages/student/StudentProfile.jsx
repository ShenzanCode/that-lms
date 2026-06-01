import { useState, useEffect } from 'react'
import { getServerRoot } from '@/lib/server'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { studentAuthService } from '@/services/studentAuthService'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { User, Camera, ArrowLeft, BookOpen, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentProfile() {
  const navigate = useNavigate()
  const { student, updateStudent } = useMemberAuthStore()
  const [loading, setLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    year: '',
    course: '',
    address: ''
  })
  const [photo, setPhoto] = useState(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        phone: student.phone || '',
        department: student.department || '',
        year: student.semester || student.year || '',
        course: student.subject || student.course || '',
        address: student.address || ''
      })
      if (student.photo) {
        const root = getServerRoot()
        const photoUrl = student.photo.startsWith('http') 
          ? student.photo 
          : `${root}${student.photo.startsWith('/') ? student.photo : '/' + student.photo}`
        setPhotoPreview(photoUrl)
      }
    }
  }, [student])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB')
        return
      }
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
      setRemovePhoto(false)
      if (error) setError('')
    }
  }

  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    setPhoto(null)
    setRemovePhoto(true)
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return false
    }
    if (!formData.department.trim()) {
      setError('Department is required')
      return false
    }
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setLoading(true)
    try {
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('phone', formData.phone)
      submitData.append('department', formData.department)
      submitData.append('year', formData.year)
      submitData.append('course', formData.course)
      submitData.append('address', formData.address)
      
      if (photo) {
        submitData.append('photo', photo)
      }
      
      if (removePhoto) {
        submitData.append('removePhoto', 'true')
      }

      const response = await studentAuthService.updateProfile(submitData)
      
      // Update student data in store
      updateStudent(response.data)
      
      toast.success('Profile updated successfully')
      navigate('/student/dashboard')
    } catch (error) {
      setError(error.response?.data?.message || 'Profile update failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Edit Profile</h1>
          <p className="text-gray-600 mt-1">Update your profile information</p>
        </div>
        <Button
          onClick={() => navigate('/student/dashboard')}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b" style={{backgroundColor: '#F9FAFB'}}>
          <CardTitle style={{color: '#011039'}}>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="flex flex-col items-center py-6 px-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-dashed border-gray-200 hover:border-orange-300 transition-colors">
              <div className="relative mb-4">
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="w-40 h-40 rounded-full object-cover border-4 shadow-xl"
                      style={{borderColor: '#E76800'}}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = ''
                        setPhotoPreview(null)
                      }}
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
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform"
                  style={{backgroundColor: '#011039'}}
                  title="Upload Photo"
                >
                  <Camera className="h-6 w-6 text-white" />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold mb-1" style={{color: '#011039'}}>Profile Photo</p>
                <p className="text-xs" style={{color: '#6B7280'}}>Click the camera icon to upload</p>
                <p className="text-xs" style={{color: '#E76800'}}>Max size: 5MB • JPG, PNG</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-bold mb-4 flex items-center" style={{color: '#011039'}}>
                  <User className="h-4 w-4 mr-2" style={{color: '#E76800'}} />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{color: '#011039'}}>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{color: '#011039'}}>
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="10-digit phone number"
                      maxLength="10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-bold mb-4 flex items-center" style={{color: '#011039'}}>
                  <BookOpen className="h-4 w-4 mr-2" style={{color: '#E76800'}} />
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{color: '#011039'}}>
                      Department <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="e.g., Computer Science"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{color: '#011039'}}>
                      Year/Semester
                    </label>
                    <input
                      type="text"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="e.g., 8th Semester"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2" style={{color: '#011039'}}>
                      Course/Program
                    </label>
                    <input
                      type="text"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="e.g., BSSE, B.Tech CS"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{color: '#011039'}}>
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                  placeholder="Enter your complete address"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 text-base font-bold"
                style={{backgroundColor: '#E76800', color: 'white'}}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Updating...</span>
                  </span>
                ) : (
                  'Update Profile'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/student/dashboard')}
                disabled={loading}
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
