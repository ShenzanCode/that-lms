const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Fine = require('../models/Fine');
const Notification = require('../models/Notification');
const AdminNotification = require('../models/AdminNotification');
const Settings = require('../models/Settings');
const { calculateFine } = require('../utils/helpers');

class OverdueService {
  static async sendDueDateReminders() {
    try {
      // Get settings to check if notifications are enabled
      const settings = await Settings.getSettings();
      
      // Check if overdue notifications are disabled
      if (!settings.notifications.overdueNotification) {
        console.log('⏸️  Overdue notifications are disabled in settings');
        return { remindersSent: 0 };
      }
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Find all issued transactions due tomorrow
      const dueTransactions = await Transaction.find({
        status: 'Issued',
        dueDate: {
          $gte: tomorrow,
          $lt: dayAfterTomorrow
        }
      }).populate('bookId', 'title author')
        .populate('memberId', 'name memberId');

      console.log(`📧 Sending due date reminders for ${dueTransactions.length} book(s)`);

      let remindersSent = 0;

      for (const transaction of dueTransactions) {
        try {
          const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
          
          // Check if reminder already sent today to student
          const existingReminder = await Notification.findOne({
            memberId: transaction.memberId._id,
            relatedId: transaction._id,
            relatedType: 'transaction',
            title: 'Book Due Tomorrow',
            createdAt: {
              $gte: todayStart
            }
          });
          
          // Check if admin notification already sent today for this transaction
          const existingAdminReminder = await AdminNotification.findOne({
            title: 'Book Due Tomorrow Alert',
            relatedId: transaction._id,
            createdAt: {
              $gte: todayStart
            }
          });

          if (!existingReminder) {
            await Notification.create({
              memberId: transaction.memberId._id,
              title: 'Book Due Tomorrow',
              message: `Reminder: "${transaction.bookId.title}" by ${transaction.bookId.author} is due tomorrow (${transaction.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}). Please return it on time to avoid fines.`,
              type: 'general',
              relatedId: transaction._id,
              relatedType: 'transaction'
            });
            
            remindersSent++;
          }
          
          // Create admin notification separately only if not already sent
          if (!existingAdminReminder) {
            await AdminNotification.create({
              title: 'Book Due Tomorrow Alert',
              message: `Book "${transaction.bookId.title}" is due tomorrow for member ${transaction.memberId.name}.`,
              type: 'overdue_warning',
              relatedId: transaction._id
            });
          }
        } catch (error) {
          console.error(`❌ Error sending reminder for transaction ${transaction._id}:`, error.message);
        }
      }

      if (remindersSent > 0) {
        console.log(`✅ Sent ${remindersSent} due date reminder(s)`);
      }

      return { remindersSent };
    } catch (error) {
      console.error('❌ Error in sendDueDateReminders:', error);
      throw error;
    }
  }

  static async generateOverdueFines() {
    try {
      // Get settings to check if notifications are enabled
      const settings = await Settings.getSettings();
      
      // Check if overdue notifications are disabled
      if (!settings.notifications.overdueNotification) {
        console.log('⏸️  Overdue notifications are disabled in settings');
        return { finesCreated: 0, finesUpdated: 0 };
      }
      
      const currentDate = new Date();
      
      // Find all issued transactions that are overdue
      const overdueTransactions = await Transaction.find({
        status: { $in: ['Issued', 'Overdue'] },
        dueDate: { $lt: currentDate }
      }).populate('bookId', 'title author accessionNumber')
        .populate('memberId', 'name memberId');

      console.log(`🕒 Processing ${overdueTransactions.length} overdue transaction(s)`);

      let finesCreated = 0;
      let finesUpdated = 0;

      for (const transaction of overdueTransactions) {
        try {
          // Calculate current fine
          const calculatedFine = await calculateFine(transaction.dueDate, currentDate);
          
          if (calculatedFine > 0) {
            // Check if a fine already exists for this transaction
            const existingFine = await Fine.findOne({ 
              transactionId: transaction._id 
            });

            if (existingFine) {
              // Update existing fine amount
              existingFine.amount = calculatedFine;
              existingFine.updatedAt = currentDate;
              await existingFine.save();
              finesUpdated++;

              // Send daily overdue reminder (only once per day)
              const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
              const existingOverdueAlert = await Notification.findOne({
                memberId: transaction.memberId._id,
                relatedId: transaction._id,
                relatedType: 'transaction',
                title: 'Overdue Book Alert',
                createdAt: { $gte: todayStart }
              });

              if (!existingOverdueAlert) {
                const daysOverdue = Math.ceil((currentDate - transaction.dueDate) / (1000 * 60 * 60 * 24));
                await Notification.create({
                  memberId: transaction.memberId._id,
                  title: 'Overdue Book Alert',
                  message: `Your book "${transaction.bookId.title}" is ${daysOverdue} day(s) overdue. Please return it immediately to avoid additional fines. Current fine: Rs ${calculatedFine.toFixed(2)}.`,
                  type: 'overdue',
                  relatedId: transaction._id,
                  relatedType: 'transaction'
                });
              }
            } else {
              // Create new fine record
              const daysOverdue = Math.ceil((currentDate - transaction.dueDate) / (1000 * 60 * 60 * 24));
              
              const newFine = await Fine.create({
                transactionId: transaction._id,
                memberId: transaction.memberId._id,
                bookId: transaction.bookId._id,
                amount: calculatedFine,
                reason: 'Overdue',
                description: `Book overdue for ${daysOverdue} days`,
                isPaid: false,
                paidAmount: 0,
                waivedAmount: 0
              });
              
              // Create notification for new fine (first time overdue)
              await Notification.create({
                memberId: transaction.memberId._id,
                title: 'Book Overdue - Fine Generated',
                message: `Your book "${transaction.bookId.title}" by ${transaction.bookId.author} is now overdue by ${daysOverdue} day(s). A fine of Rs ${calculatedFine.toFixed(2)} has been generated. Please return the book and clear the fine at the library.`,
                type: 'fine',
                relatedId: newFine._id,
                relatedType: 'fine'
              });
              
              // Create admin notification for fine generated
              await AdminNotification.create({
                title: 'Overdue Fine Generated',
                message: `A fine of Rs ${calculatedFine.toFixed(2)} has been generated for overdue book "${transaction.bookId.title}" by member ${transaction.memberId.name}.`,
                type: 'fine_alert'
              });
              
              finesCreated++;
            }

            // Update transaction status to 'Overdue'
            if (transaction.status !== 'Overdue') {
              transaction.status = 'Overdue';
              await transaction.save();
            }
          }
        } catch (error) {
          console.error(`❌ Error processing transaction ${transaction._id}:`, error.message);
        }
      }

      if (finesCreated > 0 || finesUpdated > 0) {
        console.log(`💰 Fine generation complete - Created: ${finesCreated}, Updated: ${finesUpdated}`);
      }

      return { finesCreated, finesUpdated };
    } catch (error) {
      console.error('❌ Error in generateOverdueFines:', error);
      throw error;
    }
  }

  static startScheduler() {
    // Run immediately on start
    this.generateOverdueFines().catch(console.error);
    this.sendDueDateReminders().catch(console.error);

    // Run every day at 6:00 AM
    const scheduleInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    setInterval(() => {
      this.generateOverdueFines().catch(console.error);
      this.sendDueDateReminders().catch(console.error);
    }, scheduleInterval);

    console.log('📅 Overdue fine scheduler started - runs daily');
  }
}

module.exports = OverdueService;