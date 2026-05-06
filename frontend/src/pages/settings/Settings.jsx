import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/Loading';
import { settingsService } from '@/services/settingsService';
import {
  Settings as SettingsIcon,
  BookOpen,
  Users,
  DollarSign,
  Clock,
  Bell,
  Building2,
  Calendar,
  Save,
  RotateCcw,
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    loanPeriods: {
      student: 14,
      faculty: 30,
      staff: 21
    },
    borrowingLimits: {
      student: 3,
      faculty: 10,
      staff: 5
    },
    fineRates: {
      perDay: 2,
      maxFine: 500
    },
    renewalSettings: {
      maxRenewals: 2,
      renewalPeriod: 7
    },
    reservationSettings: {
      maxReservations: 3,
      reservationExpiry: 7,
      notificationDays: 2
    },
    libraryInfo: {
      name: 'University Library',
      address: '',
      phone: '',
      email: '',
      workingHours: 'Monday - Saturday: 9:00 AM - 6:00 PM'
    },
    notifications: {
      emailEnabled: false,
      reminderDays: 2,
      overdueNotification: true
    },
    liveChat: {
      enabled: true,
      offlineMessage: 'Our support team is currently offline. Please leave a message and we will respond as soon as possible.',
      workingHours: 'Monday - Friday: 9:00 AM - 5:00 PM'
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSettings();
      const settingsData = response.data;
      setSettings(settingsData);
      setFormData({
        loanPeriods: settingsData.loanPeriods || formData.loanPeriods,
        borrowingLimits: settingsData.borrowingLimits || formData.borrowingLimits,
        fineRates: settingsData.fineRates || formData.fineRates,
        renewalSettings: settingsData.renewalSettings || formData.renewalSettings,
        reservationSettings: settingsData.reservationSettings || formData.reservationSettings,
        libraryInfo: settingsData.libraryInfo || formData.libraryInfo,
        notifications: settingsData.notifications || formData.notifications,
        liveChat: settingsData.liveChat || formData.liveChat
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    // For number fields, ensure we don't set invalid values
    const numericValue = typeof value === 'string' && value.trim() === '' 
      ? '' 
      : value;
    
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: numericValue
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsService.updateSettings(formData);
      toast.success('Settings updated successfully');
      loadSettings();
      // Dispatch event to update library name in navbar
      window.dispatchEvent(new Event('settingsUpdated'));
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        loanPeriods: settings.loanPeriods,
        borrowingLimits: settings.borrowingLimits,
        fineRates: settings.fineRates,
        renewalSettings: settings.renewalSettings,
        reservationSettings: settings.reservationSettings,
        libraryInfo: settings.libraryInfo,
        notifications: settings.notifications,
        liveChat: settings.liveChat
      });
      toast.success('Settings reset to saved values');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Library Settings</h1>
        <p className="text-gray-600 mt-1">Configure library policies and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Library Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary-600" />
              Library Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Library Name
                </label>
                <Input
                  value={formData.libraryInfo.name}
                  onChange={(e) => handleInputChange('libraryInfo', 'name', e.target.value)}
                  placeholder="University Library"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  value={formData.libraryInfo.phone}
                  onChange={(e) => handleInputChange('libraryInfo', 'phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={formData.libraryInfo.email}
                  onChange={(e) => handleInputChange('libraryInfo', 'email', e.target.value)}
                  placeholder="library@university.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Working Hours
                </label>
                <Input
                  value={formData.libraryInfo.workingHours}
                  onChange={(e) => handleInputChange('libraryInfo', 'workingHours', e.target.value)}
                  placeholder="Monday - Saturday: 9:00 AM - 6:00 PM"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Address
                </label>
                <Input
                  value={formData.libraryInfo.address}
                  onChange={(e) => handleInputChange('libraryInfo', 'address', e.target.value)}
                  placeholder="123 University Ave, City, State, ZIP"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loan Periods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-600" />
              Loan Periods (Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Student
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.loanPeriods.student}
                  onChange={(e) => handleInputChange('loanPeriods', 'student', e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                />
                <p className="text-xs mt-1" style={{color: '#011039'}}>Default loan period for students</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Faculty
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.loanPeriods.faculty}
                  onChange={(e) => handleInputChange('loanPeriods', 'faculty', e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                />
                <p className="text-xs mt-1" style={{color: '#011039'}}>Default loan period for faculty</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Staff
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.loanPeriods.staff}
                  onChange={(e) => handleInputChange('loanPeriods', 'staff', e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                />
                <p className="text-xs mt-1" style={{color: '#011039'}}>Default loan period for staff</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Borrowing Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary-600" />
              Borrowing Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Student
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.borrowingLimits.student}
                  onChange={(e) => handleInputChange('borrowingLimits', 'student', parseInt(e.target.value))}
                />
                <p className="text-xs mt-1" style={{color: '#011039'}}>Maximum books a student can borrow</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Faculty
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.borrowingLimits.faculty}
                  onChange={(e) => handleInputChange('borrowingLimits', 'faculty', parseInt(e.target.value))}
                />
                <p className="text-xs mt-1" style={{color: '#011039'}}>Maximum books a faculty can borrow</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Staff
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.borrowingLimits.staff}
                  onChange={(e) => handleInputChange('borrowingLimits', 'staff', parseInt(e.target.value))}
                />
                <p className="text-xs mt-1" style={{color: '#011039'}}>Maximum books a staff can borrow</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fine Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary-600" />
              Fine Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Per Day Fine (Rs)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fineRates.perDay}
                  onChange={(e) => handleInputChange('fineRates', 'perDay', parseFloat(e.target.value))}
                />
                <p className="text-xs mt-1" style={{color: '#011039'}}>Fine charged per day for overdue books</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Maximum Fine (Rs)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fineRates.maxFine}
                  onChange={(e) => handleInputChange('fineRates', 'maxFine', parseFloat(e.target.value))}
                />
                <p className="text-xs mt-1" style={{color: '#011039'}}>Maximum fine amount for a single book</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Renewal Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary-600" />
              Renewal Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Maximum Renewals
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.renewalSettings.maxRenewals}
                  onChange={(e) => handleInputChange('renewalSettings', 'maxRenewals', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Number of times a book can be renewed</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Renewal Period (Days)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.renewalSettings.renewalPeriod}
                  onChange={(e) => handleInputChange('renewalSettings', 'renewalPeriod', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Extension period for each renewal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reservation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Reservation Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Maximum Reservations
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.reservationSettings.maxReservations}
                  onChange={(e) => handleInputChange('reservationSettings', 'maxReservations', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum active reservations per member</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Reservation Expiry (Days)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.reservationSettings.reservationExpiry}
                  onChange={(e) => handleInputChange('reservationSettings', 'reservationExpiry', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Days before reservation expires</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notification Days
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.reservationSettings.notificationDays}
                  onChange={(e) => handleInputChange('reservationSettings', 'notificationDays', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Days before due date to send reminder</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary-600" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Reminder Days
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="7"
                    value={formData.notifications.reminderDays}
                    onChange={(e) => handleInputChange('notifications', 'reminderDays', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Days before due date to send reminder notification to members (e.g., 2 means reminder will be sent 2 days before book is due)
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg" style={{borderColor: formData.notifications.emailEnabled ? '#E76800' : '#E5E7EB'}}>
                  <div>
                    <p className="font-bold" style={{color: '#011039'}}>Email Notifications</p>
                    <p className="text-sm text-gray-500">
                      Enable email notifications for book reminders and overdue alerts (Email service must be configured)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.emailEnabled}
                      onChange={(e) => handleInputChange('notifications', 'emailEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg" style={{borderColor: formData.notifications.overdueNotification ? '#E76800' : '#E5E7EB'}}>
                  <div>
                    <p className="font-bold" style={{color: '#011039'}}>Overdue Notifications</p>
                    <p className="text-sm text-gray-500">
                      Automatically send notifications for overdue books and generate fines (Disabling this will stop all overdue processing)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.overdueNotification}
                      onChange={(e) => handleInputChange('notifications', 'overdueNotification', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
              
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><strong>Reminder Days:</strong> Members receive "Book Due Tomorrow" notification based on this setting</li>
                      <li><strong>Email Notifications:</strong> When enabled, members will also receive email alerts (requires email configuration)</li>
                      <li><strong>Overdue Notifications:</strong> Controls automatic overdue detection, fine generation, and daily reminders</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Chat Support Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary-600" />
              Live Chat Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border-2 rounded-lg" style={{borderColor: formData.liveChat?.enabled ? '#E76800' : '#E5E7EB'}}>
                <div>
                  <p className="font-bold" style={{color: '#011039'}}>Enable Live Chat</p>
                  <p className="text-sm text-gray-500">
                    Allow students to chat with support team in real-time
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.liveChat?.enabled || false}
                    onChange={(e) => handleInputChange('liveChat', 'enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Working Hours
                </label>
                <Input
                  value={formData.liveChat?.workingHours || ''}
                  onChange={(e) => handleInputChange('liveChat', 'workingHours', e.target.value)}
                  placeholder="Monday - Friday: 9:00 AM - 5:00 PM"
                />
                <p className="text-xs text-gray-500 mt-1">Display when support team is available</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Offline Message
                </label>
                <textarea
                  value={formData.liveChat?.offlineMessage || ''}
                  onChange={(e) => handleInputChange('liveChat', 'offlineMessage', e.target.value)}
                  placeholder="Our support team is currently offline..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Message shown when no admin is available</p>
              </div>

              {/* Info Box */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <MessageCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-bold mb-1">Live Chat Features:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Real-time messaging between students and support team</li>
                      <li>Floating chat button appears on student dashboard when enabled</li>
                      <li>Admins can manage all chat conversations from Live Chat Support page</li>
                      <li>Automatic notifications for new messages</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button at Bottom */}
        <div className="flex justify-end gap-3 pb-6">
          <Button type="button" onClick={handleReset} variant="outline">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
