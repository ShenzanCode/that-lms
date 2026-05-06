import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  DollarSign,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  FileText,
  Calendar,
  User,
  BookOpen,
  Gift,
  Filter,
  Bell,
} from 'lucide-react'
import { fineService } from '@/services/fineService'
import { MemberPhoto } from '@/components/ui/MemberPhoto'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'

export default function Fines() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modals
  const [paymentModal, setPaymentModal] = useState(false)
  const [waiverModal, setWaiverModal] = useState(false)
  const [selectedFine, setSelectedFine] = useState(null)
  
  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  
  // Waiver form
  const [waiverAmount, setWaiverAmount] = useState('')
  const [waiverReason, setWaiverReason] = useState('')

  // Fetch fine statistics
  const { data: statsData } = useQuery({
    queryKey: ['fine-stats'],
    queryFn: fineService.getFineStats,
  })

  // Fetch fines
  const { data: finesData, isLoading } = useQuery({
    queryKey: ['fines', page, statusFilter],
    queryFn: () =>
      fineService.getFines({
        page,
        limit: 10,
        isPaid: statusFilter === 'paid' ? true : statusFilter === 'unpaid' ? false : undefined,
      }),
  })

  // Pay fine mutation
  const payMutation = useMutation({
    mutationFn: fineService.payFine,
    onSuccess: (data) => {
      toast.success(data.message || 'Payment recorded successfully')
      queryClient.invalidateQueries(['fines'])
      queryClient.invalidateQueries(['all-fines'])
      queryClient.invalidateQueries(['fine-stats'])
      queryClient.invalidateQueries(['dashboard'])
      handleClosePaymentModal()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to record payment')
    },
  })

  // Waive fine mutation
  const waiveMutation = useMutation({
    mutationFn: ({ id, data }) => fineService.waiveFine(id, data),
    onSuccess: (data) => {
      toast.success(data.message || 'Fine waived successfully')
      queryClient.invalidateQueries(['fines'])
      queryClient.invalidateQueries(['all-fines'])
      queryClient.invalidateQueries(['fine-stats'])
      queryClient.invalidateQueries(['dashboard'])
      handleCloseWaiverModal()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to waive fine')
    },
  })

  // Notify member mutation
  const notifyMutation = useMutation({
    mutationFn: fineService.notifyFine,
    onSuccess: () => {
      toast.success('Member notified successfully about the fine')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to notify member')
    },
  })

  const handleOpenPaymentModal = (fine) => {
    setSelectedFine(fine)
    const outstanding = fine.amount - fine.paidAmount - fine.waivedAmount
    setPaymentAmount(outstanding.toString())
    setPaymentModal(true)
  }

  const handleClosePaymentModal = () => {
    setPaymentModal(false)
    setSelectedFine(null)
    setPaymentAmount('')
    setPaymentMethod('Cash')
  }

  const handlePaymentSubmit = (e) => {
    e.preventDefault()
    const amount = parseFloat(paymentAmount)
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    payMutation.mutate({
      fineId: selectedFine._id,
      amount,
      paymentMethod,
    })
  }

  const handleOpenWaiverModal = (fine) => {
    setSelectedFine(fine)
    const outstanding = fine.amount - fine.paidAmount - fine.waivedAmount
    setWaiverAmount(outstanding.toString())
    setWaiverModal(true)
  }

  const handleCloseWaiverModal = () => {
    setWaiverModal(false)
    setSelectedFine(null)
    setWaiverAmount('')
    setWaiverReason('')
  }

  const handleWaiverSubmit = (e) => {
    e.preventDefault()
    const amount = parseFloat(waiverAmount)
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!waiverReason.trim()) {
      toast.error('Please provide a reason for waiver')
      return
    }

    waiveMutation.mutate({
      id: selectedFine._id,
      data: { amount, reason: waiverReason },
    })
  }

  const filteredFines = finesData?.data?.filter((fine) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      fine.memberId?.name?.toLowerCase().includes(search) ||
      fine.memberId?.memberId?.toLowerCase().includes(search) ||
      fine.bookId?.title?.toLowerCase().includes(search) ||
      fine.receiptNumber?.toLowerCase().includes(search)
    )
  })

  const stats = statsData?.data || {
    totalFines: 0,
    collected: 0,
    waived: 0,
    outstanding: 0,
    unpaidCount: 0,
    paidCount: 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fine Management</h1>
        <p className="text-gray-600 mt-1">Track and manage library fines and payments</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Fines</p>
                <p className="text-2xl font-bold mt-1" style={{color: '#011039'}}>
                  Rs {stats.totalFines.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8" style={{color: '#E76800'}} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Collected</p>
                <p className="text-2xl font-bold text-success-600 mt-1">
                  Rs {stats.collected.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Waived</p>
                <p className="text-2xl font-bold text-info-600 mt-1">
                  Rs {stats.waived.toLocaleString()}
                </p>
              </div>
              <Gift className="h-8 w-8 text-info-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-danger-600 mt-1">
                  Rs {stats.outstanding.toLocaleString()}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-danger-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by member name, member ID, book title, or receipt number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Fines</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fines Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredFines?.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No fines found"
            description="No fine records match your search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Book
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFines?.map((fine) => {
                  const outstanding = fine.amount - fine.paidAmount - fine.waivedAmount
                  return (
                    <tr key={fine._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <MemberPhoto
                            src={fine.memberId?.photo}
                            alt={fine.memberId?.name}
                            size="sm"
                          />
                          <div className="text-sm">
                            <Link
                              to={`/admin/members/${fine.memberId?._id}`}
                              className="font-bold text-primary-600 hover:text-primary-700"
                            >
                              {fine.memberId?.name}
                            </Link>
                            <p className="text-gray-600">{fine.memberId?.memberId}</p>
                            {fine.memberId?.phone && (
                              <p className="text-xs text-gray-500">{fine.memberId.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <Link
                            to={`/admin/books/${fine.bookId?._id}`}
                            className="font-bold text-primary-600 hover:text-primary-700"
                          >
                            {fine.bookId?.title}
                          </Link>
                          <p className="text-gray-600 text-xs">{fine.bookId?.author}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <Badge variant={fine.reason === 'Overdue' ? 'warning' : 'danger'}>
                            {fine.reason}
                          </Badge>
                          {fine.description && (
                            <p className="text-xs text-gray-500 mt-1">{fine.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-bold" style={{color: '#011039'}}>Rs {fine.amount}</p>
                          {fine.paidAmount > 0 && (
                            <p className="text-xs text-success-600">Paid: Rs {fine.paidAmount}</p>
                          )}
                          {fine.waivedAmount > 0 && (
                            <p className="text-xs text-info-600">
                              Waived: Rs {fine.waivedAmount}
                            </p>
                          )}
                          {outstanding > 0 && (
                            <p className="text-xs text-danger-600 font-bold">
                              Due: Rs {outstanding}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge variant={fine.isPaid ? 'success' : 'danger'}>
                            {fine.isPaid ? 'Paid' : 'Unpaid'}
                          </Badge>
                          {fine.receiptNumber && (
                            <p className="text-xs text-gray-500">#{fine.receiptNumber}</p>
                          )}
                          {fine.paidDate && (
                            <p className="text-xs text-gray-500">
                              {formatDate(fine.paidDate)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {!fine.isPaid && outstanding > 0 && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenPaymentModal(fine)}
                                title="Record payment"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenWaiverModal(fine)}
                                title="Waive fine"
                              >
                                <Gift className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => notifyMutation.mutate(fine._id)}
                                disabled={notifyMutation.isPending}
                                title="Notify member"
                                style={{borderColor: '#E76800', color: '#E76800'}}
                              >
                                <Bell className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {finesData?.pagination && finesData.pagination.pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={finesData.pagination.pages}
          onPageChange={setPage}
        />
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={paymentModal}
        onClose={handleClosePaymentModal}
        title="Record Payment"
        size="md"
      >
        {selectedFine && (
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            {/* Fine Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Member:</span>
                <span className="font-bold">{selectedFine.memberId?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Book:</span>
                <span className="font-bold">{selectedFine.bookId?.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Fine:</span>
                <span className="font-bold">Rs {selectedFine.amount}</span>
              </div>
              {selectedFine.paidAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Already Paid:</span>
                  <span className="text-success-600">Rs {selectedFine.paidAmount}</span>
                </div>
              )}
              {selectedFine.waivedAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Waived:</span>
                  <span className="text-info-600">Rs {selectedFine.waivedAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-600 font-bold">Outstanding:</span>
                <span className="font-bold text-danger-600">
                  Rs {selectedFine.amount - selectedFine.paidAmount - selectedFine.waivedAmount}
                </span>
              </div>
            </div>

            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Payment Amount (Rs) *
              </label>
              <Input
                type="number"
                value={paymentAmount}
                readOnly
                disabled
                className="bg-gray-100 cursor-not-allowed"
                placeholder="Full payment required"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Note: Full payment is required. Partial payments are not allowed.
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClosePaymentModal}
                disabled={payMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={payMutation.isPending}
                disabled={payMutation.isPending}
              >
                {!payMutation.isPending && <CheckCircle className="h-4 w-4" />}
                Record Payment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Waiver Modal */}
      <Modal
        isOpen={waiverModal}
        onClose={handleCloseWaiverModal}
        title="Waive Fine"
        size="md"
      >
        {selectedFine && (
          <form onSubmit={handleWaiverSubmit} className="space-y-6">
            {/* Fine Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Member:</span>
                <span className="font-bold">{selectedFine.memberId?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Book:</span>
                <span className="font-bold">{selectedFine.bookId?.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Outstanding:</span>
                <span className="font-bold text-danger-600">
                  Rs {selectedFine.amount - selectedFine.paidAmount - selectedFine.waivedAmount}
                </span>
              </div>
            </div>

            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
              <p className="text-sm text-warning-800">
                Waiving fines requires proper authorization and justification. Please provide
                a valid reason.
              </p>
            </div>

            {/* Waiver Amount */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Waiver Amount (Rs) *
              </label>
              <Input
                type="number"
                value={waiverAmount}
                onChange={(e) => setWaiverAmount(e.target.value)}
                placeholder="Enter amount to waive"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Waiver Reason */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Reason for Waiver *
              </label>
              <textarea
                value={waiverReason}
                onChange={(e) => setWaiverReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Provide a detailed reason for waiving this fine..."
                required
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseWaiverModal}
                disabled={waiveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={waiveMutation.isPending}
                disabled={waiveMutation.isPending}
              >
                {!waiveMutation.isPending && <Gift className="h-4 w-4" />}
                Waive Fine
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
