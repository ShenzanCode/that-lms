import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Search,
  BookX,
  Calendar,
  User,
  BookOpen,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Clock,
  ArrowLeft,
} from 'lucide-react'
import { transactionService } from '@/services/transactionService'
import { settingsService } from '@/services/settingsService'
import { fineService } from '@/services/fineService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatDate, calculateDaysUntil } from '@/lib/utils'

export default function ReturnBook() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [condition, setCondition] = useState('Good')
  const [notes, setNotes] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch issued books
  const { data: issuedBooksData, isLoading } = useQuery({
    queryKey: ['issued-books', debouncedSearch],
    queryFn: () => transactionService.getIssuedBooks({ search: debouncedSearch }),
  })

  // Fetch settings for fine calculation
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
  })

  // Fetch all fines to check for existing unpaid fines
  const { data: finesData } = useQuery({
    queryKey: ['all-fines'],
    queryFn: () => fineService.getFines({ limit: 1000 }),
    enabled: !!issuedBooksData?.data?.length,
  })

  // Return book mutation
  const returnMutation = useMutation({
    mutationFn: transactionService.returnBook,
    onSuccess: (data) => {
      toast.success(data.message || 'Book returned successfully')
      queryClient.invalidateQueries(['issued-books'])
      queryClient.invalidateQueries(['dashboard'])
      setShowReturnModal(false)
      setSelectedTransaction(null)
      setSearchQuery('')
      setCondition('Good')
      setNotes('')
      
      // Show fine notification if applicable
      if (data.data?.fine > 0) {
        toast.error(`Fine charged: Rs ${data.data.fine}`, { duration: 5000 })
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to return book';
      const errorData = error.response?.data?.data;
      
      // Check if error is due to unpaid fines
      if (errorData?.unpaidFines && errorData?.totalUnpaidFine) {
        toast.error(errorMessage, {
          duration: 8000,
          icon: '💰',
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
            border: '1px solid #FECACA',
          },
        });
        
        // Show fine payment options
        setSelectedTransaction(prev => ({
          ...prev,
          unpaidFines: errorData.unpaidFines,
          totalUnpaidFine: errorData.totalUnpaidFine
        }));
      } else {
        toast.error(errorMessage);
      }
    },
  })

  const handleReturnClick = (transaction) => {
    setSelectedTransaction(transaction)
    setShowReturnModal(true)
  }

  const handleReturnSubmit = (e) => {
    e.preventDefault()
    returnMutation.mutate({
      transactionId: selectedTransaction._id,
      condition,
      notes: notes.trim(),
    })
  }

  const calculateFine = (dueDate) => {
    const today = new Date()
    const due = new Date(dueDate)
    if (today <= due) return 0
    const daysOverdue = Math.ceil((today - due) / (1000 * 60 * 60 * 24))
    const finePerDay = settingsData?.data?.fineRates?.perDay || 100 // Get from settings
    const maxFine = settingsData?.data?.fineRates?.maxFine || 500
    return Math.min(daysOverdue * finePerDay, maxFine)
  }

  const hasUnpaidFines = (transactionId) => {
    if (!finesData?.data) return false
    const transactionFines = finesData.data.filter(fine => 
      fine.transactionId === transactionId && 
      !fine.isPaid && 
      (fine.amount - (fine.paidAmount || 0) - (fine.waivedAmount || 0)) > 0
    )
    return transactionFines.length > 0
  }

  const isOverdue = (dueDate) => {
    return new Date() > new Date(dueDate)
  }

  const getDaysStatus = (dueDate) => {
    const days = calculateDaysUntil(dueDate)
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, color: 'danger' }
    if (days === 0) return { text: 'Due today', color: 'warning' }
    if (days <= 3) return { text: `${days} days left`, color: 'warning' }
    return { text: `${days} days left`, color: 'success' }
  }

  const filteredTransactions = issuedBooksData?.data || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Return Book</h1>
          <p className="text-gray-600 mt-1">Process book returns and calculate fines</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/transactions/issued')}>
          <Clock className="h-4 w-4 mr-2" />
          View All Issued Books
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by book title, accession number, member name, or member ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-lg"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Search for currently issued books to process returns
          </p>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issued books found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'There are no books currently issued'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => {
            const overdue = isOverdue(transaction.dueDate)
            const fine = calculateFine(transaction.dueDate)
            const daysStatus = getDaysStatus(transaction.dueDate)

            return (
              <Card key={transaction._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Book Info */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-16 bg-primary-100 rounded flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {transaction.bookId?.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            by {transaction.bookId?.author}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {transaction.accessionNumber}
                            </span>
                            <span>•</span>
                            <span>{transaction.bookId?.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Member Info */}
                      <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {transaction.memberId?.name}
                        </span>
                        <span className="text-gray-500">
                          ({transaction.memberId?.memberId})
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {transaction.memberId?.memberType}
                        </Badge>
                      </div>

                      {/* Transaction Details */}
                      <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Issue Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(transaction.issueDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Due Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(transaction.dueDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <Badge variant={daysStatus.color}>
                            {daysStatus.text}
                          </Badge>
                        </div>
                      </div>

                      {/* Overdue Warning & Fine */}
                      {overdue && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">
                              Book is overdue
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                              Fine to be charged: <strong>Rs {fine}</strong> (Rs {settingsData?.data?.fineRates?.perDay || 100} per day)
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Renewal Info */}
                      {transaction.renewCount > 0 && (
                        <div className="text-sm text-gray-500">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Renewed {transaction.renewCount} time(s)
                        </div>
                      )}
                    </div>

                    {/* Return Button */}
                    <div className="ml-6 flex-shrink-0">
                      <Button
                        onClick={() => handleReturnClick(transaction)}
                        className="min-w-[120px]"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Return Book
                      </Button>
                      {hasUnpaidFines(transaction._id) && (
                        <p className="text-xs text-orange-600 mt-1 text-center">
                          Fine will remain unpaid
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Return Confirmation Modal */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false)
          setSelectedTransaction(null)
          setCondition('Good')
          setNotes('')
        }}
        title="Return Book"
      >
        {selectedTransaction && (
          <form onSubmit={handleReturnSubmit} className="space-y-6">
            {/* Book Details Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Book:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedTransaction.bookId?.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Member:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedTransaction.memberId?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Issue Date:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(selectedTransaction.issueDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Due Date:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(selectedTransaction.dueDate)}
                </span>
              </div>
            </div>

            {/* Fine Information */}
            {isOverdue(selectedTransaction.dueDate) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-900 mb-1">
                      Overdue Fine
                    </h4>
                    <p className="text-sm text-red-700">
                      This book is{' '}
                      {Math.ceil(
                        (new Date() - new Date(selectedTransaction.dueDate)) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      days overdue.
                    </p>
                    <p className="text-lg font-bold text-red-900 mt-2">
                      Fine Amount: Rs {calculateFine(selectedTransaction.dueDate)}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      This fine will be recorded and must be paid by the member
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Unpaid Fines Warning */}
            {selectedTransaction.unpaidFines && selectedTransaction.unpaidFines.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-900 mb-2">
                      Outstanding Fines Must Be Paid
                    </h4>
                    <p className="text-sm text-red-700 mb-3">
                      This book cannot be returned until the following fines are paid or waived:
                    </p>
                    <div className="space-y-2">
                      {selectedTransaction.unpaidFines.map((fine, index) => (
                        <div key={index} className="bg-white rounded p-3 border border-red-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              {fine.reason} - {fine.description}
                            </span>
                            <span className="text-sm font-bold text-red-900">
                              Rs {fine.amount - (fine.paidAmount || 0) - (fine.waivedAmount || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-red-900">Total Outstanding:</span>
                        <span className="text-lg font-bold text-red-900">
                          Rs {selectedTransaction.totalUnpaidFine}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        onClick={() => navigate(`/admin/fines?member=${selectedTransaction.memberId._id}`)}
                        variant="outline"
                        className="text-red-700 border-red-300 hover:bg-red-50"
                      >
                        Go to Pay Fines
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Book Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Book Condition
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['Excellent', 'Good', 'Fair', 'Poor'].map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                      condition === cond
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the book condition or return..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowReturnModal(false)
                  setSelectedTransaction(null)
                  setCondition('Good')
                  setNotes('')
                }}
                disabled={returnMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  returnMutation.isPending || 
                  (selectedTransaction.unpaidFines && selectedTransaction.unpaidFines.length > 0)
                }
                className={`flex-1 ${
                  selectedTransaction.unpaidFines && selectedTransaction.unpaidFines.length > 0
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {returnMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : selectedTransaction.unpaidFines && selectedTransaction.unpaidFines.length > 0 ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Pay Fines First
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Return
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
