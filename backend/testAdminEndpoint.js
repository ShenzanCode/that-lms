const mongoose = require('mongoose');
const AdminNotification = require('./models/AdminNotification');

async function testAdminEndpoint() {
  try {
    await mongoose.connect('mongodb://localhost:27017/library_management');
    
    console.log('=== Simulating Admin Notification Endpoint ===');
    const notifications = await AdminNotification.find().sort({ createdAt: -1 }).limit(10);
    
    console.log('Raw data from AdminNotification.find():');
    notifications.forEach((notif, i) => {
      console.log(`${i+1}. ID: ${notif._id} | Title: '${notif.title}' | Type: ${notif.type} | Created: ${notif.createdAt.toISOString()}`);
    });
    
    console.log('\nJSON response (what frontend receives):');
    const response = { success: true, data: notifications };
    console.log(JSON.stringify(response, null, 2));
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testAdminEndpoint();