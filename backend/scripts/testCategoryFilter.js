require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const testCategoryFilter = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const testCategories = ['Business', 'English', 'Physics', 'Miscellaneous'];

    for (const category of testCategories) {
      // Simulate the backend query
      const escapedCategory = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const query = { category: { $regex: new RegExp(`^${escapedCategory}$`, 'i') } };
      
      const books = await Book.find(query).limit(5);
      
      console.log(`=== Testing "${category}" filter ===`);
      console.log(`Query: ${JSON.stringify(query)}`);
      console.log(`Found: ${books.length} books (showing first 5)`);
      
      if (books.length > 0) {
        books.forEach((book, idx) => {
          console.log(`  ${idx + 1}. ${book.title} (Category: "${book.category}")`);
        });
      } else {
        console.log('  ⚠️  NO BOOKS FOUND!');
      }
      console.log('');
    }

    // Count by category to verify
    console.log('=== Database Category Counts ===');
    const counts = await Book.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    counts.forEach(c => {
      console.log(`  ${c._id}: ${c.count} books`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testCategoryFilter();
