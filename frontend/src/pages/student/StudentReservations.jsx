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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#011039] to-[#011039]/90 rounded-lg p-8 sm:p-10 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">My Reservations</h1>
          <p className="text-slate-300 mt-2 text-lg">Track your book requests and queue status</p>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-[#E76800]/10 rounded-full blur-3xl"></div>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white rounded-lg p-16 text-center border-2 border-dashed border-slate-200">
           <Clock className="h-16 w-16 mx-auto text-slate-200 mb-6" />
           <h3 className="text-2xl font-bold text-[#011039]">No reservations found</h3>
           <p className="text-slate-500 mt-2 max-w-sm mx-auto">Reserve books from the Library Catalog when they are currently issued to other members.</p>
           <button 
             onClick={() => window.location.href = '/catalog'}
             className="mt-8 px-10 py-3.5 bg-[#011039] text-white rounded-lg font-bold hover:bg-[#E76800] hover:shadow-lg transition-all"
           >
             Explore Catalog
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {reservations.map((reservation) => (
            <Card key={reservation._id} className="border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-lg overflow-hidden bg-white p-5 group">
              <div className="flex gap-6">
                <div className="w-32 flex-shrink-0">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-lg">
                    <BookCover 
                      src={reservation.bookId?.coverImage} 
                      alt={reservation.bookId?.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div>
                    <div className="flex justify-between items-start">
                      <Badge variant={getStatusBadgeVariant(reservation.status)} className="px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider">
                        {reservation.status}
                      </Badge>
                    </div>
                    <h3 className="font-extrabold text-[#011039] mt-3 line-clamp-2 leading-snug">
                      {reservation.bookId?.title}
                    </h3>
                    <p className="text-sm font-bold text-slate-400 mt-1 line-clamp-1 italic">
                      {reservation.bookId?.author}
                    </p>
                  </div>
                  
                  <div className="mt-6 space-y-3 pt-5 border-t border-slate-50">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
                      <span className="text-slate-400">Request Date</span>
                      <span className="text-slate-600">{formatDate(reservation.reservationDate)}</span>
                    </div>
                    
                    {reservation.status === 'Notified' && reservation.notifiedDate && (
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight text-blue-600">
                        <span>Available Since</span>
                        <span>{formatDate(reservation.notifiedDate)}</span>
                      </div>
                    )}
                    
                    {reservation.expiryDate && (reservation.status === 'Active' || reservation.status === 'Notified') && (
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight text-orange-600">
                        <span>Expires On</span>
                        <span>{formatDate(reservation.expiryDate)}</span>
                      </div>
                    )}
                    
                    {(reservation.status === 'Active' || reservation.status.toLowerCase() === 'pending') && (
                      <Button
                        onClick={() => handleCancelReservation(reservation._id)}
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 rounded-lg border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 font-bold py-2"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Cancel Request
                      </Button>
                    )}
                  </div>
                </div>
              </div>
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
