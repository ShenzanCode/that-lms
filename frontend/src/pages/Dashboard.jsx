import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Users,
  BookCheck,
  AlertCircle,
  TrendingUp,
  Calendar,
  ArrowRight,
  Trash2,
} from 'lucide-react'
import { reportService } from '@/services/reportService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { formatDate, calculateDaysUntil } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export default function Dashboard() {
  const { isAuthenticated, user, token } = useAuthStore()
  
  // Early return if not authenticated to prevent any API calls
  if (!isAuthenticated || !user || !token) {
    return <div>Redirecting...</div>
  }
  
  return <DashboardContent />
}

function DashboardContent() {
  const [showResetModal, setShowResetModal] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportService.getDashboardStats,
  })

  const handleResetData = async () => {
    try {
      setIsResetting(true)
      await reportService.resetAllData()
      setShowResetModal(false)
      // Refetch dashboard data
      refetch()
    } catch (error) {
      console.error('Failed to reset data:', error)
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const stats = dashboardData

  const statCards = [
    {
      title: 'Total Books',
      value: stats?.books?.total || 0,
      subtitle: `${stats?.books?.available || 0} available`,
      icon: BookOpen,
      color: 'primary',
      link: '/books',
    },
    {
      title: 'Total Members',
      value: stats?.members?.total || 0,
      subtitle: `${stats?.members?.active || 0} active`,
      icon: Users,
      color: 'secondary',
      link: '/members',
    },
    {
      title: 'Books Issued',
      value: stats?.books?.issued || 0,
      subtitle: 'Currently borrowed',
      icon: BookCheck,
      color: 'warning',
      link: '/transactions/issued',
    },
    {
      title: 'Overdue Books',
      value: stats?.overdueBooks || 0,
      subtitle: 'Require attention',
      icon: AlertCircle,
      color: 'danger',
      link: '/reports?tab=overdue',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Dashboard</h1>
        <p className="mt-1" style={{color: '#011039'}}>Welcome to Library Management System</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} to={stat.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{color: '#011039'}}>{stat.title}</p>
                      <p className="text-3xl font-bold mt-2" style={{color: '#011039'}}>{stat.value}</p>
                      <p className="text-sm mt-1" style={{color: '#011039'}}>{stat.subtitle}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center`} style={{backgroundColor: stat.color === 'primary' ? '#E76800' : stat.color === 'secondary' ? '#011039' : stat.color === 'warning' ? '#E76800' : '#E76800'}}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions & Today's Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/transactions/issue"
                className="p-4 border-2 border-dashed rounded-lg transition-all group hover:bg-orange-50"
                style={{borderColor: '#E76800'}}
              >
                <BookCheck className="h-8 w-8 mb-2 group-hover:text-white" style={{color: '#E76800'}} />
                <p className="font-medium" style={{color: '#011039'}}>Issue Book</p>
                <p className="text-sm" style={{color: '#011039'}}>Lend a book</p>
              </Link>
              <Link
                to="/transactions/return"
                className="p-4 border-2 border-dashed rounded-lg transition-all group hover:bg-orange-50"
                style={{borderColor: '#E76800'}}
              >
                <BookOpen className="h-8 w-8 mb-2 group-hover:text-white" style={{color: '#E76800'}} />
                <p className="font-medium" style={{color: '#011039'}}>Return Book</p>
                <p className="text-sm" style={{color: '#011039'}}>Process return</p>
              </Link>
              <Link
                to="/books/add"
                className="p-4 border-2 border-dashed rounded-lg transition-all group hover:bg-orange-50"
                style={{borderColor: '#E76800'}}
              >
                <BookOpen className="h-8 w-8 mb-2 group-hover:text-white" style={{color: '#E76800'}} />
                <p className="font-medium" style={{color: '#011039'}}>Add Book</p>
                <p className="text-sm" style={{color: '#011039'}}>New book entry</p>
              </Link>
              <Link
                to="/members/add"
                className="p-4 border-2 border-dashed rounded-lg transition-all group hover:bg-orange-50"
                style={{borderColor: '#E76800'}}
              >
                <Users className="h-8 w-8 mb-2 group-hover:text-white" style={{color: '#E76800'}} />
                <p className="font-medium" style={{color: '#011039'}}>Add Member</p>
                <p className="text-sm text-gray-500">Register member</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Today's Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" style={{color: '#E76800'}} />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{backgroundColor: '#FFF3E6'}}>
                <div>
                  <p className="text-sm font-medium" style={{color: '#011039'}}>Books Issued</p>
                  <p className="text-2xl font-bold" style={{color: '#E76800'}}>{stats?.today?.issued || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8" style={{color: '#E76800'}} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{backgroundColor: '#E8EDF5'}}>
                <div>
                  <p className="text-sm font-medium" style={{color: '#011039'}}>Books Returned</p>
                  <p className="text-2xl font-bold" style={{color: '#011039'}}>{stats?.today?.returned || 0}</p>
                </div>
                <BookOpen className="h-8 w-8" style={{color: '#011039'}} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{backgroundColor: '#FFF3E6'}}>
                <div>
                  <p className="text-sm font-medium" style={{color: '#011039'}}>Pending Reservations</p>
                  <p className="text-2xl font-bold" style={{color: '#E76800'}}>{stats?.pendingReservations || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8" style={{color: '#E76800'}} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset Data Section */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Reset All Data</p>
              <p className="text-sm text-gray-500 mt-1">
                Remove all fines, reservations, and issued books data. This action cannot be undone.
              </p>
            </div>
            <Button
              onClick={() => setShowResetModal(true)}
              variant="danger"
              className="whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions & Borrowing Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Link to="/transactions/issued" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentTransactions?.slice(0, 5).map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{color: '#011039'}}>
                      {transaction.bookId?.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.memberId?.name} • {formatDate(transaction.issueDate)}
                    </p>
                  </div>
                  <StatusBadge status={transaction.status} />
                </div>
              )) || (
                <p className="text-center text-gray-500 py-4">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Borrowing Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Borrowing Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.borrowingTrend && stats.borrowingTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.borrowingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} stroke="#011039" />
                  <YAxis stroke="#011039" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E76800' }}
                    labelStyle={{ color: '#011039' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#E76800" strokeWidth={3} dot={{ fill: '#E76800', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.popularCategories && stats.popularCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.popularCategories}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="_id" stroke="#011039" />
                <YAxis stroke="#011039" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E76800' }}
                  labelStyle={{ color: '#011039' }}
                />
                <Bar dataKey="count" fill="#E76800" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Confirm Data Reset"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Warning: This action cannot be undone</p>
                <p className="text-sm text-red-700 mt-1">
                  This will permanently delete:
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                  <li>All fine records</li>
                  <li>All reservation history</li>
                  <li>All issued books data (transactions)</li>
                  <li>All books will be marked as available</li>
                  <li>All members' borrowed books count will be reset</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowResetModal(false)}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleResetData}
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Resetting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset All Data
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
