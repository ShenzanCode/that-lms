import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { BookCover } from '@/components/ui/BookCover'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { reservationService } from '@/services/reservationService'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { Clock, Trash2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const { student } = useMemberAuthStore()
  const [cancelDialog, setCancelDialog] = useState({ open: false, reservationId: null })

  useEffect(() => {
    if (student?.id) {
      loadReservations()
    }
  }, [student?.id])

  const loadReservations = async () => {
    if (!student?.id) {
      return
    }
    
    try {
      setLoading(true)
      // Backend automatically filters by student ID for student requests
      const response = await reservationService.getReservations()
      setReservations(response.data || [])
    } catch (error) {
      console.error('Error loading reservations:', error)
      toast.error('Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = (reservationId) => {
    setCancelDialog({ open: true, reservationId })
  }

  const handleConfirmCancel = async () => {
    try {
      await reservationService.deleteReservation(cancelDialog.reservationId)
      toast.success('Reservation cancelled successfully')
      loadReservations()
      setCancelDialog({ open: false, reservationId: null })
    } catch (error) {
      console.error('Error cancelling reservation:', error)
      toast.error(error.response?.data?.message || 'Failed to cancel reservation')
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Active':
        return 'warning'
      case 'Notified':
        return 'info'
      case 'Fulfilled':
        return 'success'
      case 'Cancelled':
      case 'Expired':
        return 'default'
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
        <h1 className="text-2xl font-bold" style={{color: '#011039'}}>My Reservations</h1>
        <p className="text-gray-600 mt-1">Your book reservations and their status</p>
      </div>

      {reservations.length === 0 ? (
        <EmptyState
          icon={Clock}
          message="No reservations"
          description="You haven't reserved any books yet. Reserve books from the catalog when they're unavailable."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservations.map((reservation) => (
            <Card key={reservation._id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <BookCover 
                    src={reservation.bookId?.coverImage} 
                    alt={reservation.bookId?.title}
                    className="w-20 h-28 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2" style={{color: '#011039'}}>
                      {reservation.bookId?.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                      {reservation.bookId?.author}
                    </p>
                    
                    <div className="space-y-2">
                      <Badge variant={getStatusBadgeVariant(reservation.status)}>
                        {reservation.status}
                      </Badge>
                      
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>Reserved: {formatDate(reservation.reservationDate)}</span>
                        </div>
                        
                        {reservation.status === 'Notified' && reservation.notifiedDate && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Calendar className="h-3 w-3" />
                            <span>Notified: {formatDate(reservation.notifiedDate)}</span>
                          </div>
                        )}
                        
                        {reservation.expiryDate && reservation.status === 'Active' && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>Expires: {formatDate(reservation.expiryDate)}</span>
                          </div>
                        )}
                      </div>
                      
                      {reservation.status === 'Active' && (
                        <Button
                          onClick={() => handleCancelReservation(reservation._id)}
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel Reservation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, reservationId: null })}
        onConfirm={handleConfirmCancel}
        title="Cancel Reservation"
        message="Are you sure you want to cancel this reservation? This action cannot be undone."
        confirmText="Yes, Cancel Reservation"
        cancelText="Keep Reservation"
        type="warning"
      />
    </div>
  )
}
