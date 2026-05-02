import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { adminNotificationService } from '@/services/adminNotificationService'

export default function AdminNotificationDropdown() {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

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
          // Limit to 7 latest notifications for the dropdown
          setNotifications(notifs.slice(0, 7))
          const unread = notifs.filter(n => !n.isRead).length
          setUnreadCount(unread)
        }
      } catch (error) {
        console.error('Error loading admin notifications:', error)
      }
    }

    // Initial load
    loadNotifications()
    
    // Set up polling interval to check for new notifications every 10 seconds
    const pollInterval = setInterval(() => {
      loadNotifications()
    }, 10000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const markAsRead = async (id) => {
    try {
      await adminNotificationService.markAsRead(id)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Note: Backend doesn't have markAllAsRead endpoint yet, so we'll mark each individually
      const unreadNotifs = notifications.filter(n => !n.isRead)
      await Promise.all(unreadNotifs.map(n => adminNotificationService.markAsRead(n.id)))
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (id) => {
    try {
      await adminNotificationService.deleteNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      const notification = notifications.find(n => n.id === id)
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type) => {
    const iconClass = "h-5 w-5"
    switch (type) {
      case 'pending_approval':
        return <Bell className={iconClass} style={{color: '#FFC107'}} />
      case 'overdue':
        return <Bell className={iconClass} style={{color: '#DC3545'}} />
      case 'reservation':
        return <Bell className={iconClass} style={{color: '#007BFF'}} />
      default:
        return <Bell className={iconClass} style={{color: '#6C757D'}} />
    }
  }

  const getRelativeTime = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification.id)
    }

    // Always navigate to notifications page with the notification ID
    navigate(`/admin/notifications?notificationId=${notification.id}`)

    // Close the dropdown
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        style={{color: '#011039'}}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
            style={{backgroundColor: '#E76800'}}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold" style={{color: '#011039'}}>
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm hover:underline"
                  style={{color: '#E76800'}}
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 h-2 w-2 rounded-full"
                            style={{backgroundColor: '#E76800'}}
                          />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {getRelativeTime(notification.createdAt)}
                        </span>
                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="text-xs hover:underline"
                              style={{color: '#007BFF'}}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="text-xs text-gray-500 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <Link
                to="/admin/notifications"
                className="text-sm font-medium hover:underline"
                style={{color: '#E76800'}}
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
