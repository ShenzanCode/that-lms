import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { fineService } from '@/services/fineService'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { DollarSign, Calendar, BookOpen, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentFines() {
  const [fines, setFines] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, paid: 0, unpaid: 0 })
  const { student } = useMemberAuthStore()

  useEffect(() => {
    if (student?.id) {
      loadFines()
    }
  }, [student?.id])

  const loadFines = async () => {
    if (!student?.id) {
      console.error('Student ID not available')
      return
    }
    
    try {
      setLoading(true)
      // Pass the student ID in the path as per the API route
      const response = await fineService.getMemberFines(student.id)
      const finesData = response.data || []
      setFines(finesData)
      
      // Calculate stats
      const total = finesData.reduce((sum, fine) => sum + fine.amount, 0)
      const paid = finesData.filter(f => f.isPaid).reduce((sum, fine) => sum + fine.amount, 0)
      const unpaid = total - paid
      
      setStats({ total, paid, unpaid })
    } catch (error) {
      console.error('Error loading fines:', error)
      toast.error('Failed to load fines')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toFixed(2)}`
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
        <h1 className="text-2xl font-bold" style={{color: '#011039'}}>My Fines</h1>
        <p className="text-gray-600 mt-1">Your fine records and payment status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#FFF3CD'}}>
                <DollarSign className="h-6 w-6" style={{color: '#E76800'}} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Fines</p>
                <p className="text-2xl font-bold" style={{color: '#011039'}}>
                  {formatCurrency(stats.total)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.paid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unpaid</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.unpaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fines List */}
      {fines.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          message="No fines"
          description="You don't have any fines. Keep returning books on time!"
        />
      ) : (
        <div className="space-y-4">
          {fines.map((fine) => (
            <Card key={fine._id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 mt-0.5" style={{color: '#E76800'}} />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1" style={{color: '#011039'}}>
                          {fine.transactionId?.bookId?.title || 'Book Title'}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Fine Date: {formatDate(fine.fineDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Type: {fine.type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{fine.daysOverdue} days overdue</span>
                          </div>
                        </div>
                        {fine.reason && (
                          <p className="text-sm text-gray-600 mt-1">
                            Reason: {fine.reason}
                          </p>
                        )}
                        {fine.paidDate && (
                          <p className="text-sm text-green-600 mt-1">
                            Paid on: {formatDate(fine.paidDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-2xl font-bold" style={{color: fine.isPaid ? '#10B981' : '#E76800'}}>
                      {formatCurrency(fine.amount)}
                    </div>
                    <Badge variant={fine.isPaid ? 'success' : 'danger'}>
                      {fine.isPaid ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
