const mongoose = require('mongoose');
const Book = require('../models/Book');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/library_management';

const fixBookStatus = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all books
    const books = await Book.find({});
    console.log(`Found ${books.length} books to check`);

    let fixedCount = 0;

    for (const book of books) {
      let needsUpdate = false;
      const originalStatus = book.status;

      // Fix status based on availableCopies
      if (book.status === 'Available' || book.status === 'Not Available') {
        if (book.availableCopies <= 0 && book.status !== 'Not Available') {
          book.status = 'Not Available';
          needsUpdate = true;
        } else if (book.availableCopies > 0 && book.status !== 'Available') {
          book.status = 'Available';
          needsUpdate = true;
        }
      }

      // Ensure availableCopies doesn't exceed totalCopies
      if (book.availableCopies > book.totalCopies) {
        console.log(`⚠️  Book "${book.title}" has availableCopies (${book.availableCopies}) > totalCopies (${book.totalCopies})`);
        book.availableCopies = book.totalCopies;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await book.save();
        fixedCount++;
        console.log(`✅ Fixed: "${book.title}" - Status: ${originalStatus} → ${book.status}, Available: ${book.availableCopies}/${book.totalCopies}`);
      }
    }

    console.log(`\n✨ Complete! Fixed ${fixedCount} books out of ${books.length} total`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing book status:', error);
    process.exit(1);
  }
};

fixBookStatus();
