import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { fineService } from '@/services/fineService'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { DollarSign, Calendar, BookOpen, AlertCircle, BookCheck } from 'lucide-react'
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#011039] to-[#011039]/90 rounded-xl p-8 sm:p-10 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Financial Records</h1>
          <p className="text-slate-300 mt-2 text-lg">View your library fine history and payment status</p>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-[#E76800]/10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Charges', value: stats.total, icon: DollarSign, color: '#011039', bg: 'bg-slate-50' },
          { label: 'Settled Fines', value: stats.paid, icon: BookCheck, color: '#28A745', bg: 'bg-green-50' },
          { label: 'Outstanding Balance', value: stats.unpaid, icon: AlertCircle, color: stats.unpaid > 0 ? '#DC3545' : '#28A745', bg: stats.unpaid > 0 ? 'bg-red-50' : 'bg-green-50' }
        ].map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
            <CardContent className="p-8">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className="h-7 w-7" style={{color: stat.color}} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black mt-1" style={{color: stat.color}}>
                    {formatCurrency(stat.value)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fines List */}
      <div className="space-y-6">
        <div className="px-2">
           <h2 className="text-2xl font-extrabold text-[#011039]">Fine History</h2>
        </div>

        {fines.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border-2 border-dashed border-slate-200">
             <DollarSign className="h-16 w-16 mx-auto text-slate-200 mb-6" />
             <h3 className="text-2xl font-bold text-[#011039]">Perfect Record!</h3>
             <p className="text-slate-500 mt-2 max-w-sm mx-auto">You don't have any recorded fines. Thank you for being a responsible library member!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fines.map((fine) => (
              <Card key={fine._id} className="border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden bg-white group">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 flex gap-5">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-6 w-6 text-[#E76800]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-[#011039] text-lg line-clamp-1">
                          {fine.transactionId?.bookId?.title || 'Library Charge'}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-2">
                           <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-tight">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(fine.fineDate)}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-300">•</span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                            Type: {fine.reason || 'Overdue'}
                          </span>
                        </div>
                        {fine.paidDate && (
                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
                              Settled on {formatDate(fine.paidDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-slate-50 pt-4 md:pt-0">
                      <div className="text-3xl font-black" style={{color: fine.isPaid ? '#28A745' : '#DC3545'}}>
                        {formatCurrency(fine.amount)}
                      </div>
                      <Badge variant={fine.isPaid ? 'success' : 'danger'} className="mt-1 px-3 py-1 rounded-xl text-[10px] uppercase font-bold tracking-widest">
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
    </div>
  )
}
