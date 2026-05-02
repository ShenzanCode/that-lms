require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const categoryMapping = {
  // Wrong -> Correct
  'Stock List UOS': 'Miscellaneous',
  'Phychology': 'Psychology',
  'Bussiness': 'Business',
  'Computer': 'Computer / Computer Science',
  'International relations': 'International Relations',
  'Communication and media': 'Communication and Media',
  'Sports sciences': 'Sports Sciences',
  'Islamic Studies': 'Islamic Studies', // Already correct
  'Social Work': 'Social Work', // Already correct
};

const normalizeCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    let totalUpdated = 0;

    for (const [wrongCategory, correctCategory] of Object.entries(categoryMapping)) {
      const result = await Book.updateMany(
        { category: wrongCategory },
        { $set: { category: correctCategory } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✓ Updated ${result.modifiedCount} books: "${wrongCategory}" → "${correctCategory}"`);
        totalUpdated += result.modifiedCount;
      }
    }

    console.log(`\n✅ Total books updated: ${totalUpdated}`);

    // Show final category breakdown
    const allBooks = await Book.find({});
    const categories = {};
    allBooks.forEach(book => {
      const cat = book.category || 'NO CATEGORY';
      if (!categories[cat]) {
        categories[cat] = 0;
      }
      categories[cat]++;
    });

    console.log('\n=== FINAL CATEGORIES ===');
    Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} books`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

normalizeCategories();
