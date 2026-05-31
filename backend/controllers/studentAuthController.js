const Member = require('../models/Member');
const Settings = require('../models/Settings');
const AdminNotification = require('../models/AdminNotification');
const generateToken = require('../utils/generateToken');
const { getMemberPhotoUrl } = require('../utils/imageUrl');
const { uploadImageBuffer } = require('../utils/cloudinary');

// @desc    Register new student
// @route   POST /api/student-auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { username, password, email, memberType = 'Student' } = req.body;

    // Validate required fields
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, password, and email'
      });
    }

    // Validate memberType
    if (!['Student', 'Faculty', 'Staff'].includes(memberType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member type'
      });
    }

    // Check if username already exists
    const existingUsername = await Member.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await Member.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Get settings to determine borrowing limit based on member type
    const settings = await Settings.getSettings();
    const memberTypeLower = memberType.toLowerCase();
    const borrowingLimit = settings.borrowingLimits[memberTypeLower] || 3;

    // Create member with minimal data
    const member = await Member.create({
      username,
      password,
      email,
      name: username, // Temporary, will be updated in profile setup
      phone: '0000000000', // Temporary
      department: 'Not Set', // Temporary
      memberType: memberType,
      memberId: `TEMP${Date.now()}`, // Temporary ID, will be updated
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      registrationStatus: 'pending', // Require approval
      profileCompleted: false, // Require profile completion
      borrowingLimit: borrowingLimit
    });

    // Generate token
    const token = generateToken(member._id, 'student');

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please complete your profile.',
      data: {
        id: member._id,
        username: member.username,
        email: member.email,
        memberType: member.memberType,
        registrationStatus: member.registrationStatus,
        profileCompleted: member.profileCompleted,
        borrowingLimit: member.borrowingLimit
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student login
// @route   POST /api/student-auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Check for member
    const member = await Member.findOne({ username }).select('+password');

    if (!member) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if member has password (not created by librarian)
    if (!member.password) {
      return res.status(401).json({
        success: false,
        message: 'This account was created by librarian. Please contact library administration.'
      });
    }

    // Check password
    const isMatch = await member.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if blocked - Allow login but return blocked status
    // We'll let them authenticate but frontend will redirect to blocked page
    const isBlocked = member.isBlocked;

    // Generate token
    const token = generateToken(member._id, 'student');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: member._id,
        username: member.username,
        name: member.name,
        email: member.email,
        memberType: member.memberType,
        registrationStatus: member.registrationStatus,
        profileCompleted: member.profileCompleted,
        photo: getMemberPhotoUrl(member.photo, req), // Generate full URL
        photoFilename: member.photo, // Keep original filename
        rejectionReason: member.rejectionReason || null,
        memberId: member.memberId,
        phone: member.phone,
        department: member.department,
        subject: member.subject,
        semester: member.semester,
        document: member.document,
        isBlocked: member.isBlocked || false,
        blockReason: member.blockReason || null
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit profile
// @route   PUT /api/student-auth/profile-setup
// @access  Private (Student)
const submitProfile = async (req, res, next) => {
  try {
    const {
      name,
      rollNumber,
      phone,
      department,
      subject,
      semester
    } = req.body;

    const memberType = req.student.memberType;

    // Validate required fields based on member type
    if (!name || !rollNumber || !department || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Semester is only required for students
    if (memberType === 'Student' && !semester) {
      return res.status(400).json({
        success: false,
        message: 'Semester is required for students'
      });
    }

    // Check if roll number already exists
    const existingRollNumber = await Member.findOne({
      memberId: rollNumber.toUpperCase(),
      _id: { $ne: req.student._id }
    });

    if (existingRollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Roll number already exists'
      });
    }

    // Update member
    req.student.name = name;
    req.student.memberId = rollNumber.toUpperCase();
    req.student.phone = phone || '';
    req.student.department = department;
    req.student.subject = subject;
    
    // Only set semester for students
    if (memberType === 'Student') {
      req.student.semester = semester;
    }
    
    req.student.profileCompleted = true;

    // If student was rejected, reset to pending status and clear rejection reason
    if (req.student.registrationStatus === 'rejected') {
      req.student.registrationStatus = 'pending';
      req.student.rejectionReason = null;
    }

    // Handle photo if provided
    if (req.files && req.files.photo && req.files.photo[0]) {
      const uploadedPhoto = await uploadImageBuffer(req.files.photo[0], 'library-management/member-photos');
      req.student.photo = uploadedPhoto.secure_url;
    }

    // Handle document (fee challan or university card) if provided
    if (req.files && req.files.document && req.files.document[0]) {
      const uploadedDocument = await uploadImageBuffer(req.files.document[0], 'library-management/student-documents');
      req.student.document = uploadedDocument.secure_url;
    }

    await req.student.save();

    // Create admin notification for new profile submission
    await AdminNotification.create({
      title: 'New Profile Submission - Pending Approval',
      message: `${name} (${rollNumber.toUpperCase()}) - ${memberType} submitted profile for approval. Department: ${department}`,
      type: 'general'
    });

    res.json({
      success: true,
      message: 'Profile submitted successfully. Waiting for librarian approval.',
      data: {
        id: req.student._id,
        username: req.student.username,
        name: req.student.name,
        email: req.student.email,
        registrationStatus: req.student.registrationStatus,
        profileCompleted: req.student.profileCompleted,
        memberId: req.student.memberId,
        phone: req.student.phone,
        department: req.student.department,
        subject: req.student.subject,
        semester: req.student.semester,
        photo: req.student.photo,
        document: req.student.document
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current student
// @route   GET /api/student-auth/me
// @access  Private (Student)
const getMe = async (req, res, next) => {
  try {
    const member = await Member.findById(req.student._id);

    res.json({
      success: true,
      data: {
        id: member._id,
        username: member.username,
        name: member.name,
        email: member.email,
        phone: member.phone,
        memberId: member.memberId,
        department: member.department,
        memberType: member.memberType,
        year: member.year,
        course: member.course,
        subject: member.subject,
        semester: member.semester,
        address: member.address,
        photo: getMemberPhotoUrl(member.photo, req), // Generate full URL
        photoFilename: member.photo, // Keep original filename
        registrationStatus: member.registrationStatus,
        profileCompleted: member.profileCompleted,
        rejectionReason: member.rejectionReason,
        isBlocked: member.isBlocked,
        blockReason: member.blockReason,
        borrowingLimit: member.borrowingLimit,
        currentBorrowedBooks: member.currentBorrowedBooks,
        validUntil: member.validUntil
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student profile
// @route   PUT /api/student-auth/profile
// @access  Private (Student)
const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      department,
      year,
      course,
      address,
      removePhoto
    } = req.body;

    // Validate required fields
    if (!name || !phone || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Update member fields
    req.student.name = name;
    req.student.phone = phone;
    req.student.department = department;
    req.student.year = year || '';
    req.student.course = course || '';
    req.student.address = address || '';

    // Handle photo removal
    if (removePhoto === 'true') {
      req.student.photo = null;
    }

    // Handle photo if provided
    if (req.files && req.files.photo && req.files.photo[0]) {
      const uploadedPhoto = await uploadImageBuffer(req.files.photo[0], 'library-management/member-photos');
      req.student.photo = uploadedPhoto.secure_url;
    }

    await req.student.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: req.student._id,
        username: req.student.username,
        name: req.student.name,
        email: req.student.email,
        phone: req.student.phone,
        memberId: req.student.memberId,
        department: req.student.department,
        memberType: req.student.memberType,
        year: req.student.year,
        course: req.student.course,
        address: req.student.address,
        photo: getMemberPhotoUrl(req.student.photo, req),
        photoFilename: req.student.photo,
        registrationStatus: req.student.registrationStatus,
        profileCompleted: req.student.profileCompleted,
        borrowingLimit: req.student.borrowingLimit,
        currentBorrowedBooks: req.student.currentBorrowedBooks
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  submitProfile,
  updateProfile,
  getMe
};
