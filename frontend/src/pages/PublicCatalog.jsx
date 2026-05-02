import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  BookOpen, Search, Filter, X, Calendar, Hash, User, 
  BookmarkIcon, ChevronRight, Mail, Phone, MapPin, 
  Clock, CheckCircle, AlertTriangle, LogIn
} from 'lucide-react'
import { bookService } from '@/services/bookService'
import { settingsService } from '@/services/settingsService'
import { reservationService } from '@/services/reservationService'
import { transactionService } from '@/services/transactionService'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import toast from 'react-hot-toast'

import PublicNavbar from '@/components/PublicNavbar'
import AuthModal from '@/components/AuthModal'

const PAGE_SIZE = 18

const getCoverUrl = (coverImage) => {
  if (!coverImage) return null
  if (coverImage.startsWith('http://') || coverImage.startsWith('https://') || coverImage.startsWith('blob:')) {
    return coverImage
  }
  return `http://localhost:5000${coverImage}`
}

export default function PublicCatalog() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)
  const [showBookModal, setShowBookModal] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [filters, setFilters] = useState({
    category: '',
  })

  const { student, isAuthenticated } = useMemberAuthStore()
  const queryClient = useQueryClient()

  // Fetch student's current books and reservations if logged in
  const { data: myBooksData } = useQuery({
    queryKey: ['my-issued-books'],
    queryFn: () => transactionService.getIssuedBooks(),
    enabled: !!isAuthenticated
  })

  const { data: myReservationsData } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => reservationService.getReservations(),
    enabled: !!isAuthenticated
  })

  const myIssuedBooks = myBooksData?.data || []
  const myReservations = myReservationsData?.data || []

  // Check if current student has this book
  const hasBook = (bookId) => myIssuedBooks.some(tx => tx.bookId?._id === bookId)
  const hasReservation = (bookId) => myReservations.find(res => res.bookId?._id === bookId)

  // Reservation Mutation
  const reserveMutation = useMutation({
    mutationFn: (bookId) => reservationService.createReservation({ bookId }),
    onSuccess: () => {
      toast.success('Reservation request submitted successfully!')
      queryClient.invalidateQueries(['my-reservations'])
      queryClient.invalidateQueries(['public-books-catalog'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to request reservation')
    }
  })

  const handleReserve = async (e, bookId) => {
    if (e) e.stopPropagation()
    if (!isAuthenticated) {
      openAuth('login')
      return
    }
    reserveMutation.mutate(bookId)
  }

  const openAuth = (mode) => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => settingsService.getSettings(),
  })

  const libraryName = 'Wisdom Hall Thal University Bhakkar'

  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: ['public-books-catalog', page, debouncedSearch, filters.category],
    queryFn: () => bookService.getPublicBooks({ 
      page, 
      limit: PAGE_SIZE, 
      search: debouncedSearch, 
      category: filters.category,
      sortBy: 'title' 
    }),
  })

  const books = booksData?.data || []
  const pagination = booksData?.pagination || { page: 1, pages: 1, total: 0 }

  const handleFilterChange = (category) => {
    setFilters({ category })
    setPage(1)
  }

  const handleBookClick = (book) => {
    setSelectedBook(book)
    setShowBookModal(true)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <PublicNavbar onOpenAuth={openAuth} />

      <main className="pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#011039]">Complete Library Catalog</h1>
            <p className="text-slate-500 mt-2 text-lg">Explore our full collection of books and academic resources.</p>
            <div className="h-1.5 w-20 bg-[#E76800] mt-4 rounded-full"></div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-10 bg-white shadow-sm border-slate-100 rounded-2xl overflow-hidden">
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1 relative group">
                <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E76800] transition-colors" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, author, or ISBN..."
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-[#E76800] transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400"
                />
              </div>
              
              <div className="w-full md:w-64">
                <select
                  className="w-full px-4 py-3.5 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-[#E76800] transition-all bg-slate-50 focus:bg-white text-slate-600 font-medium"
                  value={filters.category}
                  onChange={(e) => handleFilterChange(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {[
                    "Biology", "Business", "Chemistry", "Communication and Media", 
                    "Computer / Computer Science", "Education", "English", "History", 
                    "Information Technology", "International Relations", "Islamic Studies", 
                    "Mathematics", "Miscellaneous", "Physics", "Psychology", 
                    "Social Work", "Sociology", "Sports Sciences", "Urdu", "Zoology"
                  ].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Books Grid */}
          {booksLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-3 animate-pulse">
                  <div className="aspect-[3/4] bg-slate-100 rounded-xl mb-4" />
                  <div className="space-y-3 px-1">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {books.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <BookOpen className="h-20 w-20 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#011039]">No books found</h3>
                  <p className="text-slate-500 mt-2">Try adjusting your search or category filters.</p>
                  <Button variant="outline" onClick={() => { setSearch(''); setFilters({category: ''}) }} className="mt-6 rounded-xl">Clear All Filters</Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {books.map((book) => {
                      const coverUrl = getCoverUrl(book.coverImage)
                      const isIssuedToMe = hasBook(book._id)
                      const myRes = hasReservation(book._id)

                      return (
                        <Card 
                          key={book._id} 
                          className={`group p-3 border-slate-100 hover:border-[#E76800]/20 hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col h-full bg-white cursor-pointer relative ${isIssuedToMe ? 'ring-2 ring-blue-500/20' : ''}`}
                          onClick={() => handleBookClick(book)}
                        >
                          {isIssuedToMe && (
                            <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white p-1 rounded-full shadow-lg" title="You currently have this book">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          )}
                          <div className="aspect-[3/4] bg-slate-50 rounded-xl overflow-hidden mb-4 relative shadow-sm">
                            {coverUrl ? (
                              <img src={coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-10 w-10 text-slate-200" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col flex-1 px-1 text-center">
                            <h3 className="text-xs font-bold text-[#011039] line-clamp-2 leading-snug group-hover:text-[#E76800] transition-colors">{book.title}</h3>
                            <p className="text-[10px] text-slate-500 mt-2 truncate italic">{book.author}</p>
                            <div className="mt-auto pt-4">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#011039] block truncate">
                                {book.category}
                              </span>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>

                  <div className="mt-16 flex justify-center">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.pages}
                      onPageChange={setPage}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Book Details Modal */}
      {showBookModal && selectedBook && (
        <Modal isOpen={showBookModal} onClose={() => setShowBookModal(false)}>
          <div className="p-0 overflow-hidden rounded-3xl">
            <div className="grid grid-cols-1 md:grid-cols-5">
              {/* Left Side: Cover Image */}
              <div className="md:col-span-2 bg-slate-50 flex items-center justify-center p-8">
                <div className="w-full aspect-[3/4] rounded-2xl shadow-2xl overflow-hidden border-4 border-white">
                  {selectedBook.coverImage ? (
                    <img
                      src={getCoverUrl(selectedBook.coverImage)}
                      alt={selectedBook.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-20 w-20 text-slate-300" />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Details */}
              <div className="md:col-span-3 p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Badge variant={selectedBook.status === 'Available' ? 'success' : 'warning'} className="mb-3 px-3 py-1 rounded-lg">
                      {selectedBook.status}
                    </Badge>
                    <h2 className="text-2xl font-extrabold text-[#011039] leading-tight">
                      {selectedBook.title}
                    </h2>
                    <p className="text-[#E76800] font-bold mt-1">{selectedBook.author}</p>
                  </div>
                  <button 
                    onClick={() => setShowBookModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="h-6 w-6 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Sr.No</p>
                    <p className="text-sm font-bold text-[#011039]">{selectedBook.accessionNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Author</p>
                    <p className="text-sm font-bold text-[#011039]">{selectedBook.author || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Category</p>
                    <p className="text-sm font-bold text-[#011039]">{selectedBook.category || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Edition</p>
                    <p className="text-sm font-bold text-[#011039]">{selectedBook.edition || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">By Purchase</p>
                    <p className="text-sm font-bold text-[#011039]">{selectedBook.price ? `Rs. ${selectedBook.price}` : '-'}</p>
                  </div>
                </div>

                {selectedBook.description && (
                  <div className="mb-8">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">About this book</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{selectedBook.description}</p>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100">
                  {isAuthenticated ? (
                    <div className="space-y-4">
                      {hasBook(selectedBook._id) ? (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-blue-600 shrink-0" />
                          <p className="text-sm font-bold text-blue-800">You currently have this book issued.</p>
                        </div>
                      ) : hasReservation(selectedBook._id) ? (
                        <div className={`border rounded-xl p-4 flex items-center gap-3 ${
                          hasReservation(selectedBook._id).status === 'pending' 
                          ? 'bg-orange-50 border-orange-100' 
                          : 'bg-green-50 border-green-100'
                        }`}>
                          <Clock className={`h-5 w-5 shrink-0 ${
                            hasReservation(selectedBook._id).status === 'pending' 
                            ? 'text-orange-600' 
                            : 'text-green-600'
                          }`} />
                          <div>
                            <p className={`text-sm font-bold ${
                              hasReservation(selectedBook._id).status === 'pending' 
                              ? 'text-orange-800' 
                              : 'text-green-800'
                            }`}>
                              {hasReservation(selectedBook._id).status === 'pending' 
                                ? 'Reservation Pending' 
                                : 'Reservation Approved'}
                            </p>
                            <p className="text-xs mt-0.5 opacity-70">
                              {hasReservation(selectedBook._id).status === 'pending' 
                                ? 'Waiting for librarian approval.' 
                                : 'Please visit the library to collect your book.'}
                            </p>
                          </div>
                        </div>
                      ) : selectedBook.status === 'Available' ? (
                        <Button 
                          variant="primary" 
                          className="w-full h-14 rounded-2xl shadow-xl shadow-orange-600/20 text-lg font-bold"
                          onClick={(e) => handleReserve(e, selectedBook._id)}
                          loading={reserveMutation.isPending}
                        >
                          Request Reservation
                        </Button>
                      ) : (
                        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-slate-500 shrink-0" />
                          <p className="text-sm font-bold text-slate-700">This book is currently unavailable.</p>
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        className="w-full h-12 rounded-xl"
                        onClick={() => setShowBookModal(false)}
                      >
                        Close
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                        <p className="text-slate-600 text-sm font-medium">To borrow or reserve this book, please log in to your student portal.</p>
                      </div>
                      <div className="flex gap-4">
                        <Button 
                          variant="outline" 
                          className="flex-1 h-12 rounded-xl"
                          onClick={() => setShowBookModal(false)}
                        >
                          Close
                        </Button>
                        <Button 
                          variant="primary" 
                          className="flex-1 h-12 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                          onClick={() => openAuth('login')}
                        >
                          <LogIn className="h-4 w-4" />
                          Login to Portal
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Footer (Simplified) */}
      <footer className="bg-[#011039] py-10 px-4 sm:px-8 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="/Images/Logo.png" alt="Logo" className="h-10 w-auto brightness-0 invert" />
            <h3 className="font-bold">{libraryName}</h3>
          </div>
          <div className="flex gap-6 text-sm text-slate-300">
            <Link to="/landing" className="hover:text-white transition-colors">Home</Link>
            <a href="/landing#books" className="hover:text-white transition-colors">Books</a>
            <Link to="/landing?auth=login&type=student" className="hover:text-white transition-colors">Portal</Link>
          </div>
          <p className="text-xs text-slate-400 font-medium">© {new Date().getFullYear()} {libraryName}</p>
        </div>
      </footer>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode} 
      />
    </div>
  )
}
