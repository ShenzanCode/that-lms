const mongoose = require('mongoose');
const AdminNotification = require('./models/AdminNotification');
const Notification = require('./models/Notification');

async function checkNotifications() {
  try {
    await mongoose.connect('mongodb://localhost:27017/library_management');
    
    console.log('=== AdminNotifications with Book Due Tomorrow ===');
    const adminNotifs = await AdminNotification.find({
      title: { $regex: 'Book Due Tomorrow', $options: 'i' }
    }).sort({ createdAt: -1 }).limit(5);
    
    adminNotifs.forEach((notif, i) => {
      console.log(`${i+1}. Title: '${notif.title}' | Type: ${notif.type} | Created: ${notif.createdAt.toISOString()}`);
    });
    
    console.log('\n=== Regular Notifications with Book Due Tomorrow ===');
    const memberNotifs = await Notification.find({
      title: { $regex: 'Book Due Tomorrow', $options: 'i' }
    }).sort({ createdAt: -1 }).limit(5);
    
    memberNotifs.forEach((notif, i) => {
      console.log(`${i+1}. Title: '${notif.title}' | Type: ${notif.type} | Member: ${notif.memberId} | Created: ${notif.createdAt.toISOString()}`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkNotifications();