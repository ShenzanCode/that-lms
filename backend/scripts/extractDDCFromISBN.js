require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const extractDDCFromISBN = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all books
    const allBooks = await Book.find({});
    console.log(`Total books: ${allBooks.length}\n`);

    let updated = 0;
    let skipped = 0;

    for (const book of allBooks) {
      // ISBN format: Category-SrNo-DDCNo (e.g., "InternationalRelations-2675-0053")
      if (book.isbn && book.isbn.includes('-')) {
        const parts = book.isbn.split('-');
        if (parts.length >= 3) {
          const ddcPart = parts[2]; // Third part is DDC number (without dots)
          
          // Reconstruct DDC with dots if it's a valid number
          if (ddcPart && ddcPart !== '0' && /^\d+$/.test(ddcPart)) {
            // Add decimal point if DDC is 3+ digits (e.g., 0053 -> 005.3, 510 -> 510)
            let ddcNumber = ddcPart;
            if (ddcPart.length >= 4) {
              // Format like 0053 -> 005.3
              ddcNumber = ddcPart.slice(0, 3) + '.' + ddcPart.slice(3);
            } else if (ddcPart.length === 3) {
              // Format like 510 -> 510
              ddcNumber = ddcPart;
            }
            
            // Update the book
            book.ddcNumber = ddcNumber;
            await book.save();
            
            if (updated < 5) {
              console.log(`✓ Updated: ${book.title}`);
              console.log(`  ISBN: ${book.isbn}`);
              console.log(`  DDC No: ${ddcNumber}`);
              console.log('');
            }
            updated++;
          } else {
            skipped++;
          }
        }
      } else {
        skipped++;
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Updated: ${updated} books`);
    console.log(`Skipped: ${skipped} books (no valid DDC in ISBN)`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

extractDDCFromISBN();
