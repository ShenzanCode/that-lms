const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Librarian = require('../models/Librarian');

dotenv.config();

function printUsage() {
  console.log('Usage: node scripts/resetLibrarianPassword.js <username> <newPassword>');
  console.log('Example: node scripts/resetLibrarianPassword.js admin NewPass123!');
}

async function main() {
  const [, , usernameArg, newPassword] = process.argv;

  if (!usernameArg || !newPassword || usernameArg === '--help' || usernameArg === '-h') {
    printUsage();
    process.exit(usernameArg ? 0 : 1);
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library_management';

  try {
    await mongoose.connect(mongoUri);

    const username = String(usernameArg).trim().toLowerCase();
    const librarian = await Librarian.findOne({ username }).select('+password');

    if (!librarian) {
      console.error(`❌ Librarian not found for username: ${username}`);
      process.exit(1);
    }

    librarian.password = newPassword;
    await librarian.save();

    console.log(`✅ Password reset successful for: ${username}`);
  } catch (error) {
    console.error('❌ Password reset failed:', error.message);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  }
}

main();
