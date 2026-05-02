require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const fixBookCategories = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all books
    const allBooks = await Book.find({});
    console.log(`\nTotal books in database: ${allBooks.length}`);

    // Check and categorize books
    const booksWithCategory = allBooks.filter(book => book.category && book.category.trim());
    const booksWithoutCategory = allBooks.filter(book => !book.category || !book.category.trim());

    console.log(`\nBooks with category: ${booksWithCategory.length}`);
    console.log(`Books WITHOUT category: ${booksWithoutCategory.length}`);

    // Get unique categories
    const categories = {};
    booksWithCategory.forEach(book => {
      const cat = book.category;
      if (!categories[cat]) {
        categories[cat] = 0;
      }
      categories[cat]++;
    });

    console.log('\n=== EXISTING CATEGORIES ===');
    Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} books`);
    });

    if (booksWithoutCategory.length > 0) {
      console.log('\n=== BOOKS WITHOUT CATEGORY ===');
      console.log('These books need categories assigned:');
      booksWithoutCategory.slice(0, 10).forEach(book => {
        console.log(`  - "${book.title}" by ${book.author} (Sr.No: ${book.accessionNumber})`);
      });
      if (booksWithoutCategory.length > 10) {
        console.log(`  ... and ${booksWithoutCategory.length - 10} more`);
      }

      console.log('\n❌ ACTION REQUIRED:');
      console.log('Please delete all books and re-import your Excel file.');
      console.log('The import has been fixed to properly read categories from sheet/tab names.');
    } else {
      console.log('\n✅ All books have categories assigned!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixBookCategories();
