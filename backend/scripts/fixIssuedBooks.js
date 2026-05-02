const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const Member = require('../models/Member');
const Librarian = require('../models/Librarian');
require('dotenv').config();

async function fixIssuedBooks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Delete transactions with missing book or member references
    console.log('\n🧹 Cleaning up invalid transactions...');
    const transactions = await Transaction.find({ status: { $in: ['Issued', 'Overdue'] } });
    
    for (const transaction of transactions) {
      const book = await Book.findById(transaction.bookId);
      const member = await Member.findById(transaction.memberId);
      
      if (!book || !member) {
        await Transaction.findByIdAndDelete(transaction._id);
        console.log(`❌ Deleted invalid transaction: ${transaction._id}`);
      }
    }

    // Step 2: Check if we have books and members
    const books = await Book.find({ availableCopies: { $gt: 0 } }).limit(3);
    const members = await Member.find({ isBlocked: false }).limit(2);
    const librarian = await Librarian.findOne();

    if (books.length === 0) {
      console.log('\n❌ No books found in database. Please run seedDatabase.js first.');
      process.exit(1);
    }

    if (members.length === 0) {
      console.log('\n❌ No members found in database. Please run seedDatabase.js first.');
      process.exit(1);
    }

    console.log(`\n✅ Found ${books.length} available books`);
    console.log(`✅ Found ${members.length} active members`);

    // Step 3: Create 2-3 realistic issued book transactions
    console.log('\n📚 Creating test issued book transactions...');

    const now = new Date();
    const testTransactions = [
      {
        bookId: books[0]._id,
        memberId: members[0]._id,
        accessionNumber: books[0].accessionNumber,
        issueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        dueDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
        status: 'Issued',
        renewCount: 0,
        maxRenewals: 2,
        issuedBy: librarian?._id
      },
      {
        bookId: books[1 % books.length]._id,
        memberId: members[1 % members.length]._id,
        accessionNumber: books[1 % books.length].accessionNumber,
        issueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        dueDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days overdue
        status: 'Overdue',
        renewCount: 0,
        maxRenewals: 2,
        issuedBy: librarian?._id
      }
    ];

    if (books.length >= 3) {
      testTransactions.push({
        bookId: books[2]._id,
        memberId: members[0]._id,
        accessionNumber: books[2].accessionNumber,
        issueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Due tomorrow
        status: 'Issued',
        renewCount: 1,
        maxRenewals: 2,
        issuedBy: librarian?._id
      });
    }

    for (const txData of testTransactions) {
      const transaction = await Transaction.create(txData);
      
      // Update book available copies
      await Book.findByIdAndUpdate(txData.bookId, {
        $inc: { availableCopies: -1 }
      });
      
      await transaction.populate([
        { path: 'bookId', select: 'title author' },
        { path: 'memberId', select: 'name memberId' }
      ]);
      
      console.log(`✅ Created transaction: ${transaction.bookId.title} → ${transaction.memberId.name} (${transaction.status})`);
    }

    console.log('\n✨ All done! Issued books page should now work.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixIssuedBooks();
