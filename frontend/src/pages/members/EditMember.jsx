import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, X, Calendar, User } from 'lucide-react'
import { memberService } from '@/services/memberService'
import { MemberPhoto } from '@/components/ui/MemberPhoto'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import toast from 'react-hot-toast'

export default function EditMember() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [newPhotoSelected, setNewPhotoSelected] = useState(false)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [originalPhoto, setOriginalPhoto] = useState(null)
  const [formData, setFormData] = useState({
    memberId: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    memberType: 'Student',
    year: '',
    course: '',
    address: '',
    validUntil: '',

    notes: '',
    photo: null,
  })

  // Fetch member data
  const { data: memberData, isLoading: isLoadingMember } = useQuery({
    queryKey: ['member', id],
    queryFn: () => memberService.getMember(id),
    onError: (error) => {
      toast.error('Failed to load member data')
      navigate('/members')
    },
  })

  // Initialize form data when member data is loaded
  useEffect(() => {
    if (memberData?.data) {
      const member = memberData.data
      setFormData({
        memberId: member.memberId || '',
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        department: member.department || '',
        memberType: member.memberType || 'Student',
        year: member.year || '',
        course: member.course || '',
        address: member.address || '',
        validUntil: member.validUntil ? new Date(member.validUntil).toISOString().split('T')[0] : '',

        notes: member.notes || '',
        photo: null,
      })
      if (member.photo) {
        const photoUrl = `http://localhost:5000${member.photo}`
        setOriginalPhoto(photoUrl)
        setPhotoPreview(photoUrl)
      }
    }
  }, [memberData])

  const updateMemberMutation = useMutation({
    mutationFn: (data) => memberService.updateMember(id, data),
    onSuccess: () => {
      toast.success('Member updated successfully!')
      navigate(`/members/${id}`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update member')
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }
      
      // Auto-set borrowing limit based on member type
      if (name === 'memberType') {
        // The backend will automatically set the borrowing limit based on system settings
        // when member type changes, so we don't need to do anything here
        console.log(`Member type changed to: ${value}`);
      }
      
      return newData
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      setFormData((prev) => ({ ...prev, photo: file }))
      setPhotoPreview(URL.createObjectURL(file))
      setNewPhotoSelected(true)
      setRemovePhoto(false)
    }
  }

  const handleRemovePhoto = () => {
    // If new photo was selected, just clear it and show original
    if (newPhotoSelected) {
      setFormData((prev) => ({ ...prev, photo: null }))
      setNewPhotoSelected(false)
      setPhotoPreview(originalPhoto)
    } else {
      // If showing original, mark it for removal
      setRemovePhoto(true)
      setPhotoPreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Create FormData for multipart/form-data
    const data = new FormData()
    Object.keys(formData).forEach((key) => {
      if (key === 'photo' && formData[key] === null) {
        return // Skip if no new photo is selected
      }
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key])
      }
    })

    // Add flag to remove photo if user clicked remove
    if (removePhoto) {
      data.append('removePhoto', 'true')
    }

    updateMemberMutation.mutate(data)
  }

  if (isLoadingMember) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/members/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Edit Member</h1>
          <p className="text-gray-600 mt-1">Update member information</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <div className="p-6 space-y-6">
            {/* Photo Upload */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Member Photo
              </label>
              {!photoPreview ? (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              ) : (
                <div className="relative w-48 h-48 mx-auto">
                  <MemberPhoto
                    src={photoPreview}
                    alt="Photo preview"
                    size="xl"
                    round={false}
                    className="w-48 h-48"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 p-1 bg-danger-500 text-white rounded-full hover:bg-danger-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg">
                    {newPhotoSelected ? 'New photo selected' : 'Current photo'}
                  </div>
                </div>
              )}
              {photoPreview && !newPhotoSelected && (
                <div className="mt-2">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <span className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors">
                      Change Photo
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Member ID"
                  name="memberId"
                  value={formData.memberId}
                  onChange={handleChange}
                  placeholder="e.g., MEM001"
                  required
                />
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="member@example.com"
                  required
                />
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  required
                />
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Member Type <span className="text-danger-500 ml-1">*</span>
                  </label>
                  <select
                    name="memberType"
                    value={formData.memberType}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
                <Input
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  required
                />
                {formData.memberType === 'Student' && (
                  <>
                    <Input
                      label="Course"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      placeholder="e.g., B.Tech, M.Sc"
                    />
                    <Input
                      label="Year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      placeholder="e.g., 1st Year, 2024"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Membership Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Valid Until <span className="text-danger-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="validUntil"
                      value={formData.validUntil}
                      onChange={handleChange}
                      className="input"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="input"
                    placeholder="Enter full address..."
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="input"
                    placeholder="Any additional notes or remarks..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/members/${id}`)}
              disabled={updateMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={updateMemberMutation.isPending}
              disabled={updateMemberMutation.isPending}
            >
              Update Member
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
