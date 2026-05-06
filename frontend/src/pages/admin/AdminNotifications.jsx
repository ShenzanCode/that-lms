import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { Bell, Check, Trash2, Filter, Search } from 'lucide-react'
import { format } from 'date-fns'
import { adminNotificationService } from '@/services/adminNotificationService'

export default function AdminNotifications() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // all, unread, read
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [highlightedId, setHighlightedId] = useState(null)
  const processedNotificationIds = useRef(new Set())
  const itemsPerPage = 10

  // Load notifications from backend API
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await adminNotificationService.getNotifications()
        if (response.success) {
          const notifs = response.data.map(n => ({
            ...n,
            id: n._id,
            createdAt: new Date(n.createdAt)
          }))
          setNotifications(notifs)
        }
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }

    loadNotifications()

    // Poll for new notifications every 10 seconds
    const pollInterval = setInterval(() => {
      loadNotifications()
    }, 10000)

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
      const notificationExists = notifications.some(n => n.id === notificationId)
      
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

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'unread' ? !notification.isRead :
      notification.isRead

    const matchesSearch = 
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

  const markAsRead = async (id) => {
    try {
      // Optimistic UI update
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
      await adminNotificationService.markAsRead(id)
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Revert on error
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: false } : n)
      )
    }
  }

  const markAllAsRead = async () => {
    try {
      // Optimistic UI update
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      
      // Mark each unread notification as read
      await Promise.all(unreadIds.map(id => adminNotificationService.markAsRead(id)))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (id) => {
    try {
      // Optimistic UI update
      setNotifications(prev => prev.filter(n => n.id !== id))
      await adminNotificationService.deleteNotification(id)
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type) => {
    const colors = {
      pending_approval: '#FFC107',
      overdue: '#DC3545',
      reservation: '#007BFF',
      payment: '#28A745',
      stock_alert: '#FF5722',
      return: '#6C757D'
    }
    return <Bell className="h-5 w-5" style={{color: colors[type] || '#6C757D'}} />
  }

  const getBadgeVariant = (type) => {
    const variants = {
      pending_approval: 'warning',
      overdue: 'danger',
      reservation: 'info',
      payment: 'success',
      stock_alert: 'danger',
      return: 'default'
    }
    return variants[type] || 'default'
  }

  const getTypeLabel = (type) => {
    const labels = {
      pending_approval: 'Pending Approval',
      overdue: 'Overdue',
      reservation: 'Reservation',
      payment: 'Payment',
      stock_alert: 'Stock Alert',
      return: 'Book Return'
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <Check className="h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle style={{color: '#011039'}}>All Notifications</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64"
                />
              </div>

              {/* Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                    filter === 'all'
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={filter === 'all' ? {backgroundColor: '#E76800'} : {}}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                    filter === 'unread'
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={filter === 'unread' ? {backgroundColor: '#E76800'} : {}}
                >
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                    filter === 'read'
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={filter === 'read' ? {backgroundColor: '#E76800'} : {}}
                >
                  Read
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'No notifications match your search.'
                  : filter === 'unread'
                  ? 'You have no unread notifications.'
                  : 'You have no notifications.'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    id={`notification-${notification.id}`}
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      highlightedId === notification.id
                        ? 'ring-2 ring-orange-500 shadow-lg'
                        : ''
                    } ${
                      !notification.isRead
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-bold text-gray-900">
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <span className="flex-shrink-0 h-2 w-2 rounded-full"
                                  style={{backgroundColor: '#E76800'}}
                                />
                              )}
                            </div>
                            <Badge variant={getBadgeVariant(notification.type)}>
                              {getTypeLabel(notification.type)}
                            </Badge>
                          </div>
                          
                          <div className="flex-shrink-0 text-xs text-gray-500">
                            {format(notification.createdAt, 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex gap-3">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-sm font-bold hover:underline"
                              style={{color: '#007BFF'}}
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-sm font-bold text-gray-500 hover:text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
