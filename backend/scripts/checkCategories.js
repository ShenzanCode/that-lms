require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const checkCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all unique categories
    const allBooks = await Book.find({});
    const categories = {};
    
    allBooks.forEach(book => {
      const cat = book.category || 'NO CATEGORY';
      if (!categories[cat]) {
        categories[cat] = [];
      }
      categories[cat].push({
        title: book.title,
        accessionNumber: book.accessionNumber
      });
    });

    console.log('=== CURRENT CATEGORIES ===\n');
    
    const sortedCategories = Object.entries(categories).sort((a, b) => b[1].length - a[1].length);
    
    sortedCategories.forEach(([cat, books]) => {
      console.log(`${cat}: ${books.length} books`);
    });

    // Check for problematic categories
    console.log('\n=== CHECKING FOR ISSUES ===\n');
    
    const problematicPatterns = [
      'stock',
      'bussiness',
      'phychology',
      'list',
      'uos'
    ];

    let hasIssues = false;

    sortedCategories.forEach(([cat, books]) => {
      const catLower = cat.toLowerCase();
      for (const pattern of problematicPatterns) {
        if (catLower.includes(pattern)) {
          console.log(`⚠️  Found problematic category: "${cat}" (${books.length} books)`);
          console.log(`   Sample books:`);
          books.slice(0, 3).forEach(book => {
            console.log(`   - ${book.title} (${book.accessionNumber})`);
          });
          console.log('');
          hasIssues = true;
          break;
        }
      }
    });

    if (!hasIssues) {
      console.log('✅ No problematic categories found!');
    }

    // Show correct categories
    const correctCategories = [
      'Biology', 'Business', 'Chemistry', 'Communication and Media', 
      'Computer / Computer Science', 'Education', 'English', 'History',
      'Information Technology', 'International Relations', 'Islamic Studies',
      'Mathematics', 'Miscellaneous', 'Physics', 'Psychology', 
      'Social Work', 'Sociology', 'Sports Sciences', 'Urdu', 'Zoology'
    ];

    console.log('\n=== EXPECTED CATEGORIES ===');
    correctCategories.forEach(cat => {
      const found = categories[cat];
      if (found) {
        console.log(`✓ ${cat}: ${found.length} books`);
      } else {
        console.log(`✗ ${cat}: 0 books (MISSING)`);
      }
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkCategories();
