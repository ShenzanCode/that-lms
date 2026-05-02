import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  BookOpen, 
  Calendar, 
  User, 
  RefreshCw, 
  RotateCcw,
  AlertCircle 
} from 'lucide-react'
import { transactionService } from '@/services/transactionService'
import { fineService } from '@/services/fineService'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchBar } from '@/components/ui/SearchBar'
import { Pagination } from '@/components/ui/Pagination'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { format, differenceInDays } from 'date-fns'

export default function IssuedBooks() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [renewModal, setRenewModal] = useState({ open: false, transaction: null })
  const [returnModal, setReturnModal] = useState({ open: false, transaction: null })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['issued-books', page, search],
    queryFn: () => transactionService.getIssuedBooks({ page, limit: 10, search }),
  })

  // Fetch all fines to check for unpaid fines per transaction
  const { data: finesData } = useQuery({
    queryKey: ['all-fines'],
    queryFn: () => fineService.getFines({ limit: 1000 }),
  })

  const getTransactionUnpaidFines = (transactionId) => {
    if (!finesData?.data) return []
    return finesData.data.filter(fine => 
      fine.transactionId === transactionId && 
      (fine.amount - (fine.paidAmount || 0) - (fine.waivedAmount || 0)) > 0
    )
  }

  const hasUnpaidFines = (transactionId) => {
    return getTransactionUnpaidFines(transactionId).length > 0
  }

  const renewMutation = useMutation({
    mutationFn: transactionService.renewBook,
    onSuccess: () => {
      toast.success('Book renewed successfully')
      queryClient.invalidateQueries({ queryKey: ['issued-books'] })
      setRenewModal({ open: false, transaction: null })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to renew book')
    },
  })

  const returnMutation = useMutation({
    mutationFn: transactionService.returnBook,
    onSuccess: (data) => {
      if (data?.data?.fine > 0) {
        toast.success(`Book returned with fine of Rs ${data.data.fine}`)
      } else {
        toast.success('Book returned successfully')
      }
      queryClient.invalidateQueries(['issued-books'])
      queryClient.invalidateQueries(['all-fines'])
      setReturnModal({ open: false, transaction: null })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to return book'
      const errorData = error.response?.data?.data
      
      if (errorData?.totalUnpaidFine) {
        toast.error(errorMessage, {
          duration: 6000,
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
          },
        })
      } else {
        toast.error(errorMessage)
      }
      setReturnModal({ open: false, transaction: null })
    },
  })

  const handleRenew = () => {
    if (renewModal.transaction && !renewMutation.isPending) {
      renewMutation.mutate({ transactionId: renewModal.transaction._id })
    }
  }

  const handleReturn = () => {
    if (returnModal.transaction) {
      returnMutation.mutate({ 
        transactionId: returnModal.transaction._id,
        condition: 'Good'
      })
    }
  }

  const getDaysRemaining = (dueDate) => {
    return differenceInDays(new Date(dueDate), new Date())
  }

  const getStatusBadge = (transaction) => {
    const daysRemaining = getDaysRemaining(transaction.dueDate)
    
    if (transaction.status === 'Overdue' || daysRemaining < 0) {
      return <Badge variant="danger">Overdue ({Math.abs(daysRemaining)} days)</Badge>
    } else if (daysRemaining === 0) {
      return <Badge variant="warning">Due Today</Badge>
    } else if (daysRemaining <= 3) {
      return <Badge variant="warning">Due in {daysRemaining} days</Badge>
    } else {
      return <Badge variant="success">Active</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Issued Books</h1>
          <p className="mt-1" style={{color: '#011039'}}>Track and manage borrowed books</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link to="/transactions/issue">
            <Button variant="primary">
              <Plus className="h-4 w-4" />
              Issue Book
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <Card>
        <div className="p-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by book title, member name, or accession number..."
          />
        </div>
      </Card>

      {/* Statistics */}
      {data?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Issued</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {data.pagination.total}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Due Today</p>
                  <p className="text-2xl font-bold text-warning-600 mt-1">
                    {data.data.filter(t => getDaysRemaining(t.dueDate) === 0).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-warning-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-danger-600 mt-1">
                    {data.data.filter(t => t.status === 'Overdue' || getDaysRemaining(t.dueDate) < 0).length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-danger-600" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Due in 3 Days</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {data.data.filter(t => {
                      const days = getDaysRemaining(t.dueDate)
                      return days > 0 && days <= 3
                    }).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-gray-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Issued Books Table */}
      <Card>
        {isLoading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : data?.data?.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Renewals</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.data.map((transaction) => {
                    const daysRemaining = getDaysRemaining(transaction.dueDate)
                    const isOverdue = transaction.status === 'Overdue' || daysRemaining < 0
                    
                    return (
                      <tr key={transaction._id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-danger-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div>
                            <Link
                              to={`/books/${transaction.bookId?._id || '#'}`}
                              className="text-sm font-medium text-primary-600 hover:text-primary-700"
                            >
                              {transaction.bookId?.title || 'Unknown Book'}
                            </Link>
                            <p className="text-xs text-gray-600 mt-1">{transaction.bookId?.author || 'Unknown Author'}</p>
                            <p className="text-xs text-gray-500">Acc: {transaction.accessionNumber || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <Link
                              to={`/members/${transaction.memberId?._id || '#'}`}
                              className="text-sm font-medium text-primary-600 hover:text-primary-700"
                            >
                              {transaction.memberId?.name || 'Unknown Member'}
                            </Link>
                            <p className="text-xs text-gray-600 mt-1">{transaction.memberId?.memberId || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{transaction.memberId?.memberType || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {format(new Date(transaction.issueDate), 'PP')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className={isOverdue ? 'text-danger-600 font-medium' : 'text-gray-900'}>
                              {format(new Date(transaction.dueDate), 'PP')}
                            </p>
                            {!isOverdue && daysRemaining <= 3 && (
                              <p className="text-xs text-warning-600 mt-1">
                                {daysRemaining === 0 ? 'Due today' : `${daysRemaining} days left`}
                              </p>
                            )}
                            {isOverdue && (
                              <p className="text-xs text-danger-600 mt-1">
                                {Math.abs(daysRemaining)} days overdue
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(transaction)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {transaction.renewCount}/{transaction.maxRenewals}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {transaction.renewCount < transaction.maxRenewals && !isOverdue && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRenewModal({ open: true, transaction })}
                              >
                                <RotateCcw className="h-3 w-3" />
                                Renew
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReturnModal({ open: true, transaction })}
                            >
                              Return
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {data.pagination && (
              <div className="p-4 border-t">
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.pages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No issued books"
            description="No books are currently issued"
            action={
              <Link to="/transactions/issue">
                <Button variant="primary">
                  <Plus className="h-4 w-4" />
                  Issue Book
                </Button>
              </Link>
            }
          />
        )}
      </Card>

      {/* Renew Modal */}
      <Modal
        isOpen={renewModal.open}
        onClose={() => setRenewModal({ open: false, transaction: null })}
        title="Renew Book"
      >
        {renewModal.transaction && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Do you want to renew <strong>{renewModal.transaction.bookId?.title || 'Unknown Book'}</strong> for{' '}
              <strong>{renewModal.transaction.memberId?.name || 'Unknown Member'}</strong>?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Due Date:</span>
                <span className="font-medium">{format(new Date(renewModal.transaction.dueDate), 'PP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Renewals Used:</span>
                <span className="font-medium">{renewModal.transaction.renewCount}/{renewModal.transaction.maxRenewals}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setRenewModal({ open: false, transaction: null })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRenew}
                loading={renewMutation.isPending}
              >
                Renew Book
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={returnModal.open}
        onClose={() => setReturnModal({ open: false, transaction: null })}
        title="Return Book"
      >
        {returnModal.transaction && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Confirm return of <strong>{returnModal.transaction.bookId?.title || 'Unknown Book'}</strong> from{' '}
              <strong>{returnModal.transaction.memberId?.name || 'Unknown Member'}</strong>
            </p>
            <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Issue Date:</span>
                <span className="font-medium">{format(new Date(returnModal.transaction.issueDate), 'PP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{format(new Date(returnModal.transaction.dueDate), 'PP')}</span>
              </div>
              {(returnModal.transaction.status === 'Overdue' || getDaysRemaining(returnModal.transaction.dueDate) < 0) && (
                <div className="flex justify-between">
                  <span className="text-danger-600">Overdue:</span>
                  <span className="font-medium text-danger-600">
                    {Math.abs(getDaysRemaining(returnModal.transaction.dueDate))} days
                  </span>
                </div>
              )}
            </div>
            {hasUnpaidFines(returnModal.transaction._id) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-700 font-medium">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Book has unpaid fines
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  You can return the book, but fines will remain unpaid. Clear fines to borrow new books.
                </p>
                <Link to="/fines" className="text-xs text-primary-600 hover:text-primary-700 underline mt-2 inline-block">
                  Go to Fines Management
                </Link>
              </div>
            )}
            {(returnModal.transaction.status === 'Overdue' || getDaysRemaining(returnModal.transaction.dueDate) < 0) && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                <p className="text-sm text-warning-700">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  {hasUnpaidFines(returnModal.transaction._id) ? 'Existing fine will remain unpaid' : 'Fine will be calculated for overdue days'}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setReturnModal({ open: false, transaction: null })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReturn}
                loading={returnMutation.isPending}
              >
                Confirm Return
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
