import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ShieldCheck, Search, Phone, Mail, MapPin, Clock, ChevronRight } from 'lucide-react'
import { settingsService } from '@/services/settingsService'
import { bookService } from '@/services/bookService'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

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
  const [page, setPage] = useState(1)
  const [bookItems, setBookItems] = useState([])
  const [activeSlide, setActiveSlide] = useState(0)

  const heroSlides = useMemo(
    () => ['/landing/hero-1.svg', '/landing/hero-2.svg', '/landing/hero-3.svg'],
    []
  )

  const goToSlide = (idx) => {
    const total = heroSlides.length
    const next = ((idx % total) + total) % total
    setActiveSlide(next)
  }

  const handleNextSlide = () => {
    setActiveSlide((idx) => (idx + 1) % heroSlides.length)
  }

  const handlePrevSlide = () => {
    setActiveSlide((idx) => (idx - 1 + heroSlides.length) % heroSlides.length)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((idx) => (idx + 1) % heroSlides.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [heroSlides.length])

  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => settingsService.getSettings(),
  })

  const libraryInfo = settingsData?.data?.libraryInfo
  const libraryName = libraryInfo?.name || 'Library Management System'

  const { data: booksData, isLoading: booksLoading, isError: booksError } = useQuery({
    queryKey: ['public-books', page, search],
    queryFn: () => bookService.getPublicBooks({ page, limit: PAGE_SIZE, search, sortBy: 'title' }),
  })

  const books = booksData?.data || []
  const pagination = booksData?.pagination || { page: 1, pages: 1, total: 0 }

  const canLoadMore = pagination.page < pagination.pages

  // Append pages on load-more; reset when search resets to page 1
  useEffect(() => {
    if (!Array.isArray(books)) return

    if (page === 1) {
      setBookItems(books)
      return
    }

    setBookItems((prev) => {
      const existingIds = new Set(prev.map((b) => b?._id))
      const next = [...prev]
      for (const b of books) {
        if (b?._id && !existingIds.has(b._id)) {
          next.push(b)
          existingIds.add(b._id)
        }
      }
      return next
    })
  }, [books, page])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      {/* Top Navbar */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50" style={{ borderBottom: '2px solid #E76800' }}>
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/landing" className="flex items-center">
              <img src="/Images/Logo.png" alt={libraryName} className="h-10 w-auto object-contain" />
            </Link>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold" style={{ color: '#011039' }}>{libraryName}</p>
              <p className="text-xs text-gray-500">Library portal & catalog</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#books" className="hover:underline" style={{ color: '#011039' }}>Books</a>
            <a href="#actions" className="hover:underline" style={{ color: '#011039' }}>Actions</a>
            <a href="#contact" className="hover:underline" style={{ color: '#011039' }}>Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/student/login">
              <Button variant="primary">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero */}
        <section className="relative">
          {/* Slider background */}
          <button
            type="button"
            onClick={handleNextSlide}
            className="absolute inset-0 text-left"
            aria-label="Next slide"
          >
            {heroSlides.map((src, idx) => (
              <div
                key={src}
                className="absolute inset-0 transition-opacity duration-700"
                style={{
                  opacity: idx === activeSlide ? 1 : 0,
                  backgroundImage: `url(${src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
            ))}
            {/* Readability overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(1,16,57,0.86) 0%, rgba(1,16,57,0.62) 45%, rgba(1,16,57,0.35) 100%)'
              }}
            />
          </button>

          <div className="relative px-4 sm:px-6">
            <div className="max-w-6xl mx-auto min-h-[520px] sm:min-h-[620px] py-16 sm:py-20 flex items-center">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold tracking-wide" style={{ color: '#E76800' }}>
                  University Library System
                </p>
                <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold leading-tight text-white">
                  {libraryName}
                </h1>
                <p className="mt-5 text-white/90 text-base sm:text-lg">
                  Browse a preview of our collection. For verified actions and your personal portal access, login as a user.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a href="#books">
                    <Button variant="primary">Browse Books</Button>
                  </a>
                  <Link to="/student/login">
                    <Button variant="secondary">User Login</Button>
                  </Link>
                </div>

                <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-white/85">
                  <div className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" style={{ color: '#E76800' }} />
                    <span>Login required for deep actions</span>
                  </div>
                  <span className="hidden sm:inline text-white/40">•</span>
                  <div className="inline-flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" style={{ color: '#E76800' }} />
                    <span>Public preview of books available</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-x-4 sm:inset-x-6 bottom-8">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {heroSlides.map((_, idx) => (
                    <button
                      key={`slide-dot-${idx}`}
                      type="button"
                      onClick={() => goToSlide(idx)}
                      className="h-2.5 w-2.5 rounded-full border border-white/60 transition"
                      aria-label={`Go to slide ${idx + 1}`}
                      style={{
                        backgroundColor: idx === activeSlide ? '#E76800' : 'rgba(255, 255, 255, 0.25)'
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    className="h-9 px-3 rounded-full border border-white/50 text-white text-xs sm:text-sm hover:bg-white/10"
                    aria-label="Previous slide"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    className="h-9 px-3 rounded-full border border-white/50 text-white text-xs sm:text-sm hover:bg-white/10"
                    aria-label="Next slide"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Books */}
        <section id="books" className="px-4 sm:px-6 mt-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: '#011039' }}>Books Collection</h2>
                <p className="text-gray-600 mt-2">Browse a preview of our collection. Login for full features.</p>
              </div>

              <div className="w-full sm:w-96">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                      setBookItems([])
                    }}
                    placeholder="Search by title, author, category..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              {booksError && (
                <Card className="border border-gray-200">
                  <CardContent>
                    <p className="text-sm text-gray-600">Unable to load books right now. Please try again.</p>
                  </CardContent>
                </Card>
              )}

              {!booksError && (
                <>
                  {booksLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <Card key={idx} className="border border-gray-200 p-0 overflow-hidden animate-pulse">
                          <div className="aspect-[3/4] bg-gray-200" />
                          <div className="p-3 space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                            <div className="h-2 bg-gray-200 rounded w-1/2" />
                            <div className="h-2 bg-gray-200 rounded w-2/3" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <>
                      {bookItems.length === 0 ? (
                        <Card className="border border-gray-200">
                          <CardContent>
                            <p className="text-sm text-gray-600">No books found.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {bookItems.map((book) => {
                            const coverUrl = getCoverUrl(book.coverImage)
                            return (
                              <Card key={book._id} className="border border-gray-200 p-0 overflow-hidden">
                                <div className="aspect-[3/4] bg-gray-50">
                                  {coverUrl ? (
                                    <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <BookOpen className="h-10 w-10 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="p-3">
                                  <p className="text-sm font-semibold" style={{ color: '#011039' }}>{book.title}</p>
                                  <p className="text-xs text-gray-600 mt-1 truncate">{book.author}</p>
                                  <p className="text-xs mt-2 inline-flex px-2 py-0.5 rounded-full bg-gray-100" style={{ color: '#011039' }}>
                                    {book.category}
                                  </p>
                                </div>
                              </Card>
                            )
                          })}
                        </div>
                      )}

                      <div className="mt-6 flex items-center justify-between gap-3">
                        <p className="text-sm text-gray-600">Loaded {bookItems.length} of {pagination.total} books</p>
                        <div className="flex items-center gap-2">
                          {canLoadMore && (
                            <Button
                              variant="outline"
                              onClick={() => setPage((p) => p + 1)}
                            >
                              Load more
                            </Button>
                          )}
                          <Link to="/student/login">
                            <Button variant="primary">Login for Portal</Button>
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Actions */}
        <section id="actions" className="px-4 sm:px-6 mt-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: '#011039' }}>Actions (Login Required)</h2>
            <p className="text-gray-600 mt-2">Deep actions are available after verification through login.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Open Book Catalog</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Browse detailed catalog and availability inside the portal.</p>
                  <div className="mt-4">
                    <Link to="/student/catalog">
                      <Button variant="secondary">Go to Catalog</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Reservations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Request reservations for unavailable books.</p>
                  <div className="mt-4">
                    <Link to="/student/reservations">
                      <Button variant="secondary">Manage Reservations</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Fines & Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">View fines and receive notifications about your account.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/student/fines">
                      <Button variant="secondary">View Fines</Button>
                    </Link>
                    <Link to="/student/notifications">
                      <Button variant="outline">Notifications</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="px-4 sm:px-6 mt-12 pb-14">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: '#011039' }}>Contact</h2>
            <p className="text-gray-600 mt-2">Find library contact details and working hours.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Library Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-0.5" style={{ color: '#E76800' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#011039' }}>Address</p>
                      <p className="text-sm text-gray-600">{libraryInfo?.address || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 mt-0.5" style={{ color: '#E76800' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#011039' }}>Phone</p>
                      <p className="text-sm text-gray-600">{libraryInfo?.phone || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 mt-0.5" style={{ color: '#E76800' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#011039' }}>Email</p>
                      <p className="text-sm text-gray-600">{libraryInfo?.email || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 mt-0.5" style={{ color: '#E76800' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#011039' }}>Working Hours</p>
                      <p className="text-sm text-gray-600">{libraryInfo?.workingHours || '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Get Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Login to access verified features and your personal portal.</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Link to="/student/login">
                      <Button variant="primary">Login</Button>
                    </Link>
                    <Link to="/student/register">
                      <Button variant="outline">Register</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <footer className="mt-10 text-center text-xs text-gray-500">
              <p>© {new Date().getFullYear()} {libraryName}. All rights reserved.</p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  )
}
