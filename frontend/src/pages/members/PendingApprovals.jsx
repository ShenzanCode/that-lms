import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { memberService } from '@/services/memberService'
import { UserCheck, UserX, Clock, Mail, Phone, Building2, Eye, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PendingApprovals() {
  const [pendingMembers, setPendingMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [approveDialog, setApproveDialog] = useState({ open: false, memberId: null })

  useEffect(() => {
    loadPendingMembers()
    
    // Check for new pending members every 30 seconds
    const interval = setInterval(loadPendingMembers, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadPendingMembers = async () => {
    try {
      setLoading(true)
      const response = await memberService.getPendingMembers()
      setPendingMembers(response.data)
    } catch (error) {
      console.error('Error loading pending members:', error)
      if (!loading) {
        toast.error('Failed to load pending approvals')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (memberId) => {
    setApproveDialog({ open: true, memberId })
  }

  const handleConfirmApprove = async () => {
    try {
      setActionLoading(true)
      await memberService.approveMember(approveDialog.memberId)
      toast.success('Member approved successfully')
      loadPendingMembers()
      setApproveDialog({ open: false, memberId: null })
    } catch (error) {
      console.error('Error approving member:', error)
      toast.error(error.response?.data?.message || 'Failed to approve member')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setActionLoading(true)
      await memberService.rejectMember(selectedMember._id, rejectionReason)
      toast.success('Member rejected')
      setShowRejectModal(false)
      setRejectionReason('')
      setSelectedMember(null)
      loadPendingMembers()
    } catch (error) {
      console.error('Error rejecting member:', error)
      toast.error(error.response?.data?.message || 'Failed to reject member')
    } finally {
      setActionLoading(false)
    }
  }

  const openRejectModal = (member) => {
    setSelectedMember(member)
    setShowRejectModal(true)
  }

  const openDocumentModal = (member) => {
    setSelectedMember(member)
    setShowDocumentModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Pending Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve student registrations</p>
        </div>
        <Badge variant="warning">
          {pendingMembers.length} Pending
        </Badge>
      </div>

      {/* Pending Members List */}
      {pendingMembers.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No pending approvals"
          description="All student registrations have been processed"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingMembers.map((member) => (
            <Card key={member._id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4" style={{borderColor: '#E76800'}}>
                      {member.photo ? (
                        <img
                          src={`http://localhost:5000${member.photo}`}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <UserCheck className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold" style={{color: '#011039'}}>{member.name}</h3>
                        <p className="text-sm text-gray-600">Username: {member.username}</p>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">{member.memberType === 'Student' ? 'Roll Number' : 'Employee ID'}</p>
                          <p className="text-sm font-bold" style={{color: '#011039'}}>{member.memberId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-bold" style={{color: '#011039'}}>{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm font-bold" style={{color: '#011039'}}>{member.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="text-sm font-bold" style={{color: '#011039'}}>{member.department}</p>
                        </div>
                      </div>
                      {member.subject && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Subject</p>
                            <p className="text-sm font-bold" style={{color: '#011039'}}>{member.subject}</p>
                          </div>
                        </div>
                      )}
                      {member.semester && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Semester</p>
                            <p className="text-sm font-bold" style={{color: '#011039'}}>{member.semester}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {member.document && (
                        <Button
                          onClick={() => openDocumentModal(member)}
                          variant="outline"
                          className="flex items-center gap-2"
                          style={{borderColor: '#E76800', color: '#E76800'}}
                        >
                          <Eye className="h-4 w-4" />
                          Review Document
                        </Button>
                      )}
                      <Button
                        onClick={() => handleApprove(member._id)}
                        disabled={actionLoading}
                        style={{backgroundColor: '#28A745'}}
                        className="flex items-center gap-2"
                      >
                        <UserCheck className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => openRejectModal(member)}
                        disabled={actionLoading}
                        variant="outline"
                        className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <UserX className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false)
          setRejectionReason('')
          setSelectedMember(null)
        }}
        title="Reject Registration"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please provide a reason for rejecting {selectedMember?.name}'s registration:
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[100px]"
            placeholder="Enter rejection reason..."
          />
          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => {
                setShowRejectModal(false)
                setRejectionReason('')
                setSelectedMember(null)
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Document Review Modal */}
      <Modal
        isOpen={showDocumentModal}
        onClose={() => {
          setShowDocumentModal(false)
          setSelectedMember(null)
        }}
        title={`${selectedMember?.memberType || 'Member'} Document Verification`}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <p className="text-gray-500">Name:</p>
                <p className="font-bold" style={{color: '#011039'}}>{selectedMember?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">{selectedMember?.memberType === 'Student' ? 'Roll Number' : 'Employee ID'}:</p>
                <p className="font-bold" style={{color: '#011039'}}>{selectedMember?.memberId}</p>
              </div>
              <div>
                <p className="text-gray-500">Department:</p>
                <p className="font-bold" style={{color: '#011039'}}>{selectedMember?.department}</p>
              </div>
              {selectedMember?.memberType === 'Student' ? (
                <div>
                  <p className="text-gray-500">Semester:</p>
                  <p className="font-bold" style={{color: '#011039'}}>{selectedMember?.semester || 'N/A'}</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500">Designation:</p>
                  <p className="font-bold" style={{color: '#011039'}}>{selectedMember?.subject || 'N/A'}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold mb-2" style={{color: '#011039'}}>
              Fee Challan / University Card:
            </p>
            {selectedMember?.document ? (
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={`http://localhost:5000${selectedMember.document}`}
                  alt="Student Document"
                  className="w-full h-auto"
                  style={{maxHeight: '500px', objectFit: 'contain'}}
                />
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No document uploaded</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              onClick={() => setShowDocumentModal(false)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={approveDialog.open}
        onClose={() => setApproveDialog({ open: false, memberId: null })}
        onConfirm={handleConfirmApprove}
        title="Approve Member"
        message="Are you sure you want to approve this member? They will gain access to the library system."
        confirmText="Yes, Approve"
        cancelText="Cancel"
        type="success"
      />
    </div>
  )
}
