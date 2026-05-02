import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Bell,
  CheckCircle,
  X,
  BookOpen,
  User,
  Calendar,
  AlertCircle,
  Filter,
  Check,
  XCircle,
} from 'lucide-react'
import { reservationService } from '@/services/reservationService'
import { bookService } from '@/services/bookService'
import { memberService } from '@/services/memberService'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function Reservations() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [createModal, setCreateModal] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [notifyModal, setNotifyModal] = useState(false)
  const [fulfillModal, setFulfillModal] = useState(false)
  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedReservation, setSelectedReservation] = useState(null)

  // Create reservation form
  const [bookSearch, setBookSearch] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [notes, setNotes] = useState('')

  // Fetch reservations
  const { data, isLoading } = useQuery({
    queryKey: ['reservations', page, statusFilter],
    queryFn: () =>
      reservationService.getReservations({
        page,
        limit: 10,
        status: statusFilter || undefined,
      }),
  })

  // Search books
  const { data: booksData } = useQuery({
    queryKey: ['books-search', bookSearch],
    queryFn: () => bookService.getBooks({ search: bookSearch, limit: 10 }),
    enabled: bookSearch.length > 0 && createModal,
  })

  // Filter to show only unavailable books
  const unavailableBooks = booksData?.data?.filter(book => book.availableCopies === 0) || []

  // Search members
  const { data: membersData } = useQuery({
    queryKey: ['members-search', memberSearch],
    queryFn: () => memberService.getMembers({ search: memberSearch, limit: 5 }),
    enabled: memberSearch.length > 0 && createModal,
  })

  // Create reservation
  const createMutation = useMutation({
    mutationFn: reservationService.createReservation,
    onSuccess: () => {
      toast.success('Reservation created successfully')
      queryClient.invalidateQueries(['reservations'])
      handleCloseCreateModal()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create reservation')
    },
  })

  // Cancel reservation
  const cancelMutation = useMutation({
    mutationFn: reservationService.deleteReservation,
    onSuccess: () => {
      toast.success('Reservation cancelled successfully')
      queryClient.invalidateQueries(['reservations'])
      setCancelModal(false)
      setSelectedReservation(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel reservation')
    },
  })

  // Notify member
  const notifyMutation = useMutation({
    mutationFn: reservationService.notifyReservation,
    onSuccess: () => {
      toast.success('Member notified successfully')
      queryClient.invalidateQueries(['reservations'])
      setNotifyModal(false)
      setSelectedReservation(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to notify member')
    },
  })

  // Fulfill reservation
  const fulfillMutation = useMutation({
    mutationFn: reservationService.fulfillReservation,
    onSuccess: () => {
      toast.success('Reservation marked as fulfilled')
      queryClient.invalidateQueries(['reservations'])
      setFulfillModal(false)
      setSelectedReservation(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to fulfill reservation')
    },
  })

  // Approve reservation
  const approveMutation = useMutation({
    mutationFn: reservationService.approveReservation,
    onSuccess: () => {
      toast.success('Reservation request approved successfully')
      queryClient.invalidateQueries(['reservations'])
      setApproveModal(false)
      setSelectedReservation(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to approve reservation')
    },
  })

  // Reject reservation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => reservationService.rejectReservation(id, reason),
    onSuccess: () => {
      toast.success('Reservation request rejected')
      queryClient.invalidateQueries(['reservations'])
      setRejectModal(false)
      setSelectedReservation(null)
      setRejectReason('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject reservation')
    },
  })

  const handleCloseCreateModal = () => {
    setCreateModal(false)
    setSelectedBook(null)
    setSelectedMember(null)
    setBookSearch('')
    setMemberSearch('')
    setNotes('')
  }

  const handleCreateReservation = () => {
    if (!selectedBook || !selectedMember) {
      toast.error('Please select both book and member')
      return
    }

    createMutation.mutate({
      bookId: selectedBook._id,
      memberId: selectedMember._id,
      notes,
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'warning',
      Active: 'info',
      Notified: 'info',
      Fulfilled: 'success',
      Cancelled: 'default',
      Expired: 'danger',
    }
    return colors[status] || 'default'
  }

  const filteredReservations = data?.data?.filter((reservation) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      reservation.bookId?.title?.toLowerCase().includes(search) ||
      reservation.bookId?.author?.toLowerCase().includes(search) ||
      reservation.memberId?.name?.toLowerCase().includes(search) ||
      reservation.memberId?.memberId?.toLowerCase().includes(search)
    )
  })

  const stats = data?.data?.reduce(
    (acc, reservation) => {
      acc.total++
      if (reservation.status === 'Pending') acc.pending++
      if (reservation.status === 'Notified') acc.notified++
      if (reservation.status === 'Fulfilled') acc.fulfilled++
      return acc
    },
    { total: 0, pending: 0, notified: 0, fulfilled: 0 }
  ) || { total: 0, pending: 0, notified: 0, fulfilled: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Reservations</h1>
          <p className="text-gray-600 mt-1">Manage book reservations and waiting lists</p>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <Plus className="h-4 w-4" />
          New Reservation
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reservations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-warning-600 mt-1">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-warning-400" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Notified</p>
                <p className="text-2xl font-bold text-info-600 mt-1">{stats.notified}</p>
              </div>
              <Bell className="h-8 w-8 text-info-400" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fulfilled</p>
                <p className="text-2xl font-bold text-success-600 mt-1">{stats.fulfilled}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by book, member name, or member ID..."
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
                <option value="">All Status</option>
                <option value="Pending">Pending Approval</option>
                <option value="Active">Active</option>
                <option value="Notified">Notified</option>
                <option value="Fulfilled">Fulfilled</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Reservations Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <LoadingSpinner />
          </div>
        ) : filteredReservations?.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No reservations found"
            description="No book reservations match your search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Book
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reservation Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations?.map((reservation) => (
                  <tr key={reservation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                          #{reservation.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <Link
                          to={`/admin/books/${reservation.bookId?._id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          {reservation.bookId?.title}
                        </Link>
                        <p className="text-gray-600">{reservation.bookId?.author}</p>
                        <p className="text-xs text-gray-500">
                          {reservation.bookId?.accessionNumber}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <Link
                          to={`/members/${reservation.memberId?._id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          {reservation.memberId?.name}
                        </Link>
                        <p className="text-gray-600">{reservation.memberId?.memberId}</p>
                        {reservation.memberId?.phone && (
                          <p className="text-xs text-gray-500">{reservation.memberId?.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(reservation.reservationDate), 'PP')}
                      </div>
                      {reservation.notifiedDate && (
                        <div className="text-xs text-gray-500">
                          Notified: {format(new Date(reservation.notifiedDate), 'PP')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(reservation.status)}>
                        {reservation.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {reservation.status === 'Pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReservation(reservation)
                                setApproveModal(true)
                              }}
                              title="Approve reservation"
                              style={{borderColor: '#28A745', color: '#28A745'}}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReservation(reservation)
                                setRejectModal(true)
                              }}
                              title="Reject reservation"
                              style={{borderColor: '#DC3545', color: '#DC3545'}}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {reservation.status === 'Active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReservation(reservation)
                              setNotifyModal(true)
                            }}
                            title="Notify member"
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                        )}
                        {reservation.status === 'Notified' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReservation(reservation)
                              setFulfillModal(true)
                            }}
                            title="Mark as fulfilled"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {(reservation.status === 'Pending' ||
                          reservation.status === 'Active' ||
                          reservation.status === 'Notified') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReservation(reservation)
                              setCancelModal(true)
                            }}
                            title="Cancel reservation"
                          >
                            <X className="h-4 w-4 text-danger-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pagination.pages}
          onPageChange={setPage}
        />
      )}

      {/* Create Reservation Modal */}
      <Modal
        isOpen={createModal}
        onClose={handleCloseCreateModal}
        title="Create Reservation"
        size="lg"
      >
        <div className="space-y-6">
          {/* Book Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Book *
            </label>
            {selectedBook ? (
              <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{selectedBook.title}</p>
                  <p className="text-sm text-gray-600">{selectedBook.author}</p>
                  <p className="text-xs text-gray-500">{selectedBook.accessionNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBook(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Search books by title, author, or accession number..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                />
                {bookSearch && unavailableBooks.length > 0 && (
                  <div className="border border-gray-200 rounded-lg divide-y max-h-60 overflow-y-auto">
                    {unavailableBooks.map((book) => (
                      <button
                        key={book._id}
                        onClick={() => {
                          setSelectedBook(book)
                          setBookSearch('')
                        }}
                        className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{book.title}</p>
                        <p className="text-sm text-gray-600">{book.author}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {book.accessionNumber}
                          </span>
                          <Badge variant="danger">
                            Not available
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {bookSearch && booksData?.data?.length > 0 && unavailableBooks.length === 0 && (
                  <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600">
                      No unavailable books found. All matching books are currently available for direct issue.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Reservations are only for books that are currently issued.
                    </p>
                  </div>
                )}
                {bookSearch && !booksData?.data?.length && (
                  <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600">No books found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Member *
            </label>
            {selectedMember ? (
              <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{selectedMember.name}</p>
                  <p className="text-sm text-gray-600">{selectedMember.memberId}</p>
                  {selectedMember.phone && (
                    <p className="text-xs text-gray-500">{selectedMember.phone}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMember(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Search members by name, ID, or phone..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
                {memberSearch && membersData?.data?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg divide-y max-h-60 overflow-y-auto">
                    {membersData.data.map((member) => (
                      <button
                        key={member._id}
                        onClick={() => {
                          setSelectedMember(member)
                          setMemberSearch('')
                        }}
                        className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-600">{member.memberId}</p>
                            {member.phone && (
                              <p className="text-xs text-gray-500">{member.phone}</p>
                            )}
                          </div>
                          {member.isBlocked && (
                            <Badge variant="danger">Blocked</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleCloseCreateModal}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateReservation} 
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              Create Reservation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Reservation Modal */}
      <Modal
        isOpen={cancelModal}
        onClose={() => {
          setCancelModal(false)
          setSelectedReservation(null)
        }}
        title="Cancel Reservation"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to cancel this reservation for{' '}
            <strong>{selectedReservation?.bookId?.title}</strong> by{' '}
            <strong>{selectedReservation?.memberId?.name}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCancelModal(false)
                setSelectedReservation(null)
              }}
              disabled={cancelMutation.isPending}
            >
              No, Keep It
            </Button>
            <Button
              variant="danger"
              onClick={() => cancelMutation.mutate(selectedReservation._id)}
              loading={cancelMutation.isPending}
              disabled={cancelMutation.isPending}
            >
              Yes, Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Notify Member Modal */}
      <Modal
        isOpen={notifyModal}
        onClose={() => {
          setNotifyModal(false)
          setSelectedReservation(null)
        }}
        title="Notify Member"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Notify <strong>{selectedReservation?.memberId?.name}</strong> that{' '}
            <strong>{selectedReservation?.bookId?.title}</strong> is now available?
          </p>
          {selectedReservation?.memberId?.phone && (
            <div className="bg-info-50 border border-info-200 rounded-lg p-3">
              <p className="text-sm text-info-700">
                <strong>Contact:</strong> {selectedReservation.memberId.phone}
              </p>
              {selectedReservation.memberId.email && (
                <p className="text-sm text-info-700">
                  <strong>Email:</strong> {selectedReservation.memberId.email}
                </p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setNotifyModal(false)
                setSelectedReservation(null)
              }}
              disabled={notifyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => notifyMutation.mutate(selectedReservation._id)}
              loading={notifyMutation.isPending}
              disabled={notifyMutation.isPending}
            >
              {!notifyMutation.isPending && <Bell className="h-4 w-4" />}
              Send Notification
            </Button>
          </div>
        </div>
      </Modal>

      {/* Fulfill Reservation Modal */}
      <Modal
        isOpen={fulfillModal}
        onClose={() => {
          setFulfillModal(false)
          setSelectedReservation(null)
        }}
        title="Fulfill Reservation"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Mark the reservation for <strong>{selectedReservation?.bookId?.title}</strong>{' '}
            by <strong>{selectedReservation?.memberId?.name}</strong> as fulfilled?
          </p>
          <div className="bg-success-50 border border-success-200 rounded-lg p-3">
            <p className="text-sm text-success-700">
              This indicates that the book has been issued to the member. Make sure to create
              a transaction record.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setFulfillModal(false)
                setSelectedReservation(null)
              }}
              disabled={fulfillMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => fulfillMutation.mutate(selectedReservation._id)}
              loading={fulfillMutation.isPending}
              disabled={fulfillMutation.isPending}
            >
              {!fulfillMutation.isPending && <CheckCircle className="h-4 w-4" />}
              Mark as Fulfilled
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve Reservation Modal */}
      <Modal
        isOpen={approveModal}
        onClose={() => {
          setApproveModal(false)
          setSelectedReservation(null)
        }}
        title="Approve Reservation Request"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Approve the reservation request for <strong>{selectedReservation?.bookId?.title}</strong>{' '}
            by <strong>{selectedReservation?.memberId?.name}</strong>?
          </p>
          <div className="bg-success-50 border border-success-200 rounded-lg p-3">
            <p className="text-sm text-success-700">
              The student will be able to collect this book when it becomes available.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setApproveModal(false)
                setSelectedReservation(null)
              }}
              disabled={approveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => approveMutation.mutate(selectedReservation._id)}
              loading={approveMutation.isPending}
              disabled={approveMutation.isPending}
              style={{backgroundColor: '#28A745'}}
            >
              {!approveMutation.isPending && <Check className="h-4 w-4" />}
              Approve Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Reservation Modal */}
      <Modal
        isOpen={rejectModal}
        onClose={() => {
          setRejectModal(false)
          setSelectedReservation(null)
          setRejectReason('')
        }}
        title="Reject Reservation Request"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Reject the reservation request for <strong>{selectedReservation?.bookId?.title}</strong>{' '}
            by <strong>{selectedReservation?.memberId?.name}</strong>?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rejection (Optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="Provide a reason for rejection..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setRejectModal(false)
                setSelectedReservation(null)
                setRejectReason('')
              }}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => rejectMutation.mutate({ id: selectedReservation._id, reason: rejectReason })}
              loading={rejectMutation.isPending}
              disabled={rejectMutation.isPending}
            >
              {!rejectMutation.isPending && <XCircle className="h-4 w-4" />}
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
