import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ShieldCheck, Search, Phone, Mail, MapPin, Clock, ChevronRight, User } from 'lucide-react'
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
    () => [
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=2000'
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
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      {/* Top Navbar */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50 transition-all border-b-2" style={{ borderColor: '#E76800' }}>
        <div className="flex items-center justify-between h-16 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/landing" className="flex items-center">
              <img src="/Images/Logo.png" alt={libraryName} className="h-10 w-auto object-contain" />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#books" className="text-slate-600 hover:text-[#E76800] transition-colors">Books Collection</a>
            <a href="#actions" className="text-slate-600 hover:text-[#E76800] transition-colors">Our Services</a>
            <a href="#contact" className="text-slate-600 hover:text-[#E76800] transition-colors">Contact Us</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/student/login">
              <Button variant="ghost" className="px-5 text-[#011039] hover:bg-[#011039]/5 font-bold">Login</Button>
            </Link>
            <Link to="/student/register">
              <Button variant="primary" className="px-6 rounded-lg shadow-md font-bold">Signup</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero */}
        <section className="relative h-[550px] sm:h-[650px] overflow-hidden">
          {/* Slider background */}
          {heroSlides.map((image, idx) => (
            <div
              key={image}
              className={`absolute inset-0 transition-transform duration-700 ease-in-out ${
                idx === activeSlide 
                  ? 'translate-x-0' 
                  : idx < activeSlide 
                    ? '-translate-x-full' 
                    : 'translate-x-full'
              }`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${image})` }}
              />
              {/* Overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-[#011039]/95 via-[#011039]/70 to-[#011039]/30"
              />
            </div>
          ))}

          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-8 flex items-center">
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
                <Link to="/catalog">
                  <Button variant="primary" size="lg" className="rounded-lg shadow-xl shadow-orange-500/20">
                    Explore Catalog
                  </Button>
                </Link>
                <Link to="/student/login">
                  <Button variant="outline" size="lg" className="rounded-lg bg-white/5 text-white border-white/30 backdrop-blur-md hover:bg-white hover:text-[#011039] transition-all border-2">
                    Student Portal
                  </Button>
                </Link>
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
          <div className="absolute bottom-10 left-0 right-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {heroSlides.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    onClick={() => goToSlide(idx)}
                    className={`h-2 transition-all duration-300 rounded-full ${
                      idx === activeSlide ? 'w-12 bg-[#E76800]' : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
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
                <p className="text-slate-500 mt-6 text-lg">Browse through our extensive library of physical and digital assets. Filter by category, author, or title to find exactly what you're looking for.</p>
              </div>

              <div className="w-full md:w-96">
                <div className="relative group">
                  <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E76800] transition-colors" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                    }}
                    placeholder="Search titles, authors..."
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-[#E76800] transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10">
              {booksError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl">
                  <p className="text-red-700 font-medium">Unable to load books right now. Please check your connection and try again.</p>
                </div>
              )}

              {!booksError && (
                <>
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
                      {bookItems.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                          <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500 text-lg">No books matched your search criteria.</p>
                          <Button variant="ghost" onClick={() => setSearch('')} className="mt-4">Clear Search</Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                          {bookItems.map((book) => {
                            const coverUrl = getCoverUrl(book.coverImage)
                            return (
                              <Card key={book._id} className="group p-3 border-slate-100 hover:border-[#E76800]/20 hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col h-full bg-white">
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
                      )}

                      <div className="mt-16 flex justify-center">
                        <Link to="/catalog">
                          <Button
                            variant="primary"
                            className="px-12 h-14 rounded-2xl shadow-xl shadow-orange-600/20 text-lg font-bold"
                          >
                            Explore Full Catalog
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Services/Actions */}
        <section id="actions" className="px-4 sm:px-8 py-24 bg-[#F8F9FA]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-[#E76800] font-bold tracking-widest uppercase text-xs mb-3">Premium Services</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#011039]">Unlock Full Potential with Membership</h2>
              <p className="text-slate-500 mt-6 text-lg">Registered students gain access to our complete suite of library management tools and priority services.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Academic Catalog',
                  desc: 'Access our full digital inventory, check real-time availability, and bookmark your favorites.',
                  icon: BookOpen,
                  link: '/student/catalog',
                  btn: 'Explore Catalog'
                },
                {
                  title: 'Priority Reservations',
                  desc: 'Reserve popular titles in advance and get notified instantly when they become available.',
                  icon: Clock,
                  link: '/student/reservations',
                  btn: 'Manage Requests'
                },
                {
                  title: 'Account Dashboard',
                  desc: 'Track your borrowing history, manage fines, and receive personalized recommendations.',
                  icon: User,
                  link: '/student/dashboard',
                  btn: 'My Portal'
                }
              ].map((service, i) => (
                <Card key={i} className="group relative bg-white p-8 rounded-3xl border-slate-100 hover:border-[#E76800]/20 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-slate-50 rounded-bl-[100px] -mr-10 -mt-10 group-hover:bg-[#E76800]/5 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="h-16 w-16 rounded-2xl bg-[#011039]/5 flex items-center justify-center mb-8 group-hover:bg-[#E76800] group-hover:text-white transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                      <service.icon className="h-8 w-8 text-[#011039] group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-[#011039] mb-4">{service.title}</h3>
                    <p className="text-slate-500 leading-relaxed mb-8">{service.desc}</p>
                    <Link to={service.link}>
                      <Button variant="ghost" className="w-full justify-between group-hover:bg-[#011039] group-hover:text-white rounded-xl py-3 border border-slate-100">
                        {service.btn}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="px-4 sm:px-8 py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div>
                <p className="text-[#E76800] font-bold tracking-widest uppercase text-xs mb-3">Get In Touch</p>
                <h2 className="text-4xl font-extrabold text-[#011039] mb-8 leading-tight">We're Here to Support Your Journey</h2>
                <p className="text-slate-500 text-lg mb-12">Whether you're looking for a specific resource or need help with your account, our team is ready to assist you.</p>
                
                <div className="space-y-6">
                  {[
                    { icon: MapPin, title: 'Visit Us', value: libraryInfo?.address || 'Bhakkar, Punjab, Pakistan' },
                    { icon: Phone, title: 'Call Us', value: libraryInfo?.phone || '+92 453 920000' },
                    { icon: Mail, title: 'Email Us', value: libraryInfo?.email || 'library@tu.edu.pk' },
                    { icon: Clock, title: 'Open Hours', value: libraryInfo?.workingHours || 'Mon-Fri: 8:00 AM - 4:00 PM' }
                  ].map((info, i) => (
                    <div key={i} className="flex items-start gap-5 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                      <div className="h-12 w-12 rounded-xl bg-[#E76800]/10 flex items-center justify-center shrink-0 group-hover:bg-[#E76800] transition-all">
                        <info.icon className="h-6 w-6 text-[#E76800] group-hover:text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#011039] mb-1">{info.title}</p>
                        <p className="text-slate-500">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="bg-[#011039] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-64 w-64 bg-[#E76800] opacity-10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-6">Ready to Get Started?</h3>
                  <p className="text-slate-300 mb-10 text-lg">Create your library account today or login to access your personalized academic dashboard.</p>
                  
                  <div className="space-y-4">
                    <Link to="/student/login">
                      <Button variant="primary" className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-orange-600/20">
                        Login to Portal
                      </Button>
                    </Link>
                    <Link to="/student/register">
                      <Button variant="outline" className="w-full h-14 rounded-2xl text-lg font-bold border-2 border-white/20 hover:bg-white hover:text-[#011039] transition-all">
                        Register New Account
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-12 pt-12 border-t border-white/10 flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 w-10 rounded-full border-2 border-[#011039] bg-slate-700 flex items-center justify-center overflow-hidden">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Joined by <span className="text-white font-bold">1,200+</span> active students</p>
                  </div>
                </div>
              </Card>
            </div>

            <footer className="mt-24 pt-10 border-t border-slate-100 text-center">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <img src="/Images/Logo.png" alt="Logo" className="h-8 w-auto opacity-50 grayscale" />
                  <p className="text-slate-400 text-sm font-medium italic">© {new Date().getFullYear()} {libraryName}</p>
                </div>
                <nav className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <a href="#" className="hover:text-[#E76800] transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-[#E76800] transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-[#E76800] transition-colors">Cookies</a>
                </nav>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  )
}
