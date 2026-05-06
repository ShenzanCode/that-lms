import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { notificationService } from '@/services/notificationService'
import { Bell, BellOff, Check, CheckCheck, Trash2, BookOpen, DollarSign, AlertCircle, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function StudentNotifications() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [highlightedId, setHighlightedId] = useState(null)
  const processedNotificationIds = useRef(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const itemsPerPage = 10
  const [deleteDialog, setDeleteDialog] = useState({ open: false, notificationId: null })

  // Load notifications from backend API
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setIsLoading(true)
        const response = await notificationService.getNotifications({ limit: 1000 })
        setNotifications(response.data || [])
      } catch (error) {
        console.error('Error loading notifications:', error)
        toast.error('Failed to load notifications')
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()

    // Poll for new notifications every 30 seconds
    const pollInterval = setInterval(() => {
      loadNotifications()
    }, 30000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [])

  // Handle notification highlighting from URL parameter
  useEffect(() => {
    const notificationId = searchParams.get('notificationId')
    if (notificationId && notifications.length > 0 && !processedNotificationIds.current.has(notificationId)) {
      // Mark as processed immediately to prevent re-processing
      processedNotificationIds.current.add(notificationId)
      
      // Check if the notification exists in current data
      const notificationExists = notifications.some(n => n._id === notificationId)
      
      if (notificationExists) {
        setHighlightedId(notificationId)
        
        // Scroll to the notification after a short delay
        setTimeout(() => {
          const element = document.getElementById(`notification-${notificationId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedId(null)
        }, 3000)
      }
      
      // Clean up URL parameter immediately
      searchParams.delete('notificationId')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, notifications, setSearchParams])

  // Client-side filtering
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'unread' ? !notification.isRead :
      notification.isRead

    const matchesSearch = searchTerm.trim() === '' ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex)

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchTerm])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkAsRead = async (id) => {
    try {
      // Optimistic UI update
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      )
      await notificationService.markAsRead(id)
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Revert on error
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: false } : n)
      )
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      // Optimistic UI update
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      
      await notificationService.markAllAsRead()
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const handleDelete = (id) => {
    setDeleteDialog({ open: true, notificationId: id })
  }

  const handleConfirmDelete = async () => {
    try {
      setNotifications(prev => prev.filter(n => n._id !== deleteDialog.notificationId))
      await notificationService.deleteNotification(deleteDialog.notificationId)
      toast.success('Notification deleted')
      setDeleteDialog({ open: false, notificationId: null })
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reservation':
        return <BookOpen className="h-5 w-5" style={{color: '#E76800'}} />
      case 'fine':
        return <DollarSign className="h-5 w-5 text-danger-600" />
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-warning-600" />
      default:
        return <Bell className="h-5 w-5" style={{color: '#011039'}} />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#011039] to-[#011039]/90 rounded-md p-8 sm:p-10 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Notification Center</h1>
            <p className="text-slate-300 mt-2 text-lg">
              {unreadCount > 0 ? `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'Your inbox is all caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              className="bg-[#E76800] hover:bg-[#E76800]/90 text-white font-bold px-6 py-3 rounded-md shadow-lg shadow-orange-600/20 flex items-center gap-2 border-none"
            >
              <CheckCheck className="h-5 w-5" />
              Mark All as Read
            </Button>
          )}
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-[#E76800]/10 rounded-full blur-xl"></div>
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-sm rounded-md overflow-hidden bg-white">
        <div className="p-6 sm:p-10">
          <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between mb-10 pb-8 border-b border-slate-50">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Messages' },
                { id: 'unread', label: `Unread ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
                { id: 'read', label: 'History' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-6 py-2.5 rounded-md text-sm font-bold transition-all ${
                    filter === tab.id
                      ? 'bg-[#011039] text-white shadow-md'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="relative w-full xl:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#E76800] transition-colors" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-md focus:outline-none focus:border-[#E76800] focus:bg-white transition-all text-slate-600 font-bold placeholder:text-slate-300"
              />
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <BellOff className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-[#011039]">No notifications found</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                {searchTerm ? "We couldn't find any messages matching your search." : "You're all caught up with your library updates."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedNotifications.map((notification) => (
                <div
                  key={notification._id}
                  id={`notification-${notification._id}`}
                  className={`group p-6 rounded-md border-2 transition-all duration-300 relative ${
                    highlightedId === notification._id
                      ? 'border-[#E76800] bg-orange-50/30 shadow-md'
                      : !notification.isRead
                        ? 'bg-slate-50/50 border-slate-50 hover:border-blue-100'
                        : 'bg-white border-transparent hover:border-slate-50'
                  }`}
                >
                  <div className="flex gap-6">
                    <div className={`w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0 ${!notification.isRead ? 'bg-blue-500/10' : 'bg-slate-50'}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className={`text-lg font-extrabold truncate ${!notification.isRead ? 'text-[#011039]' : 'text-slate-500'}`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-[#E76800] shadow-sm shadow-orange-600/50" />
                            )}
                          </div>
                          <Badge variant={notification.type === 'fine' || notification.type === 'overdue' ? 'danger' : notification.type === 'reservation' ? 'warning' : 'default'} className="px-2 py-0.5 rounded-lg text-[9px] uppercase font-black tracking-[0.1em]">
                            {notification.type}
                          </Badge>
                        </div>
                        
                        <div className="flex-shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-tight bg-slate-50 px-3 py-1 rounded-full">
                          {format(new Date(notification.createdAt), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                      
                      <p className={`text-sm leading-relaxed mb-4 ${!notification.isRead ? 'text-slate-600 font-bold' : 'text-slate-400'}`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5"
                          >
                            <Check className="h-4 w-4" />
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification._id)}
                          className="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center border-t border-slate-50 pt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Delete Notification Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, notificationId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}
