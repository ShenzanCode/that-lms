import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Mail, Phone, AlertCircle, CheckCircle, Ban, RefreshCw } from 'lucide-react'
import { memberService } from '@/services/memberService'
import { MemberPhoto } from '@/components/ui/MemberPhoto'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchBar } from '@/components/ui/SearchBar'
import { Pagination } from '@/components/ui/Pagination'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import AlertDialog from '@/components/ui/AlertDialog'
import toast from 'react-hot-toast'

export default function Members() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    memberType: '',
    status: '',
    department: '',
  })
  const [blockModal, setBlockModal] = useState({ open: false, member: null })
  const [blockReason, setBlockReason] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [unblockDialog, setUnblockDialog] = useState({ open: false, memberId: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, memberId: null })
  const [activeBooksWarning, setActiveBooksWarning] = useState({ 
    open: false, 
    type: '', // 'delete' or 'block'
    memberId: null, 
    memberName: '',
    bookCount: 0,
    bookDetails: []
  })
  const [checkingStatus, setCheckingStatus] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['members', page, search, filters],
    queryFn: () => memberService.getMembers({ page, limit: 10, search, ...filters }),
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries(['members'])
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success('Members list refreshed')
    }, 500)
  }

  const blockMutation = useMutation({
    mutationFn: ({ id, reason, force }) => memberService.blockMember(id, reason, force),
    onSuccess: () => {
      toast.success('Member blocked successfully')
      queryClient.invalidateQueries(['members'])
      setBlockModal({ open: false, member: null })
      setBlockReason('')
      setActiveBooksWarning({ open: false, type: '', memberId: null, memberName: '', bookCount: 0, bookDetails: [] })
    },
    onError: (error) => {
      // Check if error is due to active books
      if (error.response?.data?.requiresConfirmation) {
        // This shouldn't happen now as we check beforehand, but just in case
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
      queryClient.invalidateQueries(['members'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unblock member')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, force }) => memberService.deleteMember(id, force),
    onSuccess: () => {
      toast.success('Member deleted successfully')
      queryClient.invalidateQueries(['members'])
      setActiveBooksWarning({ open: false, type: '', memberId: null, memberName: '', bookCount: 0, bookDetails: [] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete member')
    },
  })

  const handleBlock = async (member) => {
    setCheckingStatus(true)
    try {
      // Check if member has active books
      const statusResponse = await memberService.checkMemberStatus(member._id)
      const { hasActiveBooks, activeBookCount, activeBooks } = statusResponse.data
      
      if (hasActiveBooks) {
        // Show warning dialog about active books
        setActiveBooksWarning({
          open: true,
          type: 'block',
          memberId: member._id,
          memberName: member.name,
          bookCount: activeBookCount,
          bookDetails: activeBooks
        })
      } else {
        // No active books, proceed normally
        setBlockModal({ open: true, member })
      }
    } catch (error) {
      toast.error('Failed to check member status')
      console.error('Error checking member status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleConfirmBlock = () => {
    if (!blockReason.trim()) {
      toast.error('Please provide a reason for blocking')
      return
    }
    blockMutation.mutate({ id: blockModal.member._id, reason: blockReason, force: false })
  }

  const handleForceBlock = () => {
    if (!blockReason.trim()) {
      toast.error('Please provide a reason for blocking')
      return
    }
    // Block even with active books
    blockMutation.mutate({ 
      id: activeBooksWarning.memberId, 
      reason: blockReason, 
      force: true 
    })
    setBlockModal({ open: false, member: null })
  }

  const handleUnblock = (memberId) => {
    setUnblockDialog({ open: true, memberId })
  }

  const handleConfirmUnblock = () => {
    unblockMutation.mutate(unblockDialog.memberId)
    setUnblockDialog({ open: false, memberId: null })
  }

  const handleDelete = async (memberId, memberName) => {
    setCheckingStatus(true)
    try {
      // Check if member has active books or unpaid fines
      const statusResponse = await memberService.checkMemberStatus(memberId)
      const { hasActiveBooks, activeBookCount, activeBooks, hasUnpaidFines, totalUnpaidAmount } = statusResponse.data
      
      if (hasActiveBooks || hasUnpaidFines) {
        // Show warning dialog about active books/fines
        setActiveBooksWarning({
          open: true,
          type: 'delete',
          memberId,
          memberName,
          bookCount: activeBookCount,
          bookDetails: activeBooks,
          hasUnpaidFines,
          totalUnpaidAmount
        })
      } else {
        // No active books or fines, proceed normally
        setDeleteDialog({ open: true, memberId })
      }
    } catch (error) {
      toast.error('Failed to check member status')
      console.error('Error checking member status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleConfirmDelete = () => {
    deleteMutation.mutate({ id: deleteDialog.memberId, force: false })
    setDeleteDialog({ open: false, memberId: null })
  }

  const handleForceDelete = () => {
    // Delete even with active books
    deleteMutation.mutate({ id: activeBooksWarning.memberId, force: true })
    setDeleteDialog({ open: false, memberId: null })
  }

  const getMemberTypeColor = (type) => {
    const colors = {
      Student: 'text-white',
      Faculty: 'text-white', 
      Staff: 'text-white',
    }
    return colors[type] || 'text-white'
  }

  const getMemberTypeBgColor = (type) => {
    return '#E76800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Members</h1>
          <p className="mt-1" style={{color: '#011039'}}>Manage library members</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/admin/members/add">
            <Button variant="primary">
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-4 space-y-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search members by name, ID, email, phone..."
          />
          <div className="flex flex-wrap gap-4">
            <select
              className="input w-full sm:w-48"
              value={filters.memberType}
              onChange={(e) => setFilters({ ...filters, memberType: e.target.value })}
            >
              <option value="">All Member Types</option>
              <option value="Student">Student</option>
              <option value="Faculty">Faculty</option>
              <option value="Staff">Staff</option>
            </select>
            <select
              className="input w-full sm:w-48"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="available">Available</option>
              <option value="blocked">Blocked</option>
            </select>
            <input
              type="text"
              className="input w-full sm:w-48"
              placeholder="Department"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Members Table */}
      <Card>
        {isLoading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : data?.data?.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{backgroundColor: '#011039'}}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Photo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Member ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Books</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.data.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <MemberPhoto
                          src={member.photo}
                          alt={member.name}
                          size="md"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium" style={{color: '#011039'}}>{member.memberId}</td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/admin/members/${member._id}`}
                          className="text-sm font-medium hover:underline"
                          style={{color: '#E76800'}}
                        >
                          {member.name}
                        </Link>
                        {member.isBlocked && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3 text-danger-500" />
                            <span className="text-xs text-danger-600">Blocked</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{backgroundColor: '#E76800'}}>
                          {member.memberType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{color: '#011039'}}>{member.department}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs" style={{color: '#011039'}}>
                            <Mail className="h-3 w-3" style={{color: '#E76800'}} />
                            {member.email}
                          </div>
                          <div className="flex items-center gap-1 text-xs" style={{color: '#011039'}}>
                            <Phone className="h-3 w-3" style={{color: '#E76800'}} />
                            {member.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{color: '#011039'}}>
                        {member.currentBorrowedBooks}/{member.borrowingLimit}
                      </td>
                      <td className="px-6 py-4">
                        {member.isBlocked ? (
                          <Badge variant="danger">
                            <Ban className="h-3 w-3" />
                            Blocked
                          </Badge>
                        ) : new Date(member.validUntil) < new Date() ? (
                          <Badge variant="warning">
                            <AlertCircle className="h-3 w-3" />
                            Expired
                          </Badge>
                        ) : member.currentBorrowedBooks > 0 ? (
                          <Badge variant="success">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3" />
                            Available
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/admin/members/${member._id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          <Link to={`/admin/members/${member._id}/edit`}>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </Link>
                          {member.isBlocked ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnblock(member._id)}
                            >
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBlock(member)}
                            >
                              Block
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
            icon={Search}
            title="No members found"
            description="Try adjusting your search or filters"
            action={
              <Link to="/admin/members/add">
                <Button variant="primary">
                  <Plus className="h-4 w-4" />
                  Add Your First Member
                </Button>
              </Link>
            }
          />
        )}
      </Card>

      {/* Block Member Modal */}
      <Modal
        isOpen={blockModal.open}
        onClose={() => setBlockModal({ open: false, member: null })}
        title="Block Member"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You are about to block <strong>{blockModal.member?.name}</strong>. Please provide a reason:
          </p>
          <textarea
            className="input w-full"
            rows="4"
            placeholder="Enter reason for blocking..."
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setBlockModal({ open: false, member: null })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmBlock}
              loading={blockMutation.isPending}
            >
              Block Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unblock Confirmation Dialog */}
      <ConfirmDialog
        isOpen={unblockDialog.open}
        onClose={() => setUnblockDialog({ open: false, memberId: null })}
        onConfirm={handleConfirmUnblock}
        title="Unblock Member"
        message="Are you sure you want to unblock this member? They will regain access to their account."
        confirmText="Yes, Unblock"
        cancelText="Cancel"
        type="success"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, memberId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Member"
        message="Are you sure you want to delete this member? This action cannot be undone and will permanently remove all member data."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Active Books Warning Dialog */}
      <Modal
        isOpen={activeBooksWarning.open}
        onClose={() => setActiveBooksWarning({ open: false, type: '', memberId: null, memberName: '', bookCount: 0, bookDetails: [] })}
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
                <strong>{activeBooksWarning.memberName}</strong> currently has <strong>{activeBooksWarning.bookCount}</strong> active borrowed book{activeBooksWarning.bookCount > 1 ? 's' : ''}.
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
                  onClick={() => setActiveBooksWarning({ open: false, type: '', memberId: null, memberName: '', bookCount: 0, bookDetails: [] })}
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
              {!blockModal.open && (
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
                  onClick={() => setActiveBooksWarning({ open: false, type: '', memberId: null, memberName: '', bookCount: 0, bookDetails: [] })}
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
