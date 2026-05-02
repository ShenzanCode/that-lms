import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Ban, 
  CheckCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  BookOpen,
  AlertCircle,
  DollarSign,
  User
} from 'lucide-react'
import { memberService } from '@/services/memberService'
import { MemberPhoto } from '@/components/ui/MemberPhoto'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import AlertDialog from '@/components/ui/AlertDialog'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function MemberDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [blockModal, setBlockModal] = useState({ open: false })
  const [blockReason, setBlockReason] = useState('')
  const [deleteModal, setDeleteModal] = useState(false)
  const [unblockDialog, setUnblockDialog] = useState(false)
  const [activeBooksWarning, setActiveBooksWarning] = useState({ 
    open: false, 
    type: '', // 'delete' or 'block'
    bookCount: 0,
    bookDetails: [],
    hasUnpaidFines: false,
    totalUnpaidAmount: 0
  })
  const [checkingStatus, setCheckingStatus] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => memberService.getMember(id),
    onError: () => {
      toast.error('Failed to load member details')
      navigate('/members')
    },
  })

  const blockMutation = useMutation({
    mutationFn: ({ id, reason, force }) => memberService.blockMember(id, reason, force),
    onSuccess: () => {
      toast.success('Member blocked successfully')
      queryClient.invalidateQueries(['member', id])
      setBlockModal({ open: false })
      setBlockReason('')
      setActiveBooksWarning({ open: false, type: '', bookCount: 0, bookDetails: [], hasUnpaidFines: false, totalUnpaidAmount: 0 })
    },
    onError: (error) => {
      if (error.response?.data?.requiresConfirmation) {
        toast.error('Please confirm blocking member with active books')
      } else {
        toast.error(error.response?.data?.message || 'Failed to block member')
      }
    },
  })

  const unblockMutation = useMutation({
    mutationFn: (id) => memberService.unblockMember(id),
    onSuccess: () => {
      toast.success('Member unblocked successfully')
      queryClient.invalidateQueries(['member', id])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unblock member')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, force }) => memberService.deleteMember(id, force),
    onSuccess: () => {
      toast.success('Member deleted successfully')
      navigate('/members')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete member')
    },
  })

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      toast.error('Please provide a reason for blocking')
      return
    }
    
    setCheckingStatus(true)
    try {
      // Check if member has active books
      const statusResponse = await memberService.checkMemberStatus(id)
      const { hasActiveBooks, activeBookCount, activeBooks } = statusResponse.data
      
      if (hasActiveBooks) {
        // Close block modal and show warning
        setBlockModal({ open: false })
        setActiveBooksWarning({
          open: true,
          type: 'block',
          bookCount: activeBookCount,
          bookDetails: activeBooks
        })
      } else {
        // No active books, proceed normally
        blockMutation.mutate({ id, reason: blockReason, force: false })
      }
    } catch (error) {
      toast.error('Failed to check member status')
      console.error('Error checking member status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleForceBlock = () => {
    if (!blockReason.trim()) {
      toast.error('Please provide a reason for blocking')
      return
    }
    // Block even with active books
    blockMutation.mutate({ id, reason: blockReason, force: true })
  }

  const handleUnblock = () => {
    setUnblockDialog(true)
  }

  const handleConfirmUnblock = () => {
    unblockMutation.mutate(id)
    setUnblockDialog(false)
  }

  const handleDeleteClick = async () => {
    setCheckingStatus(true)
    try {
      // Check if member has active books or unpaid fines
      const statusResponse = await memberService.checkMemberStatus(id)
      const { hasActiveBooks, activeBookCount, activeBooks, hasUnpaidFines, totalUnpaidAmount } = statusResponse.data
      
      if (hasActiveBooks || hasUnpaidFines) {
        // Show warning dialog about active books/fines
        setDeleteModal(false)
        setActiveBooksWarning({
          open: true,
          type: 'delete',
          bookCount: activeBookCount,
          bookDetails: activeBooks,
          hasUnpaidFines,
          totalUnpaidAmount
        })
      } else {
        // No active books or fines, proceed normally
        setDeleteModal(true)
      }
    } catch (error) {
      toast.error('Failed to check member status')
      console.error('Error checking member status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleDelete = () => {
    deleteMutation.mutate({ id, force: false })
    setDeleteModal(false)
  }

  const handleForceDelete = () => {
    // Delete even with active books
    deleteMutation.mutate({ id, force: true })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  const member = data?.data
  if (!member) return null

  const isExpired = new Date(member.validUntil) < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/members')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{color: '#011039'}}>{member.name}</h1>
            <p className="text-gray-600 mt-1">Member ID: {member.memberId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {member.isBlocked ? (
            <Button 
              onClick={handleUnblock}
              className="bg-green-600 hover:bg-green-700 text-white border-0"
            >
              <CheckCircle className="h-4 w-4" />
              Unblock
            </Button>
          ) : (
            <Button 
              onClick={() => setBlockModal({ open: true })}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              <Ban className="h-4 w-4" />
              Block
            </Button>
          )}
          <Link to={`/members/${id}/edit`}>
            <Button 
              className="text-white border-0"
              style={{
                backgroundColor: '#E76800',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#D85A00'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#E76800'}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button 
            onClick={handleDeleteClick}
            className="bg-red-600 hover:bg-red-700 text-white border-0"
            disabled={checkingStatus}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Alerts */}
      {member.isBlocked && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-danger-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-danger-900">Member Blocked</h3>
            <p className="text-sm text-danger-700 mt-1">{member.blockReason}</p>
          </div>
        </div>
      )}
      {isExpired && !member.isBlocked && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-warning-900">Membership Expired</h3>
            <p className="text-sm text-warning-700 mt-1">
              This membership expired on {format(new Date(member.validUntil), 'PPP')}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Member Photo & Basic Info */}
          <Card>
            <div className="p-6">
              <div className="flex flex-col items-center">
                <MemberPhoto
                  src={member.photo}
                  alt={member.name}
                  size="xl"
                  className="mb-4"
                />
                <h2 className="text-xl font-bold text-gray-900 mt-4 text-center">{member.name}</h2>
                <p className="text-gray-600 text-sm">{member.memberId}</p>
                <div className="mt-3">
                  <Badge variant={
                    member.isBlocked ? 'danger' : 
                    isExpired ? 'warning' : 
                    member.currentBorrowedBooks > 0 ? 'success' : 
                    'default'
                  }>
                    {member.isBlocked ? 'Blocked' : 
                     isExpired ? 'Expired' : 
                     member.currentBorrowedBooks > 0 ? 'Active' : 
                     'Available'}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${member.email}`} className="text-primary-600 hover:underline">
                    {member.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${member.phone}`} className="text-gray-900">
                    {member.phone}
                  </a>
                </div>
                {member.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-900">{member.address}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Membership Details */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Member Type:</span>
                  <span className="font-medium text-gray-900">{member.memberType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium text-gray-900">{member.department}</span>
                </div>
                {member.course && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Course:</span>
                    <span className="font-medium text-gray-900">{member.course}</span>
                  </div>
                )}
                {member.year && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Year:</span>
                    <span className="font-medium text-gray-900">{member.year}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Join Date:</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(member.joinDate), 'PP')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Valid Until:</span>
                  <span className={`font-medium ${isExpired ? 'text-danger-600' : 'text-gray-900'}`}>
                    {format(new Date(member.validUntil), 'PP')}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Borrowing Limit</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{member.borrowingLimit}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-primary-600" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Currently Borrowed</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{member.currentBorrowedBooks}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-warning-600" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Borrowed</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{member.totalBooksBorrowed}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-success-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Current Books */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Currently Borrowed Books</h3>
                <Badge>{member.currentBooks?.length || 0}</Badge>
              </div>
              {member.currentBooks && member.currentBooks.length > 0 ? (
                <div className="space-y-3">
                  {member.currentBooks.map((transaction) => (
                    <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Link
                          to={`/books/${transaction.bookId._id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          {transaction.bookId.title}
                        </Link>
                        <p className="text-sm text-gray-600">{transaction.bookId.author}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Acc: {transaction.bookId.accessionNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={transaction.status === 'Overdue' ? 'danger' : 'warning'}>
                          {transaction.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {format(new Date(transaction.dueDate), 'PP')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No books currently borrowed</p>
              )}
            </div>
          </Card>

          {/* Outstanding Fines */}
          {member.outstandingFines && member.outstandingFines.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Outstanding Fines</h3>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-danger-600" />
                    <span className="text-lg font-bold text-danger-600">
                      ${member.totalOutstanding?.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {member.outstandingFines.map((fine) => (
                    <div key={fine._id} className="flex items-center justify-between p-3 bg-danger-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{fine.bookId?.title}</p>
                        <p className="text-sm text-gray-600">{fine.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-danger-600">
                          ${(fine.amount - fine.paidAmount - fine.waivedAmount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          {member.notes && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{member.notes}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Block Modal */}
      <Modal
        isOpen={blockModal.open}
        onClose={() => setBlockModal({ open: false })}
        title="Block Member"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You are about to block <strong>{member.name}</strong>. Please provide a reason:
          </p>
          <textarea
            className="input w-full"
            rows="4"
            placeholder="Enter reason for blocking..."
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setBlockModal({ open: false })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleBlock} loading={blockMutation.isPending}>
              Block Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Member"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{member.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending}>
              Delete Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unblock Confirmation Dialog */}
      <ConfirmDialog
        isOpen={unblockDialog}
        onClose={() => setUnblockDialog(false)}
        onConfirm={handleConfirmUnblock}
        title="Unblock Member"
        message="Are you sure you want to unblock this member? They will regain access to their account."
        confirmText="Yes, Unblock"
        cancelText="Cancel"
        type="success"
      />

      {/* Active Books Warning Modal */}
      <Modal
        isOpen={activeBooksWarning.open}
        onClose={() => setActiveBooksWarning({ open: false, type: '', bookCount: 0, bookDetails: [], hasUnpaidFines: false, totalUnpaidAmount: 0 })}
        title={`Warning: Member Has Active Books`}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 mb-2">
                {activeBooksWarning.type === 'delete' ? 'Cannot Delete Member' : 'Member Has Borrowed Books'}
              </h4>
              <p className="text-sm text-yellow-800">
                <strong>{member?.name}</strong> currently has <strong>{activeBooksWarning.bookCount}</strong> active borrowed book{activeBooksWarning.bookCount > 1 ? 's' : ''}.
              </p>
              {activeBooksWarning.hasUnpaidFines && (
                <p className="text-sm text-yellow-800 mt-2">
                  They also have unpaid fines totaling <strong>₹{activeBooksWarning.totalUnpaidAmount?.toFixed(2)}</strong>.
                </p>
              )}
            </div>
          </div>

          {/* List of borrowed books */}
          {activeBooksWarning.bookDetails && activeBooksWarning.bookDetails.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium text-sm" style={{color: '#011039'}}>Active Borrowed Books:</h5>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {activeBooksWarning.bookDetails.map((book, index) => (
                  <div key={index} className="p-3 bg-gray-50 border rounded-lg text-sm">
                    <div className="font-medium" style={{color: '#011039'}}>{book.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      ISBN: {book.isbn} | Status: <span className={book.status === 'Overdue' ? 'text-red-600 font-semibold' : 'text-gray-700'}>{book.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Due: {new Date(book.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeBooksWarning.type === 'delete' ? (
            <>
              <p className="text-sm text-gray-700">
                If you proceed with deletion, all active books will be automatically returned and any unpaid fines will be waived.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setActiveBooksWarning({ open: false, type: '', bookCount: 0, bookDetails: [], hasUnpaidFines: false, totalUnpaidAmount: 0 })}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleForceDelete}
                  loading={deleteMutation.isPending}
                >
                  Yes, Delete Anyway
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700">
                The member will be blocked but their borrowed books will remain active. They must return all books before being unblocked.
              </p>
              {!blockModal.open && activeBooksWarning.open && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2" style={{color: '#011039'}}>
                    Reason for blocking:
                  </label>
                  <textarea
                    className="input w-full"
                    rows="3"
                    placeholder="Enter reason for blocking..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setActiveBooksWarning({ open: false, type: '', bookCount: 0, bookDetails: [], hasUnpaidFines: false, totalUnpaidAmount: 0 })}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleForceBlock}
                  loading={blockMutation.isPending}
                >
                  Yes, Block Anyway
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
