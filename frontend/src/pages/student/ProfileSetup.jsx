import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { studentAuthService } from '../../services/studentAuthService'
import { useMemberAuthStore } from '../../store/memberAuthStore'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { student, updateStudent, logout } = useMemberAuthStore()
  
  // Get member type from student object
  const memberType = student?.memberType
  
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    phone: '',
    department: '',
    subject: '',
    semester: ''
  })
  const [photo, setPhoto] = useState(null)
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Preview states
  const [previewImage, setPreviewImage] = useState(null)
  const [previewType, setPreviewType] = useState(null) // 'photo' or 'document'
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [tempFile, setTempFile] = useState(null)

  // Load existing student data when component mounts
  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        rollNumber: student.rollNumber || '',
        phone: student.phone || '',
        department: student.department || '',
        subject: student.subject || '',
        semester: student.semester || ''
      })
    }
  }, [student])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB')
        return
      }
      
      // Show preview modal
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewImage(event.target.result)
        setPreviewType('photo')
        setTempFile(file)
        setShowPreviewModal(true)
      }
      reader.readAsDataURL(file)
      
      if (error) setError('')
    }
  }

  const handleDocumentChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file for the document')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Document file size must be less than 5MB')
        return
      }
      
      // Show preview modal
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewImage(event.target.result)
        setPreviewType('document')
        setTempFile(file)
        setShowPreviewModal(true)
      }
      reader.readAsDataURL(file)
      
      if (error) setError('')
    }
  }
  
  const handleUseImage = () => {
    if (previewType === 'photo') {
      setPhoto(tempFile)
    } else {
      setDocument(tempFile)
    }
    
    setShowPreviewModal(false)
    setPreviewImage(null)
    setPreviewType(null)
    setTempFile(null)
  }
  
  const handleCancelPreview = () => {
    setShowPreviewModal(false)
    setPreviewImage(null)
    setPreviewType(null)
    setTempFile(null)
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.rollNumber.trim()) {
      setError(memberType === 'Student' ? 'Roll number is required' : 'Employee ID is required')
      return false
    }
    if (!formData.department.trim()) {
      setError('Department is required')
      return false
    }
    if (!formData.subject.trim()) {
      setError(memberType === 'Student' ? 'Subject is required' : 'Designation/Subject is required')
      return false
    }
    // Only validate semester for students
    if (memberType === 'Student' && !formData.semester.trim()) {
      setError('Semester is required')
      return false
    }
    if (!photo && !student?.photo) {
      setError('Photo is required')
      return false
    }
    if (!document && !student?.document) {
      setError('Document is required')
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
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('rollNumber', formData.rollNumber)
      submitData.append('phone', formData.phone)
      submitData.append('department', formData.department)
      submitData.append('subject', formData.subject)
      
      // Only send semester for students
      if (memberType === 'Student') {
        submitData.append('semester', formData.semester)
      }
      
      if (photo) {
        submitData.append('photo', photo)
      }

      if (document) {
        submitData.append('document', document)
      }

      const response = await studentAuthService.submitProfile(submitData)
      
      // Update student data in store
      updateStudent(response.data)
      
      // Redirect to pending approval page
      navigate('/student/pending')
    } catch (error) {
      setError(error.response?.data?.message || 'Profile submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#F8F9FA'}}>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>
            Complete Your {memberType} Profile
          </h1>
          <p className="text-gray-600 mt-2">Please provide your details to complete registration</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#011039'}}>
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#011039'}}>
                {memberType === 'Student' ? 'Roll Number' : 'Employee ID'} *
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={memberType === 'Student' ? 'Enter your roll number' : 'Enter your employee ID'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#011039'}}>
                Department *
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your department"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#011039'}}>
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your phone number (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memberType === 'Student' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#011039'}}>
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., Computer Science"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#011039'}}>
                      Semester *
                    </label>
                    <input
                      type="text"
                      name="semester"
                      value={formData.semester}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., 3rd Semester"
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{color: '#011039'}}>
                    Designation/Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder={memberType === 'Faculty' ? 'e.g., Associate Professor, Computer Science' : 'e.g., Library Assistant'}
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#011039'}}>
                  Profile Photo
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    <div className="text-center">
                      {photo ? (
                        <div className="flex flex-col items-center">
                          <ImageIcon className="h-8 w-8 text-green-500 mb-2" />
                          <p className="text-sm font-medium text-gray-700">{photo.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{(photo.size / 1024).toFixed(2)} KB</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              setPhoto(null)
                            }}
                            className="mt-2 text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <X className="h-3 w-3" /> Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-700">Upload Photo</p>
                          <p className="text-xs text-gray-500 mt-1">Click to browse</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">Optional. Max 5MB. JPG, PNG, GIF</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#011039'}}>
                  Fee Challan or University Card *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="document-upload"
                    accept="image/*"
                    onChange={handleDocumentChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="document-upload"
                    className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    <div className="text-center">
                      {document ? (
                        <div className="flex flex-col items-center">
                          <ImageIcon className="h-8 w-8 text-green-500 mb-2" />
                          <p className="text-sm font-medium text-gray-700">{document.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{(document.size / 1024).toFixed(2)} KB</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              setDocument(null)
                            }}
                            className="mt-2 text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <X className="h-3 w-3" /> Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-700">Upload Document</p>
                          <p className="text-xs text-gray-500 mt-1">Click to browse</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">Required. Max 5MB. Clear image</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/student/login')
                }}
                className="flex-1 py-2 px-4 rounded-md font-medium border border-gray-300 hover:bg-gray-50"
                style={{color: '#011039'}}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 rounded-md text-white font-medium"
                disabled={loading}
                style={{backgroundColor: '#E76800'}}
              >
                {loading ? 'Submitting...' : 'Submit Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{color: '#011039'}}>
                Preview Image
              </h3>
              <button
                onClick={handleCancelPreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4 bg-gray-100 rounded-lg p-4 max-h-96 overflow-auto flex items-center justify-center">
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-80 object-contain"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelPreview}
                className="flex-1 py-2 px-4 rounded-md font-medium border border-gray-300 hover:bg-gray-50"
                style={{color: '#011039'}}
              >
                Cancel
              </button>
              <button
                onClick={handleUseImage}
                className="flex-1 py-2 px-4 rounded-md text-white font-medium"
                style={{backgroundColor: '#E76800'}}
              >
                Use This Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
