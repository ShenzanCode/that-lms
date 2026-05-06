import { useState, useEffect } from 'react'
import { adminNotificationService } from '@/services/adminNotificationService'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function TestNotifications() {
  const [notifications, setNotifications] = useState([])
  const [rawStorage, setRawStorage] = useState('')
  const [clearDialog, setClearDialog] = useState(false)

  const refreshData = () => {
    // Get from service
    const serviceNotifications = adminNotificationService.getAllNotifications()
    setNotifications(serviceNotifications)

    // Get raw from localStorage
    const raw = localStorage.getItem('adminNotifications')
    setRawStorage(raw || 'null')
  }

  useEffect(() => {
    refreshData()

    // Set up interval to refresh every 2 seconds
    const interval = setInterval(refreshData, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const createTestNotification = (type) => {
    const testNotifications = {
      registration: {
        title: 'New Member Registration',
        message: `Test User (Student) has registered and is pending approval`,
        type: 'pending_approval',
        relatedId: 'test-123',
        relatedType: 'member'
      },
      profile: {
        title: 'Profile Submitted for Approval',
        message: `Test User (Faculty) has completed their profile and is ready for verification`,
        type: 'pending_approval',
        relatedId: 'test-456',
        relatedType: 'member'
      },
      reservation: {
        title: 'New Reservation Request',
        message: `Student requested reservation for "Test Book" by Test Author`,
        type: 'reservation',
        relatedId: 'test-789',
        relatedType: 'book'
      }
    }

    console.log(`🧪 Creating test ${type} notification`)
    const result = adminNotificationService.addNotification(testNotifications[type])
    console.log('Test notification result:', result)
    
    setTimeout(() => {
      refreshData()
    }, 500)
  }

  const clearAll = () => {
    setClearDialog(true)
  }

  const handleConfirmClear = () => {
    localStorage.removeItem('adminNotifications')
    console.log('🗑️ Cleared all notifications')
    refreshData()
    setClearDialog(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Test Notifications</h1>
        <p className="text-gray-600">Debug and test the notification system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button onClick={() => createTestNotification('registration')}>
          Create Registration Notification
        </Button>
        <Button onClick={() => createTestNotification('profile')}>
          Create Profile Notification
        </Button>
        <Button onClick={() => createTestNotification('reservation')}>
          Create Reservation Notification
        </Button>
        <Button onClick={clearAll} variant="outline">
          Clear All Notifications
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4">
            Notifications in Service ({notifications.length})
          </h2>
          
          {notifications.length === 0 ? (
            <p className="text-gray-500">No notifications</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Type: {notification.type}</span>
                        <span>ID: {notification.id}</span>
                        <span>Read: {notification.isRead ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4">Raw localStorage Data</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
            {rawStorage === 'null' ? 'null' : JSON.stringify(JSON.parse(rawStorage), null, 2)}
          </pre>
        </div>
      </Card>

      <div className="text-sm text-gray-600 space-y-1">
        <p>✅ Green checkmarks in console = Success</p>
        <p>❌ Red X marks in console = Errors</p>
        <p>🔔 Bell icons = Notification events</p>
        <p>💾 Disk icons = Storage operations</p>
        <p>📊 Chart icons = Counts/statistics</p>
        <p className="pt-2">
          <strong>How to test:</strong> Open this page, create test notifications,
          then open the admin dashboard in another tab to see if notifications appear.
        </p>
      </div>

      {/* Clear Notifications Confirmation Dialog */}
      <ConfirmDialog
        isOpen={clearDialog}
        onClose={() => setClearDialog(false)}
        onConfirm={handleConfirmClear}
        title="Clear All Notifications"
        message="Are you sure you want to clear all notifications from localStorage? This will remove all test notifications."
        confirmText="Yes, Clear All"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  )
}
