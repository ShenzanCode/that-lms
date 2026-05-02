const mongoose = require('mongoose');
const AdminNotification = require('./models/AdminNotification');
const Notification = require('./models/Notification');

async function debugNotificationMixing() {
  try {
    await mongoose.connect('mongodb://localhost:27017/library_management');
    
    console.log('=== Checking for Authentication/Interface Mixing Issues ===');
    
    // Check recent "Book Due Tomorrow" notifications from both models
    console.log('\n1. Member Notifications (should be "Book Due Tomorrow"):');
    const memberNotifs = await Notification.find({
      title: { $regex: 'Book Due Tomorrow', $options: 'i' }
    }).sort({ createdAt: -1 }).limit(3);
    
    memberNotifs.forEach((notif, i) => {
      console.log(`   ${i+1}. Title: "${notif.title}" | Member: ${notif.memberId} | Created: ${notif.createdAt.toISOString()}`);
    });
    
    console.log('\n2. Admin Notifications (should be "Book Due Tomorrow Alert"):');
    const adminNotifs = await AdminNotification.find({
      title: { $regex: 'Book Due Tomorrow', $options: 'i' }
    }).sort({ createdAt: -1 }).limit(3);
    
    adminNotifs.forEach((notif, i) => {
      console.log(`   ${i+1}. Title: "${notif.title}" | Type: ${notif.type} | Created: ${notif.createdAt.toISOString()}`);
    });
    
    // Check if there are any AdminNotifications with wrong titles
    console.log('\n3. Checking for AdminNotifications with Member Titles:');
    const wrongAdminNotifs = await AdminNotification.find({
      title: 'Book Due Tomorrow'  // This should NOT exist
    });
    
    if (wrongAdminNotifs.length > 0) {
      console.log(`   ⚠️  FOUND ${wrongAdminNotifs.length} AdminNotifications with member title!`);
      wrongAdminNotifs.forEach((notif, i) => {
        console.log(`   ${i+1}. ID: ${notif._id} | Title: "${notif.title}" | Type: ${notif.type}`);
      });
    } else {
      console.log('   ✅ No AdminNotifications with member titles found (good)');
    }
    
    // Check if any Notifications have admin-like titles
    console.log('\n4. Checking for Member Notifications with Admin Titles:');
    const wrongMemberNotifs = await Notification.find({
      title: 'Book Due Tomorrow Alert'  // This should NOT exist
    });
    
    if (wrongMemberNotifs.length > 0) {
      console.log(`   ⚠️  FOUND ${wrongMemberNotifs.length} member notifications with admin title!`);
      wrongMemberNotifs.forEach((notif, i) => {
        console.log(`   ${i+1}. ID: ${notif._id} | Title: "${notif.title}" | Member: ${notif.memberId}`);
      });
    } else {
      console.log('   ✅ No member notifications with admin titles found (good)');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugNotificationMixing();