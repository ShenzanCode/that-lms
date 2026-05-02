const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Fine = require('../models/Fine');
const Book = require('../models/Book');
const Member = require('../models/Member');
const { calculateFine } = require('../utils/helpers');
require('dotenv').config();

async function generateOverdueFines() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const currentDate = new Date();
    
    // Find all issued transactions that are overdue
    const overdueTransactions = await Transaction.find({
      status: { $in: ['Issued', 'Overdue'] },
      dueDate: { $lt: currentDate }
    }).populate('bookId', 'title author accessionNumber')
      .populate('memberId', 'name memberId');

    console.log(`\n🕒 Found ${overdueTransactions.length} overdue transaction(s)\n`);

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
            console.log(`📝 Updated fine for: ${transaction.bookId?.title} - Member: ${transaction.memberId?.name} - Amount: Rs ${calculatedFine}`);
          } else {
            // Create new fine record
            const daysOverdue = Math.ceil((currentDate - transaction.dueDate) / (1000 * 60 * 60 * 24));
            
            await Fine.create({
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
            finesCreated++;
            console.log(`💰 Created fine for: ${transaction.bookId?.title} - Member: ${transaction.memberId?.name} - Amount: Rs ${calculatedFine}`);
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

    console.log(`\n📊 Summary:`);
    console.log(`   - Fines created: ${finesCreated}`);
    console.log(`   - Fines updated: ${finesUpdated}`);
    console.log(`   - Total processed: ${finesCreated + finesUpdated}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateOverdueFines();