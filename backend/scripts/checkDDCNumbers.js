require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const checkDDCNumbers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check total books
    const totalBooks = await Book.countDocuments({});
    console.log(`Total books: ${totalBooks}\n`);

    // Check books with DDC numbers
    const booksWithDDC = await Book.find({ ddcNumber: { $exists: true, $ne: null, $ne: '' } });
    console.log(`Books with DDC Number: ${booksWithDDC.length}\n`);

    // Show sample books with DDC
    if (booksWithDDC.length > 0) {
      console.log('=== Sample books WITH DDC Number ===');
      booksWithDDC.slice(0, 5).forEach((book, idx) => {
        console.log(`${idx + 1}. ${book.title}`);
        console.log(`   DDC No: ${book.ddcNumber}`);
        console.log(`   Sr.No: ${book.accessionNumber}`);
        console.log(`   Category: ${book.category}`);
        console.log('');
      });
    } else {
      console.log('⚠️  NO BOOKS HAVE DDC NUMBERS!\n');
    }

    // Check books without DDC
    const booksWithoutDDC = await Book.find({ 
      $or: [
        { ddcNumber: { $exists: false } },
        { ddcNumber: null },
        { ddcNumber: '' }
      ]
    }).limit(5);

    console.log('=== Sample books WITHOUT DDC Number ===');
    booksWithoutDDC.forEach((book, idx) => {
      console.log(`${idx + 1}. ${book.title}`);
      console.log(`   DDC No: ${book.ddcNumber || 'NOT SET'}`);
      console.log(`   Sr.No: ${book.accessionNumber}`);
      console.log(`   Has field: ${book.hasOwnProperty('ddcNumber')}`);
      console.log('');
    });

    // Check schema
    const sampleBook = await Book.findOne({});
    if (sampleBook) {
      console.log('=== Book Schema Fields ===');
      console.log(Object.keys(sampleBook.toObject()));
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkDDCNumbers();
