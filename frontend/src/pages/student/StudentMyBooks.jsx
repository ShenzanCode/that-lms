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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#011039] to-[#011039]/90 rounded-lg p-8 sm:p-10 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">My Issued Books</h1>
          <p className="text-slate-300 mt-2 text-lg">Manage and track your current borrowings</p>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-[#E76800]/10 rounded-full blur-3xl"></div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-lg p-16 text-center border-2 border-dashed border-slate-200">
           <BookOpen className="h-16 w-16 mx-auto text-slate-200 mb-6" />
           <h3 className="text-2xl font-bold text-[#011039]">No books issued</h3>
           <p className="text-slate-500 mt-2 max-w-sm mx-auto">Browse the Library Catalog to discover and borrow your next read.</p>
           <button 
             onClick={() => window.location.href = '/catalog'}
             className="mt-8 px-10 py-3.5 bg-[#011039] text-white rounded-lg font-bold hover:bg-[#E76800] hover:shadow-lg transition-all"
           >
             Explore Catalog
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {transactions.map((transaction) => {
            const daysRemaining = getDaysRemaining(transaction.dueDate)
            const isOverdue = daysRemaining < 0
            
            return (
              <Card key={transaction._id} className="border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-lg overflow-hidden bg-white p-5 group">
                <div className="flex gap-6">
                  <div className="w-32 flex-shrink-0">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-lg">
                      <BookCover 
                        src={transaction.bookId?.coverImage} 
                        alt={transaction.bookId?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-2">
                    <div>
                      <div className="flex justify-between items-start">
                        <Badge variant={isOverdue ? 'danger' : 'success'} className="px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider">
                          {transaction.status}
                        </Badge>
                      </div>
                      <h3 className="font-extrabold text-[#011039] mt-3 line-clamp-2 leading-snug">
                        {transaction.bookId?.title}
                      </h3>
                      <p className="text-sm font-bold text-slate-400 mt-1 line-clamp-1 italic">
                        {transaction.bookId?.author}
                      </p>
                    </div>
                    
                    <div className="mt-6 space-y-3 pt-5 border-t border-slate-50">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
                        <span className="text-slate-400">Issued</span>
                        <span className="text-slate-600">{formatDate(transaction.issueDate)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
                        <span className="text-slate-400">Due Date</span>
                        <span className={isOverdue ? 'text-red-500' : 'text-slate-600'}>{formatDate(transaction.dueDate)}</span>
                      </div>
                      
                      <div className={`mt-2 p-2.5 rounded-lg text-center shadow-inner ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
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
  )
}
