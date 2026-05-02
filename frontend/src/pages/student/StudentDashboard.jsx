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
      'Not Available': { variant: 'warning', text: 'Not Available' },
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{color: '#011039'}}>
          Welcome, {student?.name}!
        </h1>
        <p className="text-gray-600 mt-1">Here's your library overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Books Borrowed</p>
                <p className="text-2xl font-bold mt-1" style={{color: '#E76800'}}>
                  {stats.borrowed}<span className="text-sm text-gray-500">/{student?.borrowingLimit || 3}</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#E7680020'}}>
                <BookCheck className="h-6 w-6" style={{color: '#E76800'}} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Slots</p>
                <p className="text-2xl font-bold mt-1" style={{color: '#28A745'}}>
                  {stats.available}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#28A74520'}}>
                <BookOpen className="h-6 w-6" style={{color: '#28A745'}} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Reservations</p>
                <p className="text-2xl font-bold mt-1" style={{color: '#FFC107'}}>
                  {stats.reservations}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#FFC10720'}}>
                <Clock className="h-6 w-6" style={{color: '#FFC107'}} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unpaid Fines</p>
                <p className="text-2xl font-bold mt-1" style={{color: stats.totalFines > 0 ? '#DC3545' : '#28A745'}}>
                  Rs. {stats.totalFines.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: stats.totalFines > 0 ? '#DC354520' : '#28A74520'}}>
                <DollarSign className="h-6 w-6" style={{color: stats.totalFines > 0 ? '#DC3545' : '#28A745'}} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currently Borrowed Books */}
      <Card>
        <CardHeader>
          <CardTitle style={{color: '#011039'}}>Currently Borrowed Books</CardTitle>
        </CardHeader>
        <CardContent>
          {issuedBooks.length === 0 ? (
            <div className="text-center py-8">
              <BookCheck className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No books currently borrowed</p>
              <p className="text-sm text-gray-500 mt-1">Visit the Book Catalog to find books</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {issuedBooks.slice(0, 4).map((transaction) => {
                const daysRemaining = getDaysRemaining(transaction.dueDate)
                const isOverdue = daysRemaining < 0
                const bookStatusBadge = getBookStatusBadge(transaction.bookId)

                return (
                  <div key={transaction._id} className="flex gap-3 p-3 border rounded-lg">
                    <BookCover 
                      src={transaction.bookId?.coverImage} 
                      alt={transaction.bookId?.title}
                      className="w-16 h-24 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm line-clamp-1" style={{color: '#011039'}}>
                        {transaction.bookId?.title}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-1">
                        {transaction.bookId?.author}
                      </p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={isOverdue ? 'danger' : 'success'} className="text-xs">
                            {transaction.status}
                          </Badge>
                          <Badge variant={bookStatusBadge.variant} className="text-xs">
                            {bookStatusBadge.text}
                          </Badge>
                        </div>
                        <div className="text-xs">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {formatDate(transaction.dueDate)}</span>
                          </div>
                          {isOverdue ? (
                            <p className="text-red-600 font-medium mt-1">
                              Overdue by {Math.abs(daysRemaining)} days
                            </p>
                          ) : (
                            <p className="text-gray-600 mt-1">
                              {daysRemaining} days remaining
                            </p>
                          )}
                        </div>
                        {transaction.bookId && (
                          <div className="text-xs text-gray-600 mt-1">
                            Copies: {transaction.bookId.availableCopies || 0}/{transaction.bookId.totalCopies || 0}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outstanding Fines */}
      {stats.totalFines > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{color: '#DC3545'}}>
              <AlertCircle className="h-5 w-5" />
              Outstanding Fines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">
                You have unpaid fines totaling Rs. {stats.totalFines.toFixed(2)}
              </p>
              <p className="text-sm text-red-600 mt-1">
                Please clear your fines to continue borrowing books.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
