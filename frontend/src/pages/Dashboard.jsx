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
      link: '/admin/books',
    },
    {
      title: 'Total Members',
      value: stats?.members?.total || 0,
      subtitle: `${stats?.members?.active || 0} active`,
      icon: Users,
      color: 'secondary',
      link: '/admin/members',
    },
    {
      title: 'Books Issued',
      value: stats?.books?.issued || 0,
      subtitle: 'Currently borrowed',
      icon: BookCheck,
      color: 'warning',
      link: '/admin/transactions/issued',
    },
    {
      title: 'Overdue Books',
      value: stats?.overdueBooks || 0,
      subtitle: 'Require attention',
      icon: AlertCircle,
      color: 'danger',
      link: '/admin/reports?tab=overdue',
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-secondary rounded-lg p-4 sm:p-6 md:p-8 lg:p-12 text-white shadow-lg">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-slate-300 mt-2 sm:mt-3 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed font-bold">
            Welcome back to the Library Management System. Monitor your library's performance and manage your resources efficiently.
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 sm:mt-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-md border border-white/10">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-bold">{formatDate(new Date())}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-md border border-white/10">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-bold">System Status: Healthy</span>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-primary/10 rounded-full blur-lg"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-blue-500/10 rounded-full blur-lg"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          const bgColors = {
            primary: 'bg-orange-50',
            secondary: 'bg-blue-50',
            warning: 'bg-orange-50',
            danger: 'bg-red-50'
          }
          const iconColors = {
            primary: '#E76800',
            secondary: '#011039',
            warning: '#E76800',
            danger: '#DC3545'
          }
          
          return (
            <Link key={stat.title} to={stat.link}>
              <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-lg overflow-hidden group cursor-pointer h-full">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-black mt-2 transition-transform origin-left duration-500" style={{ color: iconColors[stat.color] }}>
                        {stat.value}
                      </p>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-500 mt-2 flex items-center gap-1">
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: iconColors[stat.color] }}></span>
                        <span className="truncate">{stat.subtitle}</span>
                      </p>
                    </div>
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-md flex items-center justify-center flex-shrink-0 ${bgColors[stat.color]} transition-all duration-500 shadow-inner`}>
                      <Icon className="h-5 w-5 sm:h-7 sm:w-7" style={{ color: iconColors[stat.color] }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions & Today's Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* Quick Actions */}
        <Card className="border-none shadow-sm rounded-md overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl font-extrabold text-[#011039]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              {[
                { to: "/admin/transactions/issue", icon: BookCheck, label: "Issue Book", sub: "Lend a book", color: "#E76800" },
                { to: "/admin/transactions/return", icon: BookOpen, label: "Return Book", sub: "Process return", color: "#011039" },
                { to: "/admin/books/add", icon: BookOpen, label: "Add Book", sub: "New book entry", color: "#E76800" },
                { to: "/admin/members/add", icon: Users, label: "Add Member", sub: "Register member", color: "#011039" }
              ].map((action, i) => (
                <Link
                  key={i}
                  to={action.to}
                  className="p-2 sm:p-3 md:p-4 rounded-md border-2 border-transparent bg-slate-50 hover:bg-white hover:border-slate-100 hover:shadow-md transition-all group text-center flex flex-col items-center justify-center"
                >
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-white shadow-sm flex items-center justify-center mb-2 sm:mb-3 transition-transform">
                    <action.icon className="h-4 w-4 sm:h-6 sm:w-6" style={{ color: action.color }} />
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-[#011039]">{action.label}</p>
                  <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mt-1">{action.sub}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Activity */}
        <Card className="border-none shadow-sm rounded-md overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-extrabold text-[#011039]">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#E76800] flex-shrink-0" />
              <span>Today's Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-md bg-orange-50/50 border border-orange-100/50 gap-2">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#E76800]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Books Issued</p>
                    <p className="text-lg sm:text-2xl font-black text-[#011039]">{stats?.today?.issued || 0}</p>
                  </div>
                </div>
                <div className="px-2 py-1 bg-[#E76800]/10 rounded-full flex-shrink-0">
                   <span className="text-[8px] sm:text-[10px] font-black text-[#E76800] uppercase">Today</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-md bg-blue-50/50 border border-blue-100/50 gap-2">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-[#011039]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Books Returned</p>
                    <p className="text-lg sm:text-2xl font-black text-[#011039]">{stats?.today?.returned || 0}</p>
                  </div>
                </div>
                <div className="px-2 py-1 bg-[#011039]/10 rounded-full flex-shrink-0">
                   <span className="text-[8px] sm:text-[10px] font-black text-[#011039] uppercase">Today</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-md bg-red-50/50 border border-red-100/50 gap-2">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Reservations</p>
                    <p className="text-lg sm:text-2xl font-black text-[#011039]">{stats?.pendingReservations || 0}</p>
                  </div>
                </div>
                <div className="px-2 py-1 bg-red-500/10 rounded-full flex-shrink-0">
                   <span className="text-[8px] sm:text-[10px] font-black text-red-500 uppercase">Action</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Borrowing Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <Card className="border-none shadow-sm rounded-md overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-extrabold text-[#011039]">Recent Transactions</CardTitle>
              <Link to="/admin/transactions/issued" className="text-xs font-black uppercase tracking-widest text-[#E76800] transition-transform flex items-center gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {stats?.recentTransactions?.slice(0, 5).map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#011039]">
                      {transaction.memberId?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-[#011039] truncate">
                        {transaction.bookId?.title}
                      </p>
                      <p className="text-xs font-bold text-slate-400">
                        {transaction.memberId?.name} • {formatDate(transaction.issueDate)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={transaction.status} />
                </div>
              )) || (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookCheck className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-slate-500 font-bold">No recent transactions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Borrowing Trend */}
        <Card className="border-none shadow-sm rounded-md overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-xl font-extrabold text-[#011039]">Borrowing Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {stats?.borrowingTrend && stats.borrowingTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.borrowingTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="_id" 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} 
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} 
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 800, color: '#011039' }}
                    labelStyle={{ fontSize: '10px', fontWeight: 800, color: '#64748B', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#E76800" 
                    strokeWidth={4} 
                    dot={{ fill: '#E76800', r: 6, strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular Categories */}
      <Card className="border-none shadow-sm rounded-md overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-50 pb-4">
          <CardTitle className="text-xl font-extrabold text-[#011039]">Popular Categories</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {stats?.popularCategories && stats.popularCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.popularCategories}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="_id" 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} 
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 800, color: '#011039' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 800, color: '#64748B', marginBottom: '4px' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#E76800" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Reset Data Section */}
      <Card className="border-2 border-dashed border-red-100 bg-red-50/30 rounded-md overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-center md:text-left">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-red-900">System Reset</h3>
                <p className="text-red-700/70 text-sm font-bold mt-1">
                  Permanently remove all fines, reservations, and transaction history. Use with extreme caution.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowResetModal(true)}
              variant="danger"
              className="h-14 px-8 rounded-md shadow-md shadow-red-500/20 font-extrabold whitespace-nowrap"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Reset All Data
            </Button>
          </div>
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
                <p className="font-bold text-red-900">Warning: This action cannot be undone</p>
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
