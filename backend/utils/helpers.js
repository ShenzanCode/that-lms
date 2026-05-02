const Settings = require('../models/Settings');

/**
 * Calculate due date based on member type
 */
const calculateDueDate = async (memberType) => {
  const settings = await Settings.getSettings();
  const loanPeriods = settings.loanPeriods;
  
  const days = loanPeriods[memberType.toLowerCase()] || 14;
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);
  
  return dueDate;
};

/**
 * Calculate fine for overdue books
 */
const calculateFine = async (dueDate, returnDate = new Date()) => {
  const settings = await Settings.getSettings();
  const fineRate = settings.fineRates.perDay || 2;
  const maxFine = settings.fineRates.maxFine || 500;
  
  if (returnDate <= dueDate) {
    return 0;
  }
  
  const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
  const calculatedFine = daysOverdue * fineRate;
  
  return Math.min(calculatedFine, maxFine);
};

/**
 * Check if a date is a holiday
 */
const isHoliday = async (date) => {
  const settings = await Settings.getSettings();
  const holidays = settings.holidays || [];
  
  const checkDate = new Date(date).toDateString();
  return holidays.some(holiday => 
    new Date(holiday.date).toDateString() === checkDate
  );
};

/**
 * Generate unique accession number
 */
const generateAccessionNumber = (category, year) => {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const yearCode = year || new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  
  return `${categoryCode}${yearCode}${randomNum}`;
};

/**
 * Generate unique member ID
 */
const generateMemberId = (memberType, department) => {
  const typeCode = memberType.substring(0, 2).toUpperCase();
  const deptCode = department.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  return `${typeCode}${deptCode}${year}${randomNum}`;
};

/**
 * Format date to readable string
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

module.exports = {
  calculateDueDate,
  calculateFine,
  isHoliday,
  generateAccessionNumber,
  generateMemberId,
  formatDate
};
