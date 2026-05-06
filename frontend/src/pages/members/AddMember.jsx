import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, X, Calendar } from 'lucide-react'
import { memberService } from '@/services/memberService'
import { MemberPhoto } from '@/components/ui/MemberPhoto'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function AddMember() {
  const navigate = useNavigate()
  const [photoPreview, setPhotoPreview] = useState(null)
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

  const createMemberMutation = useMutation({
    mutationFn: memberService.createMember,
    onSuccess: () => {
      toast.success('Member added successfully!')
      navigate('/admin/members')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add member')
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }
      
      // Auto-set borrowing limit based on member type
      if (name === 'memberType') {

      }
      
      return newData
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      setFormData((prev) => ({ ...prev, photo: file }))
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }))
    setPhotoPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate validUntil date
    if (!formData.validUntil) {
      toast.error('Please select membership validity date')
      return
    }

    // Create FormData for multipart/form-data
    const data = new FormData()
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key])
      }
    })

    createMemberMutation.mutate(data)
  }

  // Set default validity date (1 year from today)
  useState(() => {
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    setFormData((prev) => ({
      ...prev,
      validUntil: oneYearFromNow.toISOString().split('T')[0],
    }))
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/members')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Add New Member</h1>
          <p className="text-gray-600 mt-1">Register a new library member</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <div className="p-6 space-y-6">
            {/* Photo Upload */}
            <div>
              <label className="block mb-2 text-sm font-bold text-gray-700">
                Member Photo
              </label>
              {!photoPreview ? (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-bold">Click to upload</span>
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <input
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
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-bold mb-4" style={{color: '#011039'}}>Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Member ID"
                  name="memberId"
                  value={formData.memberId}
                  onChange={handleChange}
                  placeholder="e.g., MEM001 or STU2024001"
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
              <h3 className="text-lg font-bold mb-4" style={{color: '#011039'}}>Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-bold text-gray-700">
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
              <h3 className="text-lg font-bold mb-4" style={{color: '#011039'}}>Membership Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-bold text-gray-700">
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
              <h3 className="text-lg font-bold mb-4" style={{color: '#011039'}}>Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm font-bold text-gray-700">
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
                  <label className="block mb-1.5 text-sm font-bold text-gray-700">
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
              onClick={() => navigate('/admin/members')}
              disabled={createMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMemberMutation.isPending}
              disabled={createMemberMutation.isPending}
            >
              Add Member
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
