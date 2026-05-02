import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  BookOpen, 
  User, 
  Calendar,
  MapPin,
  Hash,
  DollarSign,
  FileText,
  Globe,
  Package
} from 'lucide-react'
import { bookService } from '@/services/bookService'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function BookDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteModal, setDeleteModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: () => bookService.getBook(id),
    onError: () => {
      toast.error('Failed to load book details')
      navigate('/admin/books')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: bookService.deleteBook,
    onSuccess: () => {
      toast.success('Book deleted successfully')
      navigate('/admin/books')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete book')
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate(id)
    setDeleteModal(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  const book = data?.data
  if (!book) return null

  const getStatusColor = (status) => {
    const colors = {
      Available: 'success',
      'Not Available': 'warning',
      Damaged: 'danger',
      Lost: 'danger',
    }
    return colors[status] || 'default'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/books')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{color: '#011039'}}>{book.title}</h1>
            <p className="text-gray-600 mt-1">by {book.author}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/books/${id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="danger" onClick={() => setDeleteModal(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Book Cover & Quick Info */}
        <div className="space-y-6">
          {/* Book Cover */}
          <Card>
            <div className="p-6">
              {book.coverImage ? (
                <img
                  src={`http://localhost:5000${book.coverImage}`}
                  alt={book.title}
                  className="w-full h-96 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Crect fill="%23ddd" width="400" height="600"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="24"%3ENo Cover%3C/text%3E%3C/svg%3E'
                  }}
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>
          </Card>

          {/* Availability Status */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={getStatusColor(book.status)}>{book.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Copies:</span>
                  <span className="font-medium text-gray-900">{book.totalCopies}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium text-success-600">{book.availableCopies}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Issued:</span>
                  <span className="font-medium text-warning-600">
                    {book.totalCopies - book.availableCopies}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Condition:</span>
                  <Badge variant={book.condition === 'Excellent' || book.condition === 'Good' ? 'success' : 'warning'}>
                    {book.condition}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Sr.No</p>
                    <p className="font-medium text-gray-900">{book.accessionNumber || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Author</p>
                    <p className="font-medium text-gray-900">{book.author || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Edition</p>
                    <p className="font-medium text-gray-900">{book.edition || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">By Purchase</p>
                    <p className="font-medium text-gray-900">{book.publisher || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">DDC No</p>
                    <p className="font-medium text-gray-900">{book.ddcNumber || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-medium text-gray-900">
                      {(() => {
                        if (book.price) {
                          return typeof book.price === 'number' ? `Rs. ${book.price.toFixed(2)}` : book.price;
                        }
                        // Check description for acquisition text
                        const acquisitionMatch = book.description?.match(/\[Acquisition: ([^\]]+)\]/);
                        if (acquisitionMatch) {
                          return <span className="text-green-600 capitalize">{acquisitionMatch[1]}</span>;
                        }
                        return '-';
                      })()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium text-gray-900">{book.category || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Shelf Location</p>
                    <p className="font-medium text-gray-900">{book.shelfLocation || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Added Date</p>
                    <p className="font-medium text-gray-900">{format(new Date(book.addedDate), 'PPP')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Added By</p>
                    <p className="font-medium text-gray-900">{book.addedBy?.name || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{book.description || '-'}</p>
            </div>
          </Card>

          {/* Issue History */}
          {book.issueHistory && book.issueHistory.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue History</h3>
                <div className="space-y-3">
                  {book.issueHistory.map((transaction) => (
                    <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Link
                          to={`/admin/members/${transaction.memberId._id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          {transaction.memberId.name}
                        </Link>
                        <p className="text-xs text-gray-600 mt-1">
                          ID: {transaction.memberId.memberId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          {format(new Date(transaction.issueDate), 'PP')}
                        </p>
                        <Badge variant={transaction.status === 'Returned' ? 'success' : transaction.status === 'Overdue' ? 'danger' : 'warning'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Book"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{book.title}</strong>? This action cannot be undone.
          </p>
          {book.totalCopies - book.availableCopies > 0 && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
              <p className="text-sm text-warning-700">
                Warning: {book.totalCopies - book.availableCopies} cop{book.totalCopies - book.availableCopies === 1 ? 'y is' : 'ies are'} currently issued.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending}>
              Delete Book
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
