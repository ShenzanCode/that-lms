import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { bookService } from '@/services/bookService'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function AddBook() {
  const navigate = useNavigate()
  const [coverPreview, setCoverPreview] = useState(null)
  const [formData, setFormData] = useState({
    accessionNumber: '',
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    edition: '',
    publicationYear: '',
    category: '',
    department: '',
    shelfLocation: '',
    ddcNumber: '',
    totalCopies: '1',
    availableCopies: '1',
    condition: 'Good',
    description: '',
    price: '',
    language: 'English',
    pages: '',
    coverImage: null,
  })

  const createBookMutation = useMutation({
    mutationFn: bookService.createBook,
    onSuccess: () => {
      toast.success('Book added successfully!')
      navigate('/admin/books')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add book')
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Sync available copies with total copies when total copies changes
    if (name === 'totalCopies') {
      setFormData((prev) => ({
        ...prev,
        availableCopies: value,
      }))
    }
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
      setFormData((prev) => ({ ...prev, coverImage: file }))
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveCover = () => {
    setFormData((prev) => ({ ...prev, coverImage: null }))
    setCoverPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Create FormData for multipart/form-data
    const data = new FormData()
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key])
      }
    })

    createBookMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/books')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Add New Book</h1>
          <p className="text-gray-600 mt-1">Add a new book to the library collection</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <div className="p-6 space-y-6">
            {/* Cover Image Upload */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Book Cover Image
              </label>
              {!coverPreview ? (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
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
                <div className="relative w-48 h-64">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="absolute -top-2 -right-2 p-1 bg-danger-500 text-white rounded-full hover:bg-danger-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{color: '#011039'}}>Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Sr.No (Accession Number)"
                  name="accessionNumber"
                  value={formData.accessionNumber}
                  onChange={handleChange}
                  placeholder="e.g., 3500"
                  required
                />
                <Input
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter book title"
                  required
                  className="md:col-span-2"
                />
                <Input
                  label="Author"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Enter author name"
                  required
                />
                <Input
                  label="Publisher / By Purchase"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleChange}
                  placeholder="Enter publisher or purchase info"
                />
                <Input
                  label="Edition"
                  name="edition"
                  value={formData.edition}
                  onChange={handleChange}
                  placeholder="e.g., 2nd or leave empty for '-'"
                />
              </div>
            </div>

            {/* Classification */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{color: '#011039'}}>Classification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Category <span className="text-danger-500 ml-1">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Biology">Biology</option>
                    <option value="Business">Business</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Communication and Media">Communication and Media</option>
                    <option value="Computer / Computer Science">Computer / Computer Science</option>
                    <option value="Education">Education</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="International Relations">International Relations</option>
                    <option value="Islamic Studies">Islamic Studies</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                    <option value="Physics">Physics</option>
                    <option value="Psychology">Psychology</option>
                    <option value="Social Work">Social Work</option>
                    <option value="Sociology">Sociology</option>
                    <option value="Sports Sciences">Sports Sciences</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Zoology">Zoology</option>
                  </select>
                </div>
                <Input
                  label="DDC No"
                  name="ddcNumber"
                  value={formData.ddcNumber}
                  onChange={handleChange}
                  placeholder="e.g., 005.1"
                />
                <Input
                  label="Shelf Location"
                  name="shelfLocation"
                  value={formData.shelfLocation}
                  onChange={handleChange}
                  placeholder="e.g., A-101"
                />
              </div>
            </div>

            {/* Copies and Condition */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{color: '#011039'}}>Copies & Condition</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Total Copies"
                  name="totalCopies"
                  type="number"
                  value={formData.totalCopies}
                  onChange={handleChange}
                  min="1"
                  required
                />
                <Input
                  label="Available Copies"
                  name="availableCopies"
                  type="number"
                  value={formData.availableCopies}
                  onChange={handleChange}
                  min="0"
                  max={formData.totalCopies}
                  required
                />
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{color: '#011039'}}>Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Price
                  </label>
                  <input
                    name="price"
                    type="text"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="e.g., 1500.50 or 'donated'"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter numeric price (e.g., 1500.50) or text (e.g., "donated", "gift")
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="input"
                    placeholder="Enter book description..."
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
              onClick={() => navigate('/admin/books')}
              disabled={createBookMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createBookMutation.isPending}
              disabled={createBookMutation.isPending}
            >
              Add Book
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
