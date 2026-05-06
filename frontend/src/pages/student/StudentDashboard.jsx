import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import { BookCover } from '@/components/ui/BookCover'
import { Badge } from '@/components/ui/Badge'
import { BookOpen, BookCheck, Clock, DollarSign, AlertCircle, Calendar } from 'lucide-react'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { transactionService } from '@/services/transactionService'
import { reservationService } from '@/services/reservationService'
import { fineService } from '@/services/fineService'
import toast from 'react-hot-toast'

export default function StudentDashboard() {
  const { student } = useMemberAuthStore()
  const [loading, setLoading] = useState(true)
  const [issuedBooks, setIssuedBooks] = useState([])
  const [reservations, setReservations] = useState([])
  const [fines, setFines] = useState([])
  const [stats, setStats] = useState({
    borrowed: 0,
    available: 3,
    reservations: 0,
    totalFines: 0
  })

  useEffect(() => {
    if (student?.id) {
      loadDashboardData()
    }
  }, [student?.id, student?.currentBorrowedBooks, student?.borrowingLimit])

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    if (!student?.id) return

    const interval = setInterval(() => {
      loadDashboardData()
    }, 30000)

    return () => clearInterval(interval)
  }, [student?.id])

  const loadDashboardData = async () => {
    if (!student?.id) return

    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [booksRes, reservationsRes, finesRes] = await Promise.all([
        transactionService.getIssuedBooks().catch(() => ({ data: [] })),
        reservationService.getReservations({ status: 'Active' }).catch(() => ({ data: [] })),
        fineService.getMemberFines(student.id).catch(() => ({ data: [] }))
      ])

      const borrowedBooks = booksRes.data || []
      const activeReservations = reservationsRes.data || []
      const memberFines = finesRes.data || []

      setIssuedBooks(borrowedBooks)
      setReservations(activeReservations)
      setFines(memberFines)

      // Calculate stats
      const totalFines = memberFines
        .filter(f => !f.isPaid)
        .reduce((sum, f) => sum + f.amount, 0)

      // Use currentBorrowedBooks from student object as source of truth
      const currentBorrowed = student.currentBorrowedBooks || borrowedBooks.length
      const borrowingLimit = student.borrowingLimit || 3

      setStats({
        borrowed: currentBorrowed,
        available: borrowingLimit - currentBorrowed,
        reservations: activeReservations.length,
        totalFines
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysRemaining = (dueDate) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getBookStatusBadge = (book) => {
    if (!book) return { variant: 'default', text: 'Unknown' }
    
    const statusConfig = {
      'Available': { variant: 'success', text: 'Available' },
      'Issued': { variant: 'warning', text: 'Issued' },
      'Damaged': { variant: 'error', text: 'Damaged' },
      'Lost': { variant: 'default', text: 'Lost' }
    }
    return statusConfig[book.status] || statusConfig.Available
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-secondary rounded-lg p-8 sm:p-12 text-white shadow-lg">
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome, {student?.name}!
          </h1>
          <p className="text-slate-300 mt-3 text-lg max-w-2xl leading-relaxed font-bold">
            Your personal library gateway. Keep track of your borrowed materials, manage reservations, and explore new academic horizons.
          </p>
          <div className="flex gap-4 mt-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-md border border-white/10">
              <BookCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">{stats.borrowed} Books Issued</span>
            </div>
            {stats.totalFines > 0 && (
              <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-md px-4 py-2 rounded-md border border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-sm font-bold text-red-200">Action Required: Fines</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-lg"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-lg"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Books Borrowed', value: `${stats.borrowed}`, sub: `Limit: ${student?.borrowingLimit || 3}`, icon: BookCheck, color: '#E76800', bg: 'bg-orange-50' },
          { label: 'Available Slots', value: stats.available, sub: 'For new issues', icon: BookOpen, color: '#10B981', bg: 'bg-green-50' },
          { label: 'Reservations', value: stats.reservations, sub: 'Active requests', icon: Clock, color: '#011039', bg: 'bg-slate-50' },
          { label: 'Total Fines', value: `Rs. ${stats.totalFines.toFixed(0)}`, sub: stats.totalFines > 0 ? 'Pending payment' : 'No dues', icon: DollarSign, color: stats.totalFines > 0 ? '#EF4444' : '#10B981', bg: stats.totalFines > 0 ? 'bg-red-50' : 'bg-green-50' }
        ].map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-lg overflow-hidden group">
            <CardContent className="p-8">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black mt-2 transition-transform origin-left duration-500" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                  <p className="text-xs font-bold text-slate-500 mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stat.color }}></span>
                    {stat.sub}
                  </p>
                </div>
                <div className={`w-14 h-14 rounded-md flex items-center justify-center ${stat.bg} transition-all duration-500 shadow-inner`}>
                  <stat.icon className="h-7 w-7" style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Currently Borrowed Books */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-extrabold text-secondary">Current Issues</h2>
            <span className="px-4 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              Recent 4 Books
            </span>
          </div>

          {issuedBooks.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookCheck className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-secondary">No active issues found</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto font-bold">Browse our library catalog to discover and borrow your next read.</p>
              <button 
                onClick={() => window.location.href = '/catalog'}
                className="mt-8 px-8 py-3 bg-primary text-white rounded-md font-bold hover:shadow-md hover:shadow-orange-600/20 transition-all"
              >
                Discover Books
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {issuedBooks.slice(0, 4).map((transaction) => {
                const daysRemaining = getDaysRemaining(transaction.dueDate)
                const isOverdue = daysRemaining < 0

                return (
                  <Card key={transaction._id} className="border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-lg overflow-hidden bg-white p-4">
                    <div className="flex gap-5 h-full">
                      <div className="w-28 flex-shrink-0">
                        <div className="aspect-[3/4] rounded-md overflow-hidden shadow-md transition-shadow">
                          <BookCover 
                            src={transaction.bookId?.coverImage} 
                            alt={transaction.bookId?.title}
                            size="full"
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                             <Badge variant={isOverdue ? 'danger' : 'success'} className="px-2.5 py-1 rounded-lg text-[9px] uppercase font-black tracking-widest">
                              {transaction.status}
                            </Badge>
                          </div>
                          <h4 className="font-extrabold text-secondary mt-2 line-clamp-2 leading-tight text-sm">
                            {transaction.bookId?.title}
                          </h4>
                          <p className="text-[10px] font-black text-primary mt-1 line-clamp-1 uppercase tracking-wider">
                            {transaction.bookId?.author}
                          </p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Due: {formatDate(transaction.dueDate)}</span>
                          </div>
                          <div className={`mt-2 px-3 py-2 rounded-md text-center shadow-sm ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest">
                              {isOverdue ? `Overdue by ${Math.abs(daysRemaining)} days` : `${daysRemaining} days left`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar Sections */}
        <div className="space-y-8">
          {/* Fines Card */}
          <div className="px-2">
             <h2 className="text-2xl font-extrabold text-secondary">Account Status</h2>
          </div>
          
          <Card className={`border-none rounded-lg shadow-lg overflow-hidden ${stats.totalFines > 0 ? 'bg-red-600' : 'bg-secondary'}`}>
            <CardContent className="p-8 text-white">
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 bg-white/20 rounded-md flex items-center justify-center backdrop-blur-md">
                  <DollarSign className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Dues Overview</span>
              </div>
              
              <div>
                <p className="text-white/60 text-xs font-black uppercase tracking-widest">Total Outstanding</p>
                <p className="text-5xl font-black mt-2">
                  <span className="text-2xl font-bold opacity-60 mr-1">Rs.</span>
                  {stats.totalFines.toFixed(0)}
                </p>
              </div>

              {stats.totalFines > 0 ? (
                <div className="mt-8 p-5 bg-white/10 rounded-md backdrop-blur-md border border-white/10 shadow-inner">
                  <p className="text-sm font-bold leading-relaxed">
                    Please visit the library to clear your dues and restore full borrowing privileges.
                  </p>
                </div>
              ) : (
                <div className="mt-8 p-5 bg-green-500/20 rounded-md backdrop-blur-md border border-green-500/20 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                  <p className="text-sm font-bold">Your account is in good standing.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Help */}
          <Card className="border-none rounded-lg shadow-sm bg-white p-8">
            <h3 className="text-lg font-extrabold text-secondary mb-4">Need Assistance?</h3>
            <p className="text-slate-500 text-sm font-bold leading-relaxed mb-6">
              Our library staff is here to help you. Reach out via live chat for instant support regarding your account or book issues.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-md border border-slate-100">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Library Hours</p>
                  <p className="text-xs font-bold text-secondary">Mon-Fri: 9AM - 5PM</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
