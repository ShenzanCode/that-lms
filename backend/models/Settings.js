const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  loanPeriods: {
    student: {
      type: Number,
      default: 14, // days
      min: [1, 'Loan period must be at least 1 day']
    },
    faculty: {
      type: Number,
      default: 30, // days
      min: [1, 'Loan period must be at least 1 day']
    },
    staff: {
      type: Number,
      default: 21, // days
      min: [1, 'Loan period must be at least 1 day']
    }
  },
  borrowingLimits: {
    student: {
      type: Number,
      default: 3,
      min: 1
    },
    faculty: {
      type: Number,
      default: 10,
      min: 1
    },
    staff: {
      type: Number,
      default: 5,
      min: 1
    }
  },
  fineRates: {
    perDay: {
      type: Number,
      default: 100, // currency per day
      min: 0
    },
    maxFine: {
      type: Number,
      default: 500,
      min: 0
    }
  },
  renewalSettings: {
    maxRenewals: {
      type: Number,
      default: 2,
      min: 0
    },
    renewalPeriod: {
      type: Number,
      default: 7, // days
      min: 1
    }
  },
  reservationSettings: {
    maxReservations: {
      type: Number,
      default: 3,
      min: 1
    },
    reservationExpiry: {
      type: Number,
      default: 7, // days
      min: 1
    },
    notificationDays: {
      type: Number,
      default: 2, // days before due date
      min: 0
    }
  },
  holidays: [{
    date: Date,
    name: String
  }],
  libraryInfo: {
    name: {
      type: String,
      default: 'University Library'
    },
    address: String,
    phone: String,
    email: String,
    workingHours: {
      type: String,
      default: 'Monday - Saturday: 9:00 AM - 6:00 PM'
    }
  },
  notifications: {
    emailEnabled: {
      type: Boolean,
      default: false
    },
    reminderDays: {
      type: Number,
      default: 2
    },
    overdueNotification: {
      type: Boolean,
      default: true
    }
  },
  liveChat: {
    enabled: {
      type: Boolean,
      default: true
    },
    offlineMessage: {
      type: String,
      default: 'Our support team is currently offline. Please leave a message and we will respond as soon as possible.'
    },
    workingHours: {
      type: String,
      default: 'Monday - Friday: 9:00 AM - 5:00 PM'
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Librarian'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
