import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { BookCover } from '@/components/ui/BookCover'
import { transactionService } from '@/services/transactionService'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { BookOpen, Calendar, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentMyBooks() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const { student } = useMemberAuthStore()

  useEffect(() => {
    if (student?.id) {
      loadMyBooks()
    }
  }, [student?.id])

  const loadMyBooks = async () => {
    if (!student?.id) {
      return
    }
    
    try {
      setLoading(true)
      // Backend automatically filters by student ID for student requests
      const response = await transactionService.getIssuedBooks()
      setTransactions(response.data || [])
    } catch (error) {
      console.error('Error loading books:', error)
      toast.error('Failed to load your books')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Issued':
        return 'success'
      case 'Overdue':
        return 'danger'
      default:
        return 'default'
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{color: '#011039'}}>My Books</h1>
        <p className="text-gray-600 mt-1">Books currently issued to you</p>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          message="No books issued"
          description="You don't have any books currently issued. Browse the catalog to find books."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transactions.map((transaction) => {
            const daysRemaining = getDaysRemaining(transaction.dueDate)
            const isOverdue = daysRemaining < 0
            
            return (
              <Card key={transaction._id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <BookCover 
                      src={transaction.bookId?.coverImage} 
                      alt={transaction.bookId?.title}
                      className="w-20 h-28 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2" style={{color: '#011039'}}>
                        {transaction.bookId?.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                        {transaction.bookId?.author}
                      </p>
                      
                      <div className="space-y-2">
                        <Badge variant={getStatusBadgeVariant(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>Issued: {formatDate(transaction.issueDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              Due: {formatDate(transaction.dueDate)}
                            </span>
                          </div>
                          
                          {isOverdue ? (
                            <div className="flex items-center gap-1 text-red-600 font-medium">
                              <AlertCircle className="h-3 w-3" />
                              <span>Overdue by {Math.abs(daysRemaining)} days</span>
                            </div>
                          ) : (
                            <div className="text-gray-600">
                              <span>{daysRemaining} days remaining</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
