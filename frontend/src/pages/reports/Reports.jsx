import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { reportService } from '@/services/reportService';
import {
  BarChart3,
  Clock,
  Star,
  BookOpen,
  Users,
  DollarSign,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  AlertCircle,
  BookCheck,
  FileText,
  RotateCcw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(tabParam || 'dashboard');
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [overdueReport, setOverdueReport] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [transactionsReport, setTransactionsReport] = useState({ data: [], summary: {} });
  const [memberActivity, setMemberActivity] = useState([]);
  const [fineCollection, setFineCollection] = useState({ data: [], summary: {}, byPaymentMethod: {} });

  // Sync activeTab with URL param if it changes
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Sync URL param with activeTab state
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Filter states
  const [dateFilters, setDateFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportFilters, setReportFilters] = useState({
    status: '',
    department: '',
    memberType: '',
    limit: 20
  });

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardStats();
    } else if (activeTab === 'overdue') {
      loadOverdueReport();
    } else if (activeTab === 'popular-books') {
      loadPopularBooks();
    } else if (activeTab === 'transactions') {
      loadTransactionsReport();
    } else if (activeTab === 'member-activity') {
      loadMemberActivity();
    } else if (activeTab === 'fine-collection') {
      loadFineCollection();
    }
  }, [activeTab]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await reportService.getDashboardStats();
      setDashboardStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setDashboardStats(null);
    } finally {
      setLoading(false);
    }
  };

  const loadOverdueReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getOverdueReport();
      setOverdueReport(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading overdue report:', error);
      setOverdueReport([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPopularBooks = async () => {
    try {
      setLoading(true);
      const data = await reportService.getPopularBooksReport({
        ...dateFilters,
        limit: reportFilters.limit
      });
      setPopularBooks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading popular books:', error);
      setPopularBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionsReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getTransactionsReport({
        ...dateFilters,
        status: reportFilters.status,
        department: reportFilters.department
      });
      setTransactionsReport(data);
    } catch (error) {
      console.error('Error loading transactions report:', error);
      setTransactionsReport({ data: [], summary: {} });
    } finally {
      setLoading(false);
    }
  };

  const loadMemberActivity = async () => {
    try {
      setLoading(true);
      const data = await reportService.getMemberActivityReport({
        ...dateFilters,
        memberType: reportFilters.memberType,
        department: reportFilters.department
      });
      setMemberActivity(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading member activity:', error);
      setMemberActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFineCollection = async () => {
    try {
      setLoading(true);
      const data = await reportService.getFineCollectionReport(dateFilters);
      setFineCollection(data);
    } catch (error) {
      console.error('Error loading fine collection:', error);
      setFineCollection({ data: [], summary: {}, byPaymentMethod: {} });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (activeTab === 'popular-books') {
      loadPopularBooks();
    } else if (activeTab === 'transactions') {
      loadTransactionsReport();
    } else if (activeTab === 'member-activity') {
      loadMemberActivity();
    } else if (activeTab === 'fine-collection') {
      loadFineCollection();
    }
  };

  const clearFilters = () => {
    setDateFilters({
      startDate: '',
      endDate: ''
    });
    setReportFilters({
      status: '',
      department: '',
      memberType: '',
      limit: 20
    });
    // Reload data with cleared filters
    setTimeout(() => {
      if (activeTab === 'popular-books') {
        loadPopularBooks();
      } else if (activeTab === 'transactions') {
        loadTransactionsReport();
      } else if (activeTab === 'member-activity') {
        loadMemberActivity();
      } else if (activeTab === 'fine-collection') {
        loadFineCollection();
      }
    }, 100);
    toast.success('Filters cleared');
  };

  const exportReport = () => {
    let csvContent = '';
    let filename = '';
    const currentDate = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Helper function to format currency
    const formatCurrency = (amount) => `Rs ${parseFloat(amount || 0).toFixed(2)}`;
    
    // Helper function to format date
    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    switch (activeTab) {
      case 'overdue':
        filename = `Overdue_Books_Report_${new Date().toISOString().split('T')[0]}.csv`;
        
        // Report Header
        csvContent = '=== LIBRARY MANAGEMENT SYSTEM ===\n';
        csvContent += 'OVERDUE BOOKS REPORT\n';
        csvContent += `Generated on: ${currentDate}\n`;
        csvContent += `Total Overdue Books: ${overdueReport.length}\n`;
        csvContent += '\n';
        
        // Column Headers
        csvContent += 'Member ID,Member Name,Book Title,Author,ISBN,Due Date,Days Overdue,Fine Amount\n';
        csvContent += '================================================================================\n';
        
        // Data Rows
        let totalFine = 0;
        overdueReport.forEach(item => {
          const fine = parseFloat(item.calculatedFine || 0);
          totalFine += fine;
          csvContent += `"${item.memberId?.memberId || 'N/A'}","${item.memberId?.name || 'N/A'}","${item.bookId?.title || 'N/A'}","${item.bookId?.author || 'N/A'}","${item.bookId?.isbn || 'N/A'}","${formatDate(item.dueDate)}",${item.daysOverdue},${formatCurrency(fine)}\n`;
        });
        
        // Summary
        csvContent += '================================================================================\n';
        csvContent += `SUMMARY,,,,,,Total Fine:,${formatCurrency(totalFine)}\n`;
        break;
      
      case 'popular-books':
        filename = `Popular_Books_Report_${new Date().toISOString().split('T')[0]}.csv`;
        
        csvContent = '=== LIBRARY MANAGEMENT SYSTEM ===\n';
        csvContent += 'POPULAR BOOKS REPORT\n';
        csvContent += `Generated on: ${currentDate}\n`;
        csvContent += `Total Books Listed: ${popularBooks.length}\n`;
        csvContent += '\n';
        
        csvContent += 'Rank,Book Title,Author,Category,ISBN,Total Issues,Availability\n';
        csvContent += '================================================================================\n';
        
        let totalIssues = 0;
        popularBooks.forEach((book, index) => {
          totalIssues += book.issueCount;
          csvContent += `${index + 1},"${book.title}","${book.author}","${book.category}","${book.isbn || 'N/A'}",${book.issueCount},"${book.availableCopies || 0} / ${book.totalCopies || 0}"\n`;
        });
        
        csvContent += '================================================================================\n';
        csvContent += `SUMMARY,,,,,${totalIssues},\n`;
        break;
      
      case 'transactions':
        filename = `Transactions_Report_${new Date().toISOString().split('T')[0]}.csv`;
        
        csvContent = '=== LIBRARY MANAGEMENT SYSTEM ===\n';
        csvContent += 'TRANSACTIONS REPORT\n';
        csvContent += `Generated on: ${currentDate}\n`;
        csvContent += `Total Transactions: ${transactionsReport.data.length}\n`;
        if (dateFilters.startDate || dateFilters.endDate) {
          csvContent += `Filter Period: ${dateFilters.startDate || 'Start'} to ${dateFilters.endDate || 'End'}\n`;
        }
        csvContent += '\n';
        
        csvContent += 'Transaction ID,Member ID,Member Name,Member Type,Book Title,Issue Date,Due Date,Return Date,Status,Fine Amount\n';
        csvContent += '================================================================================\n';
        
        let totalTransactionFines = 0;
        let issuedCount = 0, returnedCount = 0, overdueCount = 0;
        
        transactionsReport.data.forEach(tx => {
          const fine = parseFloat(tx.fineAmount || 0);
          totalTransactionFines += fine;
          if (tx.status === 'Issued') issuedCount++;
          else if (tx.status === 'Returned') returnedCount++;
          else if (tx.status === 'Overdue') overdueCount++;
          
          csvContent += `"${tx._id}","${tx.memberId?.memberId || 'N/A'}","${tx.memberId?.name || 'N/A'}","${tx.memberId?.memberType || 'N/A'}","${tx.bookId?.title || 'N/A'}","${formatDate(tx.issueDate)}","${formatDate(tx.dueDate)}","${tx.returnDate ? formatDate(tx.returnDate) : 'Not Returned'}","${tx.status}",${formatCurrency(fine)}\n`;
        });
        
        csvContent += '================================================================================\n';
        csvContent += 'SUMMARY\n';
        csvContent += `Total Transactions:,${transactionsReport.data.length}\n`;
        csvContent += `Issued:,${issuedCount}\n`;
        csvContent += `Returned:,${returnedCount}\n`;
        csvContent += `Overdue:,${overdueCount}\n`;
        csvContent += `Total Fines Collected:,${formatCurrency(totalTransactionFines)}\n`;
        break;
      
      case 'member-activity':
        filename = `Member_Activity_Report_${new Date().toISOString().split('T')[0]}.csv`;
        
        csvContent = '=== LIBRARY MANAGEMENT SYSTEM ===\n';
        csvContent += 'MEMBER ACTIVITY REPORT\n';
        csvContent += `Generated on: ${currentDate}\n`;
        csvContent += `Total Members: ${memberActivity.length}\n`;
        csvContent += '\n';
        
        csvContent += 'Member ID,Full Name,Member Type,Department,Email/Contact,Total Books Borrowed,Currently Borrowed,Overdue Books,Fine Status\n';
        csvContent += '================================================================================\n';
        
        let totalBorrowed = 0, totalCurrent = 0, totalOverdue = 0;
        
        memberActivity.forEach(member => {
          totalBorrowed += member.totalBorrowed || 0;
          totalCurrent += member.currentlyBorrowed || 0;
          totalOverdue += member.overdue || 0;
          
          csvContent += `"${member.memberId}","${member.name}","${member.memberType}","${member.department}","${member.email || member.phone || 'N/A'}",${member.totalBorrowed},${member.currentlyBorrowed},${member.overdue},"${member.overdue > 0 ? 'Has Fines' : 'Clear'}"\n`;
        });
        
        csvContent += '================================================================================\n';
        csvContent += 'SUMMARY\n';
        csvContent += `Total Members:,${memberActivity.length}\n`;
        csvContent += `Total Books Borrowed (All Time):,${totalBorrowed}\n`;
        csvContent += `Currently Borrowed:,${totalCurrent}\n`;
        csvContent += `Total Overdue:,${totalOverdue}\n`;
        break;
      
      case 'fine-collection':
        filename = `Fine_Collection_Report_${new Date().toISOString().split('T')[0]}.csv`;
        
        csvContent = '=== LIBRARY MANAGEMENT SYSTEM ===\n';
        csvContent += 'FINE COLLECTION REPORT\n';
        csvContent += `Generated on: ${currentDate}\n`;
        csvContent += `Total Fine Records: ${fineCollection.data.length}\n`;
        csvContent += '\n';
        
        // Summary Section
        csvContent += 'FINANCIAL SUMMARY\n';
        csvContent += `Total Fines Generated:,${formatCurrency(fineCollection.summary?.totalFines || 0)}\n`;
        csvContent += `Amount Collected:,${formatCurrency(fineCollection.summary?.collected || 0)}\n`;
        csvContent += `Amount Waived:,${formatCurrency(fineCollection.summary?.waived || 0)}\n`;
        csvContent += `Outstanding Amount:,${formatCurrency(fineCollection.summary?.outstanding || 0)}\n`;
        csvContent += '\n';
        
        // Payment Method Breakdown
        if (Object.keys(fineCollection.byPaymentMethod).length > 0) {
          csvContent += 'COLLECTION BY PAYMENT METHOD\n';
          Object.entries(fineCollection.byPaymentMethod).forEach(([method, amount]) => {
            csvContent += `${method}:,${formatCurrency(amount)}\n`;
          });
          csvContent += '\n';
        }
        
        csvContent += 'DETAILED FINE RECORDS\n';
        csvContent += 'Member ID,Member Name,Book Title,Fine Amount,Paid Amount,Waived Amount,Outstanding,Payment Method,Payment Date,Status\n';
        csvContent += '================================================================================\n';
        
        fineCollection.data.forEach(fine => {
          const outstanding = fine.amount - fine.paidAmount - fine.waivedAmount;
          const status = outstanding > 0 ? 'Pending' : 'Cleared';
          csvContent += `"${fine.memberId?.memberId || 'N/A'}","${fine.memberId?.name || 'N/A'}","${fine.bookId?.title || 'N/A'}",${formatCurrency(fine.amount)},${formatCurrency(fine.paidAmount)},${formatCurrency(fine.waivedAmount)},${formatCurrency(outstanding)},"${fine.paymentMethod || 'Not Paid'}","${fine.paidDate ? formatDate(fine.paidDate) : 'N/A'}","${status}"\n`;
        });
        
        csvContent += '================================================================================\n';
        break;
      
      default:
        toast.error('Export not available for this report');
        return;
    }

    if (!csvContent || csvContent.split('\n').length <= 5) {
      toast.error('No data available to export');
      return;
    }

    // Add footer
    csvContent += '\n';
    csvContent += '=== END OF REPORT ===\n';
    csvContent += 'Library Management System\n';
    csvContent += `Report Generated: ${currentDate}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Report exported successfully: ${filename}`);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'overdue', label: 'Overdue Books', icon: Clock },
    { id: 'popular-books', label: 'Popular Books', icon: Star },
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'member-activity', label: 'Member Activity', icon: Users },
    { id: 'fine-collection', label: 'Fine Collection', icon: DollarSign }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Reports</h1>
          <p className="mt-1" style={{color: '#011039'}}>Analytics and insights for your library</p>
        </div>
        {activeTab !== 'dashboard' && (
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <Card>
        <div className="px-4 pt-4">
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'hover:text-white'
                  }`}
                  style={{
                    backgroundColor: activeTab === tab.id ? '#E76800' : 'transparent',
                    color: activeTab === tab.id ? 'white' : '#011039'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.backgroundColor = 'rgba(231, 104, 0, 0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </Card>

      {/* Filters */}
      {activeTab !== 'dashboard' && activeTab !== 'overdue' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label mb-2 block">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateFilters.startDate}
                  onChange={(e) => setDateFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="label mb-2 block">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={dateFilters.endDate}
                  onChange={(e) => setDateFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="input"
                />
              </div>
              
              {activeTab === 'transactions' && (
                <>
                  <div>
                    <label className="label mb-2 block">
                      Status
                    </label>
                    <select
                      value={reportFilters.status}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="input"
                    >
                      <option value="">All Status</option>
                      <option value="Issued">Issued</option>
                      <option value="Returned">Returned</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                  <div>
                    <label className="label mb-2 block">
                      Department
                    </label>
                    <input
                      type="text"
                      value={reportFilters.department}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Enter department"
                      className="input"
                    />
                  </div>
                </>
              )}

              {activeTab === 'member-activity' && (
                <>
                  <div>
                    <label className="label mb-2 block">
                      Member Type
                    </label>
                    <select
                      value={reportFilters.memberType}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, memberType: e.target.value }))}
                      className="input"
                    >
                      <option value="">All Types</option>
                      <option value="Student">Student</option>
                      <option value="Faculty">Faculty</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="label mb-2 block">
                      Department
                    </label>
                    <input
                      type="text"
                      value={reportFilters.department}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Enter department"
                      className="input"
                    />
                  </div>
                </>
              )}

              <div className="flex items-end gap-2">
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  <RotateCcw className="h-4 w-4" />
                  Clear Filters
                </Button>
                <Button onClick={applyFilters} variant="primary" className="w-full">
                  <Filter className="h-4 w-4" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && dashboardStats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{color: '#011039'}}>Total Books</p>
                    <p className="text-3xl font-bold mt-2" style={{color: '#011039'}}>{dashboardStats?.books?.total || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Available: {dashboardStats?.books?.available || 0} | Issued: {dashboardStats?.books?.issued || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{color: '#011039'}}>Total Members</p>
                    <p className="text-3xl font-bold mt-2" style={{color: '#011039'}}>{dashboardStats?.members?.total || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Active: {dashboardStats?.members?.active || 0} | Blocked: {dashboardStats?.members?.blocked || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-secondary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{color: '#011039'}}>Overdue Books</p>
                    <p className="text-3xl font-bold mt-2" style={{color: '#011039'}}>{dashboardStats?.overdueBooks || 0}</p>
                    <p className="text-sm mt-1" style={{color: '#011039'}}>Require attention</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-danger-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{color: '#011039'}}>Total Fines</p>
                    <p className="text-3xl font-bold mt-2" style={{color: '#011039'}}>Rs {dashboardStats?.fines?.totalFines || 0}</p>
                    <p className="text-sm mt-1" style={{color: '#011039'}}>
                      Collected: Rs {dashboardStats?.fines?.collected || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-warning-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Today's Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <BookCheck className="h-4 w-4 text-success-600" />
                      <span>Books Issued:</span>
                    </div>
                    <span className="font-bold text-success-600">{dashboardStats?.today?.issued || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary-600" />
                      <span>Books Returned:</span>
                    </div>
                    <span className="font-bold text-primary-600">{dashboardStats?.today?.returned || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning-600" />
                      <span>Pending Reservations:</span>
                    </div>
                    <span className="font-bold text-warning-600">{dashboardStats?.pendingReservations || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Popular Categories (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(dashboardStats?.popularCategories || []).map((category, index) => (
                    <div key={category._id} className="flex justify-between items-center">
                      <span className="text-sm">{category._id || 'Uncategorized'}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 rounded-full h-2" style={{backgroundColor: '#E5E7EB'}}>
                          <div 
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${dashboardStats?.popularCategories?.[0]?.count ? (category.count / dashboardStats.popularCategories[0].count) * 100 : 0}%`,
                              backgroundColor: '#E76800'
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold">{category.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{borderBottom: '1px solid #E76800', backgroundColor: '#F8F9FA'}}>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Member</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Book</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Issue Date</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Status</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Issued By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardStats?.recentTransactions || []).map((transaction) => (
                      <tr key={transaction._id} style={{borderBottom: '1px solid #E5E7EB'}} className="hover:bg-orange-50 transition-colors">
                        <td className="py-3 px-4 font-bold">{transaction.memberId?.name || 'N/A'}</td>
                        <td className="py-3 px-4">{transaction.bookId?.title || 'N/A'}</td>
                        <td className="py-3 px-4">{new Date(transaction.issueDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                            transaction.status === 'Issued' ? 'bg-primary-100 text-primary-800' :
                            transaction.status === 'Returned' ? 'bg-success-100 text-success-800' :
                            'bg-danger-100 text-danger-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">{transaction.issuedBy?.name || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overdue Books Tab */}
      {activeTab === 'overdue' && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-danger-600" />
              Overdue Books ({overdueReport.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueReport.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4" style={{color: '#E76800'}} />
                <p style={{color: '#011039'}}>No overdue books found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{borderBottom: '1px solid #E76800', backgroundColor: '#F8F9FA'}}>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Member ID</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Member Name</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Contact</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Book Title</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Author</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Due Date</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Days Overdue</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Fine Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueReport.map((transaction) => (
                      <tr key={transaction._id} style={{borderBottom: '1px solid #E5E7EB'}} className="hover:bg-orange-50 transition-colors">
                        <td className="py-3 px-4">{transaction.memberId?.memberId || 'N/A'}</td>
                        <td className="py-3 px-4 font-bold">{transaction.memberId?.name || 'N/A'}</td>
                        <td className="py-3 px-4">{transaction.memberId?.phone || 'N/A'}</td>
                        <td className="py-3 px-4">{transaction.bookId?.title || 'N/A'}</td>
                        <td className="py-3 px-4" style={{color: '#011039'}}>{transaction.bookId?.author || 'N/A'}</td>
                        <td className="py-3 px-4">{new Date(transaction.dueDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-danger-100 text-danger-800">
                            {transaction.daysOverdue} days
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-danger-600">Rs {transaction.calculatedFine}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Popular Books Tab */}
      {activeTab === 'popular-books' && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-warning-600" />
              Popular Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularBooks.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto mb-4" style={{color: '#E76800'}} />
                <p style={{color: '#011039'}}>No popular books data found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{borderBottom: '1px solid #E76800', backgroundColor: '#F8F9FA'}}>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Rank</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Title</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Author</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Category</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Issue Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popularBooks.map((book, index) => (
                      <tr key={book._id} style={{borderBottom: '1px solid #E5E7EB'}} className="hover:bg-orange-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {index < 3 && <Star className="h-4 w-4 text-warning-500" />}
                            <span className="font-bold text-primary-600">#{index + 1}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold">{book.title}</td>
                        <td className="py-3 px-4" style={{color: '#011039'}}>{book.author}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-800">
                            {book.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-success-600">
                            <TrendingUp className="h-4 w-4" />
                            {book.issueCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && !loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{color: '#011039'}}>Total</p>
                    <p className="text-2xl font-bold mt-1" style={{color: '#011039'}}>{transactionsReport.summary.totalTransactions || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#FFF3E0'}}>
                    <FileText className="h-5 w-5" style={{color: '#E76800'}} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{color: '#011039'}}>Issued</p>
                    <p className="text-2xl font-bold text-primary-600 mt-1">{transactionsReport.summary.issued || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <BookCheck className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{color: '#011039'}}>Returned</p>
                    <p className="text-2xl font-bold text-success-600 mt-1">{transactionsReport.summary.returned || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-success-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{color: '#011039'}}>Overdue</p>
                    <p className="text-2xl font-bold text-danger-600 mt-1">{transactionsReport.summary.overdue || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-danger-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600">Total Fines</p>
                    <p className="text-2xl font-bold text-warning-600 mt-1">Rs {transactionsReport.summary.totalFines || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-warning-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transaction Details ({transactionsReport.data?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsReport.data?.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4" style={{color: '#E76800'}} />
                  <p style={{color: '#011039'}}>No transactions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{borderBottom: '1px solid #E76800', backgroundColor: '#F8F9FA'}}>
                        <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Member</th>
                        <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Book</th>
                        <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Issue Date</th>
                        <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Due Date</th>
                        <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Return Date</th>
                        <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Status</th>
                        <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Fine</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionsReport.data.map((transaction) => (
                        <tr key={transaction._id} style={{borderBottom: '1px solid #E5E7EB'}} className="hover:bg-orange-50 transition-colors">
                          <td className="py-3 px-4 font-bold">{transaction.memberId?.name || 'N/A'}</td>
                          <td className="py-3 px-4">{transaction.bookId?.title || 'N/A'}</td>
                          <td className="py-3 px-4">{new Date(transaction.issueDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4">{new Date(transaction.dueDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            {transaction.returnDate ? new Date(transaction.returnDate).toLocaleDateString() : (
                              <span style={{color: '#6B7280'}}>Not returned</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                              transaction.status === 'Issued' ? 'bg-primary-100 text-primary-800' :
                              transaction.status === 'Returned' ? 'bg-success-100 text-success-800' :
                              'bg-danger-100 text-danger-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-bold ${
                              (transaction.fine || 0) > 0 ? 'text-danger-600' : ''
                            }`} style={{color: (transaction.fine || 0) > 0 ? undefined : '#6B7280'}}>
                              Rs {transaction.fine || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Member Activity Tab */}
      {activeTab === 'member-activity' && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary-600" />
              Member Activity Report ({memberActivity.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {memberActivity.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4" style={{color: '#E76800'}} />
                <p style={{color: '#011039'}}>No member activity data found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{borderBottom: '1px solid #E76800', backgroundColor: '#F8F9FA'}}>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Member ID</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Name</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Type</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Department</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Total Borrowed</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Currently Borrowed</th>
                      <th className="text-left py-3 px-4 font-bold" style={{color: '#011039'}}>Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberActivity.map((member) => (
                      <tr key={member._id} style={{borderBottom: '1px solid #E5E7EB'}} className="hover:bg-orange-50 transition-colors">
                        <td className="py-3 px-4" style={{color: '#011039'}}>{member.memberId}</td>
                        <td className="py-3 px-4" style={{color: '#011039'}}>{member.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
                            {member.memberType}
                          </span>
                        </td>
                        <td className="py-3 px-4" style={{color: '#011039'}}>{member.department}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-primary-600">{member.totalBorrowed}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-secondary-600">{member.currentlyBorrowed}</span>
                        </td>
                        <td className="py-3 px-4">
                          {member.overdue > 0 ? (
                            <span className="font-bold text-danger-600">{member.overdue}</span>
                          ) : (
                            <span className="text-success-600">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fine Collection Tab */}
      {activeTab === 'fine-collection' && !loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{color: '#011039'}}>Total Fines</p>
                    <p className="text-2xl font-bold mt-1" style={{color: '#011039'}}>Rs {fineCollection.summary?.totalFines || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#FFF3E0'}}>
                    <DollarSign className="h-5 w-5" style={{color: '#E76800'}} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{color: '#011039'}}>Collected</p>
                    <p className="text-2xl font-bold text-success-600 mt-1">Rs {fineCollection.summary?.collected || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-success-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{color: '#011039'}}>Waived</p>
                    <p className="text-2xl font-bold text-warning-600 mt-1">Rs {fineCollection.summary?.waived || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-warning-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{color: '#011039'}}>Outstanding</p>
                    <p className="text-2xl font-bold text-danger-600 mt-1">Rs {fineCollection.summary?.outstanding || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-danger-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Method Breakdown */}
          {Object.keys(fineCollection.byPaymentMethod).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Collection by Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(fineCollection.byPaymentMethod).map(([method, amount]) => (
                    <div key={method} className="text-center p-4 border rounded-lg">
                      <div className="text-xl font-bold text-primary-600">Rs {amount}</div>
                      <div className="text-sm capitalize" style={{color: '#011039'}}>{method}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fine Collection Table */}
          <Card>
            <CardHeader>
              <CardTitle>Fine Collection Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{borderBottom: '1px solid #E76800'}}>
                      <th className="text-left py-2" style={{color: '#011039'}}>Member</th>
                      <th className="text-left py-2" style={{color: '#011039'}}>Book</th>
                      <th className="text-left py-2" style={{color: '#011039'}}>Fine Amount</th>
                      <th className="text-left py-2" style={{color: '#011039'}}>Paid Amount</th>
                      <th className="text-left py-2" style={{color: '#011039'}}>Waived Amount</th>
                      <th className="text-left py-2" style={{color: '#011039'}}>Outstanding</th>
                      <th className="text-left py-2" style={{color: '#011039'}}>Payment Method</th>
                      <th className="text-left py-2" style={{color: '#011039'}}>Paid Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fineCollection.data.map((fine) => (
                      <tr key={fine._id} style={{borderBottom: '1px solid #E5E7EB'}} className="hover:bg-orange-50">
                        <td className="py-2">{fine.memberId?.name || 'N/A'}</td>
                        <td className="py-2">{fine.bookId?.title || 'N/A'}</td>
                        <td className="py-2">Rs {fine.amount}</td>
                        <td className="py-2">Rs {fine.paidAmount}</td>
                        <td className="py-2">Rs {fine.waivedAmount}</td>
                        <td className="py-2">
                          <span className={`font-bold ${
                            (fine.amount - fine.paidAmount - fine.waivedAmount) > 0 ? 'text-danger-600' : 'text-success-600'
                          }`}>
                            Rs {fine.amount - fine.paidAmount - fine.waivedAmount}
                          </span>
                        </td>
                        <td className="py-2 capitalize">{fine.paymentMethod || '-'}</td>
                        <td className="py-2">
                          {fine.paidDate ? new Date(fine.paidDate).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
