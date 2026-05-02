import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SearchBar } from '@/components/ui/SearchBar'
import { Pagination } from '@/components/ui/Pagination'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { bookService } from '@/services/bookService'
import { reservationService } from '@/services/reservationService'
import { BookOpen, Search, Filter, X, Calendar, Hash, User, BookmarkIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentCatalog() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)
  const [showBookModal, setShowBookModal] = useState(false)
  const [reserving, setReserving] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    status: ''
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 when searching
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['student-books', page, debouncedSearch, filters.category, filters.status],
    queryFn: () => bookService.getBooks({ page, limit: 12, search: debouncedSearch, sortBy: 'title', ...filters }),
  })

  const books = data?.data || []
  const pagination = data?.pagination || { page: 1, pages: 0, total: 0 }

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value })
    setPage(1)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
  }

  const handleReserveClick = (book) => {
    setSelectedBook(book)
    setShowBookModal(true)
  }

  const handleReserveBook = async () => {
    if (!selectedBook) return

    // Prevent reservation if book is available
    if (selectedBook.status === 'Available') {
      toast.error('This book is currently available. Please visit the library to issue it.')
      return
    }

    try {
      setReserving(true)
      await reservationService.createReservation({
        bookId: selectedBook._id
      })
      
      toast.success('Reservation request sent to admin for approval!')
      setShowBookModal(false)
      setSelectedBook(null)
      refetch() // Refresh the list
    } catch (error) {
      console.error('Error reserving book:', error)
      toast.error(error.response?.data?.message || 'Failed to reserve book')
    } finally {
      setReserving(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      Available: { variant: 'success', text: 'Available' },
      'Not Available': { variant: 'warning', text: 'Not Available' },
      Damaged: { variant: 'error', text: 'Damaged' },
      Lost: { variant: 'default', text: 'Lost' }
    }
    return statusConfig[status] || statusConfig.Available
  }

  // Book Skeleton Loader Component
  const BookSkeleton = () => (
    <Card className="overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-gray-200"></div>
      <CardContent className="p-2 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
        <div className="h-6 bg-gray-200 rounded"></div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Book Catalog</h1>
        <p className="text-gray-600 mt-1">Browse and search available books</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-4 space-y-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search books by title, author, ISBN..."
          />
          <div className="flex flex-wrap gap-4">
            <select
              className="input w-full sm:w-48"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
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
            <select
              className="input w-full sm:w-48"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Not Available">Not Available</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Books Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {[...Array(12)].map((_, index) => (
            <BookSkeleton key={index} />
          ))}
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {books.map((book) => {
              const statusBadge = getStatusBadge(book.status)
              return (
                <Card 
                  key={book._id} 
                  className="overflow-hidden transition-all border hover:shadow-md hover:scale-105 cursor-pointer"
                  onClick={() => handleReserveClick(book)}
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                    {book.coverImage ? (
                      <img
                        src={`http://localhost:5000${book.coverImage}`}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-1.5 right-1.5">
                      <Badge variant={statusBadge.variant} className="text-xs px-1.5 py-0.5">
                        {statusBadge.text}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-2">
                    <h3 className="font-semibold text-xs mb-0.5 line-clamp-2 leading-tight" style={{color: '#011039'}}>
                      {book.title}
                    </h3>
                    <p className="text-[10px] text-gray-500 mb-1.5 line-clamp-1">{book.author}</p>
                    <Button
                      size="sm"
                      className="w-full text-[10px] py-1 h-6 font-medium"
                      style={{
                        backgroundColor: '#E76800',
                        border: 'none'
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {/* Book Details Modal */}
      {showBookModal && selectedBook && (
        <Modal isOpen={showBookModal} onClose={() => setShowBookModal(false)}>
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold" style={{color: '#011039'}}>Book Details</h2>
            </div>

            <div className="space-y-4">
              {/* Book Cover */}
              <div className="flex justify-center">
                <div className="w-48 aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden">
                  {selectedBook.coverImage ? (
                    <img
                      src={`http://localhost:5000${selectedBook.coverImage}`}
                      alt={selectedBook.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-20 w-20 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Book Information */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold" style={{color: '#011039'}}>
                    {selectedBook.title}
                  </h3>
                  <div className="mt-2">
                    <Badge variant={getStatusBadge(selectedBook.status).variant}>
                      {getStatusBadge(selectedBook.status).text}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Sr.No</p>
                      <p className="font-medium">{selectedBook.accessionNumber || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Author</p>
                      <p className="font-medium">{selectedBook.author || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <BookmarkIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-medium">{selectedBook.category || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <BookOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Edition</p>
                      <p className="font-medium">{selectedBook.edition || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <BookOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">By Purchase</p>
                      <p className="font-medium">{selectedBook.publisher || '-'}</p>
                    </div>
                  </div>
                </div>

                {selectedBook.description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{selectedBook.description}</p>
                  </div>
                )}

                {/* Availability Notice */}
                {selectedBook.status === 'Available' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      ✓ This book is currently available! Please visit the library to issue it.
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      This book is currently not available. You can request a reservation and we'll notify you when it becomes available.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedBook.status === 'Available' ? (
                  <Button
                    onClick={() => setShowBookModal(false)}
                    variant="outline"
                    className="w-full max-w-xs mx-auto"
                  >
                    Close
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setShowBookModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={handleReserveBook}
                      disabled={reserving}
                      className="flex-1"
                      style={{backgroundColor: '#E76800'}}
                    >
                      {reserving ? 'Requesting...' : 'Request Reservation'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
