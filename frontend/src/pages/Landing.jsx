import { useEffect, useMemo, useState, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  BookOpen, ShieldCheck, Search, Phone, Mail, MapPin, 
  Clock, ChevronRight, User, LogOut, LayoutDashboard, 
  Settings as SettingsIcon, Menu, X as CloseIcon,
  CheckCircle, AlertTriangle, Hash, Calendar, BookmarkIcon,
  X, LogIn
} from 'lucide-react'
import { settingsService } from '@/services/settingsService'
import { bookService } from '@/services/bookService'
import { reservationService } from '@/services/reservationService'
import { transactionService } from '@/services/transactionService'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import Avatar from '@/components/ui/Avatar'
import AuthModal from '@/components/AuthModal'
import StudentDashboard from './student/StudentDashboard'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

import PublicNavbar from '@/components/PublicNavbar'

const PAGE_SIZE = 12

const getCoverUrl = (coverImage) => {
  if (!coverImage) return null
  if (coverImage.startsWith('http://') || coverImage.startsWith('https://') || coverImage.startsWith('blob:')) {
    return coverImage
  }
  return `http://localhost:5000${coverImage}`
}

export default function Landing() {
  const [search, setSearch] = useState('')
  const [bookItems, setBookItems] = useState([])
  const [activeSlide, setActiveSlide] = useState(0)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [showBookModal, setShowBookModal] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authType, setAuthType] = useState('student')
  const [view, setView] = useState('landing') // 'landing' or 'dashboard'

  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const { user: librarian, logout: logoutLibrarian, isAuthenticated: isLibAuth } = useAuthStore()
  const { student, logout: logoutStudent, isAuthenticated: isStudentAuth } = useMemberAuthStore()

  const isAuthenticated = isLibAuth || isStudentAuth
  const user = librarian || student
  const userType = isLibAuth ? 'librarian' : 'student'

  // Fetch student's current books and reservations if logged in
  const { data: myBooksData } = useQuery({
    queryKey: ['my-issued-books'],
    queryFn: () => transactionService.getIssuedBooks(),
    enabled: !!isStudentAuth
  })

  const { data: myReservationsData } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => reservationService.getReservations(),
    enabled: !!isStudentAuth
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
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to request reservation')
    }
  })

  const handleReserve = async (e, bookId) => {
    if (e) e.stopPropagation()
    if (!isStudentAuth) {
      openAuth('login')
      return
    }
    reserveMutation.mutate(bookId)
  }

  const handleBookClick = (book) => {
    setSelectedBook(book)
    setShowBookModal(true)
  }

  // Auto-slide hero section
  useEffect(() => {
    if (view === 'landing') {
      const timer = setInterval(() => {
        handleNextSlide()
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [view, activeSlide])

  // Sync view with URL path and handle auth query params
  useEffect(() => {
    if (isAuthenticated && (location.pathname === '/dashboard')) {
      setView('dashboard')
    } else {
      setView('landing')
    }

    // Handle authentication redirect from Protected Routes
    const params = new URLSearchParams(location.search)
    const authAction = params.get('auth')
    const type = params.get('type')

    if (authAction && !isAuthenticated) {
      setAuthMode(authAction === 'signup' ? 'signup' : 'login')
      if (type) setAuthType(type)
      setIsAuthModalOpen(true)
    }

    // Handle hash scroll on mount
    if (location.hash && view === 'landing') {
      const id = location.hash.replace('#', '')
      const element = document.getElementById(id)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }
  }, [isAuthenticated, location.pathname, location.search, location.hash, view])

  const openAuth = (mode, type = 'student') => {
    setAuthMode(mode)
    setAuthType(type)
    setIsAuthModalOpen(true)
  }

  const heroSlides = useMemo(
    () => [
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1529148482759-b35b25c5f217?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=2000'
    ],
    []
  )

  const goToSlide = (idx) => {
    setActiveSlide(idx)
  }

  const handleNextSlide = () => {
    setActiveSlide((idx) => (idx + 1) % heroSlides.length)
  }

  const handlePrevSlide = () => {
    setActiveSlide((idx) => (idx - 1 + heroSlides.length) % heroSlides.length)
  }

  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => settingsService.getSettings(),
  })

  const libraryInfo = settingsData?.data?.libraryInfo
  const libraryName = 'Wisdom Hall Thal University Bhakkar'

  const { data: booksData, isLoading: booksLoading, isError: booksError } = useQuery({
    queryKey: ['public-books', search],
    queryFn: () => bookService.getPublicBooks({ page: 1, limit: PAGE_SIZE, search, sortBy: 'title' }),
  })

  const books = booksData?.data || []
  const pagination = booksData?.pagination || { page: 1, pages: 1, total: 0 }

  useEffect(() => {
    if (Array.isArray(books)) {
      setBookItems(books)
    }
  }, [books])

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <PublicNavbar 
        onOpenAuth={openAuth} 
        view={view} 
        setView={setView} 
      />

      <main className="pt-16 min-h-screen">
        {view === 'dashboard' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-[#011039]">User Dashboard</h1>
                <p className="text-slate-500 mt-2 text-lg">Welcome back! Manage your library activities here.</p>
                <div className="h-1.5 w-20 bg-[#E76800] mt-4 rounded-full"></div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setView('landing')}
                className="rounded-xl font-bold flex items-center gap-2 border-slate-200 text-slate-600"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back to Website
              </Button>
            </div>
            
            <StudentDashboard />
          </div>
        ) : (
          <>
            {/* Hero */}
            <section className="relative h-[550px] sm:h-[650px] overflow-hidden">
              <div 
                className="flex h-full transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {heroSlides.map((image) => (
                  <div key={image} className="min-w-full h-full relative">
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#011039]/95 via-[#011039]/70 to-[#011039]/30" />
                  </div>
                ))}
              </div>

              <div className="absolute inset-0 z-20 h-full max-w-7xl mx-auto px-4 sm:px-8 flex items-center">
                <div className="max-w-3xl">
                  <p className="text-[#E76800] font-bold tracking-widest uppercase text-sm mb-4 animate-slide-up">
                    Experience the Future of Learning
                  </p>
                  <h1 className="text-5xl sm:text-7xl font-extrabold text-white leading-tight mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    {libraryName}
                  </h1>
                  <p className="text-lg sm:text-xl text-slate-200 mb-10 leading-relaxed max-w-2xl animate-slide-up" style={{ animationDelay: '200ms' }}>
                    Access a world-class collection of books, research papers, and digital resources. Join our community of scholars and explorers today.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="rounded-lg shadow-xl shadow-orange-500/20"
                      onClick={() => navigate('/catalog')}
                    >
                      Explore Catalog
                    </Button>
                    {!isAuthenticated && (
                      <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={() => openAuth('signup')}
                        className="rounded-lg bg-white/5 text-white border-white/30 backdrop-blur-md hover:bg-white hover:text-[#011039] transition-all border-2"
                      >
                        Join Now
                      </Button>
                    )}
                  </div>

                  <div className="mt-16 flex flex-wrap items-center gap-10 text-white/80 animate-slide-up" style={{ animationDelay: '400ms' }}>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <ShieldCheck className="h-6 w-6 text-[#E76800]" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg leading-none">Secure</p>
                        <p className="text-sm text-white/60 mt-1">Authorized Access</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <BookOpen className="h-6 w-6 text-[#E76800]" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg leading-none">10,000+</p>
                        <p className="text-sm text-white/60 mt-1">Resource Library</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slider Controls */}
              <div className="absolute z-20 bottom-10 left-0 right-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={`dot-${idx}`}
                        onClick={() => goToSlide(idx)}
                        className={`h-2 transition-all duration-300 rounded-full ${
                          idx === activeSlide ? 'w-12 bg-[#E76800]' : 'w-2 bg-white/30 hover:bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrevSlide}
                      className="h-12 w-12 rounded-xl border border-white/20 text-white flex items-center justify-center hover:bg-[#E76800] hover:border-[#E76800] transition-all backdrop-blur-sm active:scale-90 group"
                    >
                      <ChevronRight className="h-6 w-6 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <button
                      onClick={handleNextSlide}
                      className="h-12 w-12 rounded-xl border border-white/20 text-white flex items-center justify-center hover:bg-[#E76800] hover:border-[#E76800] transition-all backdrop-blur-sm active:scale-90 group"
                    >
                      <ChevronRight className="h-6 w-6 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Books */}
            <section id="books" className="px-4 sm:px-8 py-20 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                  <div className="max-w-2xl">
                    <p className="text-[#E76800] font-bold tracking-widest uppercase text-xs mb-3">Our Collection</p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-[#011039]">Discover Your Next Favorite Book</h2>
                    <div className="h-1.5 w-20 bg-[#E76800] mt-4 rounded-full"></div>
                    <p className="text-slate-500 mt-6 text-lg">Browse through our extensive library of physical and digital assets.</p>
                  </div>

                  <div className="w-full md:w-96">
                    <div className="relative group">
                      <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E76800] transition-colors" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search titles, authors..."
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-[#E76800] transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  {booksError ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl">
                      <p className="text-red-700 font-medium">Unable to load books right now.</p>
                    </div>
                  ) : booksLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-3 animate-pulse">
                          <div className="aspect-[3/4] bg-slate-100 rounded-xl mb-4" />
                          <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                          <div className="h-3 bg-slate-100 rounded w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                        {bookItems.map((book) => {
                          const coverUrl = getCoverUrl(book.coverImage)
                          return (
                            <Card 
                              key={book._id} 
                              className="group p-3 border-slate-100 hover:border-[#E76800]/20 hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col h-full bg-white cursor-pointer"
                              onClick={() => handleBookClick(book)}
                            >
                              <div className="aspect-[3/4] bg-slate-50 rounded-xl overflow-hidden mb-4 relative shadow-sm">
                                {coverUrl ? (
                                  <img src={coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="h-12 w-12 text-slate-200" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col flex-1 px-1 text-center">
                                <h3 className="text-xs font-bold text-[#011039] line-clamp-2 leading-snug group-hover:text-[#E76800] transition-colors">{book.title}</h3>
                                <p className="text-[10px] text-slate-500 mt-2 truncate italic">{book.author}</p>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                      <div className="mt-16 flex justify-center">
                        <Button 
                          variant="primary" 
                          className="px-12 h-14 rounded-2xl shadow-xl shadow-orange-600/20 text-lg font-bold"
                          onClick={() => navigate('/catalog')}
                        >
                          Explore Full Catalog
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Services */}
            <section id="actions" className="px-4 sm:px-8 py-24 bg-[#F8F9FA]">
              <div className="max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <p className="text-[#E76800] font-bold tracking-widest uppercase text-xs mb-3">Premium Services</p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#011039]">Unlock Full Potential with Membership</h2>
                  <p className="text-slate-500 mt-6 text-lg">Gain access to our complete suite of library management tools.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { title: 'Academic Catalog', icon: BookOpen, desc: 'Access full digital inventory and real-time availability.' },
                    { title: 'Priority Reservations', icon: Clock, desc: 'Reserve popular titles in advance and get instant notifications.' },
                    { title: 'Account Dashboard', icon: User, desc: 'Track borrowing history, fines, and personalized recommendations.' }
                  ].map((service, i) => (
                    <Card key={i} className="group relative bg-white p-8 rounded-3xl border-slate-100 hover:border-[#E76800]/20 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                      <div className="relative z-10">
                        <div className="h-16 w-16 rounded-2xl bg-[#011039]/5 flex items-center justify-center mb-8 group-hover:bg-[#E76800] group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-inner">
                          <service.icon className="h-8 w-8 text-[#011039] group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-[#011039] mb-4">{service.title}</h3>
                        <p className="text-slate-500 leading-relaxed mb-8">{service.desc}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-[#011039] text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
            {/* Library Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img src="/Images/Logo.png" alt="Logo" className="h-12 w-auto brightness-0 invert" />
                <h3 className="text-xl font-bold tracking-tight">{libraryName}</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Empowering the students of Thal University Bhakkar with a world-class physical and digital library system. Your gateway to knowledge and academic excellence.
              </p>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E76800] transition-colors cursor-pointer border border-white/10 group">
                    <BookOpen className="h-5 w-5 text-slate-300 group-hover:text-white" />
                </div>
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E76800] transition-colors cursor-pointer border border-white/10 group">
                    <ShieldCheck className="h-5 w-5 text-slate-300 group-hover:text-white" />
                </div>
              </div>
            </div>

            {/* Quick Navigation */}
            <div>
              <h4 className="text-lg font-bold mb-6 relative inline-block">
                Quick Links
                <span className="absolute -bottom-2 left-0 w-12 h-1 bg-[#E76800] rounded-full"></span>
              </h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li>
                  <Link to="/landing" className="hover:text-[#E76800] transition-colors flex items-center gap-2 group">
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    Home Page
                  </Link>
                </li>
                <li>
                  <a href="#books" className="hover:text-[#E76800] transition-colors flex items-center gap-2 group">
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    Books Collection
                  </a>
                </li>
                <li>
                  <Link to="/catalog" className="hover:text-[#E76800] transition-colors flex items-center gap-2 group">
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    Complete Catalog
                  </Link>
                </li>
                <li>
                  <a href="#actions" className="hover:text-[#E76800] transition-colors flex items-center gap-2 group">
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    Our Services
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Details */}
            <div>
              <h4 className="text-lg font-bold mb-6 relative inline-block">
                Support
                <span className="absolute -bottom-2 left-0 w-12 h-1 bg-[#E76800] rounded-full"></span>
              </h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#E76800] shrink-0" />
                  <span>{libraryInfo?.address || 'Bhakkar, Punjab, Pakistan'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-[#E76800] shrink-0" />
                  <a href={`tel:${libraryInfo?.phone}`} className="hover:text-white transition-colors">{libraryInfo?.phone || '+92 453 920000'}</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#E76800] shrink-0" />
                  <a href={`mailto:${libraryInfo?.email}`} className="hover:text-white transition-colors">{libraryInfo?.email || 'library@tu.edu.pk'}</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} {libraryName}. All Rights Reserved.
            </p>
            <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-500">
              <a href="#" className="hover:text-[#E76800] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#E76800] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#E76800] transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode}
        initialType={authType}
      />

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
              <div className="md:col-span-3 p-8 text-left">
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
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{selectedBook.description}</p>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100">
                  {isStudentAuth ? (
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
                    </div>
                  ) : (
                    <div className="space-y-6 text-center">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
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
    </div>
  )
}
