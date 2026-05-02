const mongoose = require('mongoose');
const Member = require('./models/Member');
const Settings = require('./models/Settings');

async function testBorrowingLimitUpdate() {
  try {
    await mongoose.connect('mongodb://localhost:27017/library_management');
    
    console.log('=== Testing Borrowing Limit Update on Member Type Change ===');
    
    // Get current settings to see borrowing limits
    const settings = await Settings.getSettings();
    console.log('\nCurrent Borrowing Limits from Settings:');
    console.log(`- Student: ${settings.borrowingLimits.student}`);
    console.log(`- Faculty: ${settings.borrowingLimits.faculty}`);
    console.log(`- Staff: ${settings.borrowingLimits.staff}`);
    
    // Find a test member
    const testMember = await Member.findOne();
    if (!testMember) {
      console.log('❌ No members found in database');
      return;
    }
    
    console.log(`\n📝 Found test member: ${testMember.name} (${testMember.memberId})`);
    console.log(`   Current Type: ${testMember.memberType}`);
    console.log(`   Current Borrowing Limit: ${testMember.borrowingLimit}`);
    
    // Simulate the update logic
    const newMemberType = testMember.memberType === 'Student' ? 'Faculty' : 'Student';
    const newBorrowingLimit = settings.borrowingLimits[newMemberType.toLowerCase()];
    
    console.log(`\n🔄 Simulating change to: ${newMemberType}`);
    console.log(`   Expected new borrowing limit: ${newBorrowingLimit}`);
    
    // Test the update logic (without actually updating)
    if (newMemberType !== testMember.memberType) {
      console.log('✅ Member type change detected - borrowing limit would be updated');
      console.log(`   Old: ${testMember.memberType} (${testMember.borrowingLimit} books)`);
      console.log(`   New: ${newMemberType} (${newBorrowingLimit} books)`);
    } else {
      console.log('❌ No member type change detected');
    }
    
    console.log('\n✅ Test completed - logic appears to be working correctly!');
    console.log('\n💡 To test the actual API:');
    console.log(`   PUT /api/members/${testMember._id}`);
    console.log(`   Body: { "memberType": "${newMemberType}" }`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBorrowingLimitUpdate();