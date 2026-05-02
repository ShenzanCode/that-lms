// Admin Notification Service
// Connected to backend API

import axios from '@/lib/axios';

const adminNotificationService = {
  async getNotifications() {
    try {
      const response = await axios.get('/admin/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  async markAsRead(id) {
    try {
      const response = await axios.patch(`/admin/notifications/${id}/read`);
      return response.status === 200;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  async markAllAsRead() {
    try {
      const response = await axios.patch('/admin/notifications/read-all');
      return response.status === 200;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  },

  async deleteNotification(id) {
    try {
      const response = await axios.delete(`/admin/notifications/${id}`);
      return response.status === 200;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  },
};

export { adminNotificationService };
