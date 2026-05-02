const Settings = require('../models/Settings');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');

// @desc    Get settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.getSettings();

    const updateData = {
      ...req.body,
      lastUpdated: Date.now(),
      updatedBy: req.user.id
    };

    settings = await Settings.findByIdAndUpdate(
      settings._id,
      updateData,
      { new: true, runValidators: true }
    );

    // If borrowing limits were updated, update all existing members
    if (req.body.borrowingLimits) {
      const { student, faculty, staff } = req.body.borrowingLimits;
      
      // Update all students
      if (student !== undefined) {
        await Member.updateMany(
          { memberType: 'Student' },
          { borrowingLimit: student }
        );
      }
      
      // Update all faculty
      if (faculty !== undefined) {
        await Member.updateMany(
          { memberType: 'Faculty' },
          { borrowingLimit: faculty }
        );
      }
      
      // Update all staff
      if (staff !== undefined) {
        await Member.updateMany(
          { memberType: 'Staff' },
          { borrowingLimit: staff }
        );
      }
    }

    // If renewal settings were updated, update all existing issued/overdue transactions
    if (req.body.renewalSettings && req.body.renewalSettings.maxRenewals !== undefined) {
      await Transaction.updateMany(
        { status: { $in: ['Issued', 'Overdue'] } },
        { maxRenewals: req.body.renewalSettings.maxRenewals }
      );
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
