const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Librarian = require('../models/Librarian');
const Settings = require('../models/Settings');
const Book = require('../models/Book');
const Member = require('../models/Member');

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Librarian.deleteMany({});
    await Settings.deleteMany({});
    await Book.deleteMany({});
    await Member.deleteMany({});
    
    console.log('🗑️  Cleared existing data');

    // Create admin librarian
    const admin = await Librarian.create({
      username: 'admin',
      email: 'admin@library.com',
      password: 'admin123',
      name: 'System Administrator',
      role: 'Admin'
    });

    console.log('✅ Created admin user');
    console.log('   Username: admin');
    console.log('   Password: admin123');

    // Create regular librarian
    await Librarian.create({
      username: 'librarian',
      email: 'librarian@library.com',
      password: 'lib123',
      name: 'John Librarian',
      role: 'Librarian'
    });

    console.log('✅ Created librarian user');
    console.log('   Username: librarian');
    console.log('   Password: lib123');

    // Create default settings
    await Settings.create({
      loanPeriods: {
        student: 14,
        faculty: 30,
        staff: 21
      },
      borrowingLimits: {
        student: 3,
        faculty: 10,
        staff: 5
      },
      fineRates: {
        perDay: 2,
        maxFine: 500
      },
      renewalSettings: {
        maxRenewals: 2,
        renewalPeriod: 7
      },
      reservationSettings: {
        maxReservations: 3,
        reservationExpiry: 7,
        notificationDays: 2
      },
      libraryInfo: {
        name: 'University Central Library',
        address: '123 University Campus, City',
        phone: '+1234567890',
        email: 'library@university.edu',
        workingHours: 'Monday - Saturday: 9:00 AM - 6:00 PM'
      }
    });

    console.log('✅ Created default settings');

    // Create sample books
    const sampleBooks = [
      {
        accessionNumber: 'CSE2301001',
        isbn: '978-0-13-468599-1',
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen',
        publisher: 'MIT Press',
        edition: '3rd',
        publicationYear: 2009,
        category: 'Computer Science',
        department: 'CSE',
        shelfLocation: 'A-12',
        totalCopies: 5,
        availableCopies: 5,
        pages: 1312,
        language: 'English',
        condition: 'Good',
        description: 'Comprehensive guide to algorithms and data structures',
        addedBy: admin._id
      },
      {
        accessionNumber: 'ECE2301002',
        isbn: '978-0-07-338057-5',
        title: 'Digital Signal Processing',
        author: 'John G. Proakis',
        publisher: 'Pearson',
        edition: '4th',
        publicationYear: 2006,
        category: 'Electronics',
        department: 'ECE',
        shelfLocation: 'B-05',
        totalCopies: 3,
        availableCopies: 3,
        pages: 1004,
        language: 'English',
        condition: 'Excellent',
        addedBy: admin._id
      },
      {
        accessionNumber: 'CSE2301003',
        isbn: '978-0-596-52068-7',
        title: 'JavaScript: The Good Parts',
        author: 'Douglas Crockford',
        publisher: "O'Reilly Media",
        edition: '1st',
        publicationYear: 2008,
        category: 'Computer Science',
        department: 'CSE',
        shelfLocation: 'A-18',
        totalCopies: 4,
        availableCopies: 4,
        pages: 176,
        language: 'English',
        condition: 'Good',
        addedBy: admin._id
      },
      {
        accessionNumber: 'PHY2301004',
        isbn: '978-0-321-75661-9',
        title: 'University Physics',
        author: 'Hugh D. Young',
        publisher: 'Pearson',
        edition: '13th',
        publicationYear: 2011,
        category: 'Physics',
        department: 'Physics',
        shelfLocation: 'C-10',
        totalCopies: 6,
        availableCopies: 6,
        pages: 1632,
        language: 'English',
        condition: 'Good',
        addedBy: admin._id
      },
      {
        accessionNumber: 'MATH2301005',
        isbn: '978-0-134-68990-4',
        title: 'Calculus: Early Transcendentals',
        author: 'James Stewart',
        publisher: 'Cengage Learning',
        edition: '8th',
        publicationYear: 2015,
        category: 'Mathematics',
        department: 'Mathematics',
        shelfLocation: 'D-03',
        totalCopies: 8,
        availableCopies: 8,
        pages: 1344,
        language: 'English',
        condition: 'Excellent',
        addedBy: admin._id
      },
      {
        accessionNumber: 'CSE2301006',
        isbn: '978-0-13-235088-4',
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        publisher: 'Prentice Hall',
        edition: '1st',
        publicationYear: 2008,
        category: 'Computer Science',
        department: 'CSE',
        shelfLocation: 'A-20',
        totalCopies: 5,
        availableCopies: 5,
        pages: 464,
        language: 'English',
        condition: 'Good',
        addedBy: admin._id
      },
      {
        accessionNumber: 'CSE2301007',
        isbn: '978-0-321-12521-7',
        title: 'Database System Concepts',
        author: 'Abraham Silberschatz',
        publisher: 'McGraw-Hill',
        edition: '7th',
        publicationYear: 2019,
        category: 'Computer Science',
        department: 'CSE',
        shelfLocation: 'A-25',
        totalCopies: 4,
        availableCopies: 4,
        pages: 1376,
        language: 'English',
        condition: 'Excellent',
        addedBy: admin._id
      },
      {
        accessionNumber: 'CHEM2301001',
        isbn: '978-0-321-94317-0',
        title: 'Chemistry: The Central Science',
        author: 'Theodore E. Brown',
        publisher: 'Pearson',
        edition: '14th',
        publicationYear: 2017,
        category: 'Chemistry',
        department: 'Chemistry',
        shelfLocation: 'E-08',
        totalCopies: 6,
        availableCopies: 6,
        pages: 1280,
        language: 'English',
        condition: 'Good',
        addedBy: admin._id
      },
      {
        accessionNumber: 'ENG2301001',
        isbn: '978-0-14-143951-8',
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        publisher: 'Penguin Classics',
        edition: '1st',
        publicationYear: 1813,
        category: 'Literature',
        department: 'English',
        shelfLocation: 'F-12',
        totalCopies: 7,
        availableCopies: 7,
        pages: 432,
        language: 'English',
        condition: 'Good',
        addedBy: admin._id
      },
      {
        accessionNumber: 'BIO2301001',
        isbn: '978-0-321-77565-8',
        title: 'Campbell Biology',
        author: 'Jane B. Reece',
        publisher: 'Pearson',
        edition: '11th',
        publicationYear: 2016,
        category: 'Biology',
        department: 'Biology',
        shelfLocation: 'G-05',
        totalCopies: 5,
        availableCopies: 5,
        pages: 1488,
        language: 'English',
        condition: 'Excellent',
        addedBy: admin._id
      },
      {
        accessionNumber: 'CSE2301008',
        isbn: '978-0-262-03384-8',
        title: 'Artificial Intelligence: A Modern Approach',
        author: 'Stuart Russell',
        publisher: 'Pearson',
        edition: '3rd',
        publicationYear: 2015,
        category: 'Computer Science',
        department: 'CSE',
        shelfLocation: 'A-30',
        totalCopies: 6,
        availableCopies: 6,
        pages: 1152,
        language: 'English',
        condition: 'Excellent',
        addedBy: admin._id
      },
      {
        accessionNumber: 'ECE2301003',
        isbn: '978-0-470-37697-2',
        title: 'Microelectronic Circuits',
        author: 'Adel S. Sedra',
        publisher: 'Oxford University Press',
        edition: '7th',
        publicationYear: 2014,
        category: 'Electronics',
        department: 'ECE',
        shelfLocation: 'B-10',
        totalCopies: 4,
        availableCopies: 4,
        pages: 1590,
        language: 'English',
        condition: 'Good',
        addedBy: admin._id
      },
      {
        accessionNumber: 'MGMT2301001',
        isbn: '978-1-259-92261-4',
        title: 'Management Information Systems',
        author: 'Kenneth C. Laudon',
        publisher: 'Pearson',
        edition: '15th',
        publicationYear: 2017,
        category: 'Management',
        department: 'Management',
        shelfLocation: 'H-15',
        totalCopies: 5,
        availableCopies: 5,
        pages: 640,
        language: 'English',
        condition: 'Good',
        addedBy: admin._id
      },
      {
        accessionNumber: 'MECH2301001',
        isbn: '978-0-07-339820-4',
        title: 'Engineering Mechanics: Dynamics',
        author: 'J. L. Meriam',
        publisher: 'Wiley',
        edition: '8th',
        publicationYear: 2015,
        category: 'Mechanical Engineering',
        department: 'Mechanical',
        shelfLocation: 'I-20',
        totalCopies: 6,
        availableCopies: 6,
        pages: 768,
        language: 'English',
        condition: 'Good',
        addedBy: admin._id
      },
      {
        accessionNumber: 'CSE2301009',
        isbn: '978-0-321-57351-3',
        title: 'Operating System Concepts',
        author: 'Abraham Silberschatz',
        publisher: 'Wiley',
        edition: '10th',
        publicationYear: 2018,
        category: 'Computer Science',
        department: 'CSE',
        shelfLocation: 'A-35',
        totalCopies: 7,
        availableCopies: 7,
        pages: 1040,
        language: 'English',
        condition: 'Excellent',
        addedBy: admin._id
      },
      {
        accessionNumber: 'MATH2301006',
        isbn: '978-0-471-43334-3',
        title: 'Advanced Engineering Mathematics',
        author: 'Erwin Kreyszig',
        publisher: 'Wiley',
        edition: '10th',
        publicationYear: 2011,
        category: 'Mathematics',
        department: 'Mathematics',
        shelfLocation: 'D-08',
        totalCopies: 5,
        availableCopies: 5,
        pages: 1264,
        language: 'English',
        condition: 'Good',
        addedBy: admin._id
      },
      {
        accessionNumber: 'CSE2301010',
        isbn: '978-0-13-449507-0',
        title: 'Computer Networks',
        author: 'Andrew S. Tanenbaum',
        publisher: 'Pearson',
        edition: '5th',
        publicationYear: 2010,
        category: 'Computer Science',
        department: 'CSE',
        shelfLocation: 'A-40',
        totalCopies: 6,
        availableCopies: 6,
        pages: 960,
        language: 'English',
        condition: 'Good',
        addedBy: admin._id
      },
      {
        accessionNumber: 'PHY2301002',
        isbn: '978-0-470-87990-6',
        title: 'Fundamentals of Physics',
        author: 'David Halliday',
        publisher: 'Wiley',
        edition: '10th',
        publicationYear: 2013,
        category: 'Physics',
        department: 'Physics',
        shelfLocation: 'C-15',
        totalCopies: 5,
        availableCopies: 5,
        pages: 1456,
        language: 'English',
        condition: 'Good',
        addedBy: admin._id
      },
      {
        accessionNumber: 'CSE2301011',
        isbn: '978-0-13-468728-5',
        title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
        author: 'Erich Gamma',
        publisher: 'Addison-Wesley',
        edition: '1st',
        publicationYear: 1994,
        category: 'Computer Science',
        department: 'CSE',
        shelfLocation: 'A-45',
        totalCopies: 4,
        availableCopies: 4,
        pages: 416,
        language: 'English',
        condition: 'Good',
        addedBy: admin._id
      },
      {
        accessionNumber: 'CIVIL2301001',
        isbn: '978-0-13-221149-8',
        title: 'Structural Analysis',
        author: 'Russell C. Hibbeler',
        publisher: 'Pearson',
        edition: '9th',
        publicationYear: 2014,
        category: 'Civil Engineering',
        department: 'Civil',
        shelfLocation: 'J-10',
        totalCopies: 5,
        availableCopies: 5,
        pages: 736,
        language: 'English',
        condition: 'Excellent',
        addedBy: admin._id
      }
    ];

    await Book.insertMany(sampleBooks);
    console.log('✅ Created sample books');

    // Create sample members
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const sampleMembers = [
      {
        memberId: 'STCSE231001',
        name: 'Alice Johnson',
        email: 'alice.j@university.edu',
        phone: '+1234567891',
        department: 'Computer Science',
        memberType: 'Student',
        year: '3rd Year',
        course: 'B.Tech CSE',
        borrowingLimit: 3,
        validUntil,
        createdBy: admin._id
      },
      {
        memberId: 'STECE231002',
        name: 'Bob Smith',
        email: 'bob.s@university.edu',
        phone: '+1234567892',
        department: 'Electronics',
        memberType: 'Student',
        year: '2nd Year',
        course: 'B.Tech ECE',
        borrowingLimit: 3,
        validUntil,
        createdBy: admin._id
      },
      {
        memberId: 'FACSE231001',
        name: 'Dr. Sarah Williams',
        email: 'sarah.w@university.edu',
        phone: '+1234567893',
        department: 'Computer Science',
        memberType: 'Faculty',
        borrowingLimit: 10,
        validUntil,
        createdBy: admin._id
      },
      {
        memberId: 'STPHY231003',
        name: 'Charlie Brown',
        email: 'charlie.b@university.edu',
        phone: '+1234567894',
        department: 'Physics',
        memberType: 'Staff',
        borrowingLimit: 5,
        validUntil,
        createdBy: admin._id
      }
    ];

    await Member.insertMany(sampleMembers);
    console.log('✅ Created sample members');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Admin - Username: admin, Password: admin123');
    console.log('   Librarian - Username: librarian, Password: lib123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
