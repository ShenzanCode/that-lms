import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useMemberAuthStore } from './store/memberAuthStore'

// Layouts
import MainLayout from './layouts/MainLayout'
import StudentLayout from './layouts/StudentLayout'

// Librarian Pages
import Dashboard from './pages/Dashboard'
import Books from './pages/books/Books'
import BookDetails from './pages/books/BookDetails'
import AddBook from './pages/books/AddBook'
import EditBook from './pages/books/EditBook'
import Members from './pages/members/Members'
import MemberDetails from './pages/members/MemberDetails'
import AddMember from './pages/members/AddMember'
import EditMember from './pages/members/EditMember'
import PendingApprovals from './pages/members/PendingApprovals'
import IssueBook from './pages/transactions/IssueBook'
import ReturnBook from './pages/transactions/ReturnBook'
import IssuedBooks from './pages/transactions/IssuedBooks'
import Reservations from './pages/reservations/Reservations'
import Fines from './pages/fines/Fines'
import Reports from './pages/reports/Reports'
import Settings from './pages/settings/Settings'
import AdminProfile from './pages/admin/AdminProfile'
import AdminNotifications from './pages/admin/AdminNotifications'
import TestNotifications from './pages/admin/TestNotifications'
import LiveChatSupport from './pages/admin/LiveChatSupport'
import NotFound from './pages/NotFound'
import Landing from './pages/Landing'
import PublicCatalog from './pages/PublicCatalog'

// Student Pages
import ProfileSetup from './pages/student/ProfileSetup'
import PendingApprovalPage from './pages/student/PendingApprovalPage'
import RejectedStatusPage from './pages/student/RejectedStatusPage'
import BlockedPage from './pages/student/BlockedPage'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentCatalog from './pages/student/StudentCatalog'
import StudentMyBooks from './pages/student/StudentMyBooks'
import StudentReservations from './pages/student/StudentReservations'
import StudentFines from './pages/student/StudentFines'
import StudentProfile from './pages/student/StudentProfile'
import StudentNotifications from './pages/student/StudentNotifications'
import ChatHistory from './pages/members/ChatHistory'

// Protected Route Component for Librarian
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, token } = useAuthStore()
  
  // Check all authentication conditions for librarian
  if (!isAuthenticated || !user || !token) {
    return <Navigate to="/landing?auth=login&type=librarian" replace />
  }
  
  return children
}

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? children : <Navigate to="/" replace />
}

// Student Protected Route Component
const StudentProtectedRoute = ({ children }) => {
  const { isAuthenticated, student } = useMemberAuthStore()
  
  if (!isAuthenticated || !student) {
    return <Navigate to="/landing?auth=login&type=student" replace />
  }

  // Check if account is blocked - redirect to blocked page
  if (student.isBlocked) {
    return <Navigate to="/student/blocked" replace />
  }

  // If profile is incomplete, ALWAYS allow profile setup
  if (student.profileCompleted === false) {
    return <Navigate to="/student/profile-setup" replace />
  }

  // Pending users go to pending page
  if (student.registrationStatus === 'pending') {
    return <Navigate to="/student/pending" replace />
  }

  // Approved users can access dashboard & portal
  if (student.registrationStatus === 'approved') {
    return children
  }

  // Rejected users are allowed ONLY status & profile setup pages
  if (student.registrationStatus === 'rejected') {
    return <Navigate to="/student/rejected" replace />
  }

  return <Navigate to="/landing" replace />
}

// Student Public Route Component
const StudentPublicRoute = ({ children }) => {
  const { isAuthenticated, student } = useMemberAuthStore()
  
  if (!isAuthenticated || !student) {
    return children
  }

  // If blocked, redirect to blocked page
  if (student.isBlocked) {
    return <Navigate to="/student/blocked" replace />
  }

  // If authenticated, redirect based on status
  if (student.profileCompleted === false) {
    return <Navigate to="/student/profile-setup" replace />
  }

  if (student.registrationStatus === 'pending') {
    return <Navigate to="/student/pending" replace />
  }

  if (student.registrationStatus === 'rejected') {
    return <Navigate to="/student/rejected" replace />
  }

  if (student.registrationStatus === 'approved') {
    return <Navigate to="/student/dashboard" replace />
  }

  return children
}

// Profile Setup Route Component (only for authenticated users with incomplete profiles)
const ProfileSetupRoute = ({ children }) => {
  const { isAuthenticated, student } = useMemberAuthStore()
  
  if (!isAuthenticated || !student) {
    return <Navigate to="/landing" replace />
  }

  // Allow rejected users to resubmit (regardless of profileCompleted status)
  if (student.registrationStatus === 'rejected') {
    return children
  }

  // Allow pending users with incomplete profiles
  if (student.profileCompleted === false && student.registrationStatus === 'pending') {
    return children
  }

  // Redirect approved users to dashboard
  if (student.registrationStatus === 'approved') {
    return <Navigate to="/student/dashboard" replace />
  }

  // Redirect pending users with completed profiles to pending page
  if (student.registrationStatus === 'pending' && student.profileCompleted === true) {
    return <Navigate to="/student/pending" replace />
  }

  return <Navigate to="/landing" replace />
}

// Status Page Route Component (for pending/rejected pages)
const StudentStatusRoute = ({ children, allowedStatus }) => {
  const { isAuthenticated, student } = useMemberAuthStore()
  
  if (!isAuthenticated || !student) {
    return <Navigate to="/landing" replace />
  }
  
  // If student status changed, redirect appropriately
  if (allowedStatus === 'pending' && student.registrationStatus !== 'pending') {
    // If no longer pending, redirect based on new status
    if (student.registrationStatus === 'approved') {
      return <Navigate to="/student/dashboard" replace />
    }
    if (student.registrationStatus === 'rejected') {
      return <Navigate to="/student/rejected" replace />
    }
    if (student.profileCompleted === false) {
      return <Navigate to="/student/profile-setup" replace />
    }
  }
  
  if (allowedStatus === 'rejected' && student.registrationStatus !== 'rejected') {
    // If no longer rejected, redirect based on new status
    if (student.registrationStatus === 'approved') {
      return <Navigate to="/student/dashboard" replace />
    }
    if (student.registrationStatus === 'pending') {
      return <Navigate to="/student/pending" replace />
    }
    if (student.profileCompleted === false) {
      return <Navigate to="/student/profile-setup" replace />
    }
  }
  
  return children
}

// Blocked Page Route Component
const BlockedPageRoute = ({ children }) => {
  const { isAuthenticated, student } = useMemberAuthStore()
  
  if (!isAuthenticated || !student) {
    return <Navigate to="/landing" replace />
  }
  
  // Only allow access if student is actually blocked
  if (!student.isBlocked) {
    return <Navigate to="/student/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public Website (Integrated Landing & Dashboard) */}
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/catalog" element={<PublicCatalog />} />
        
        {/* Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Books */}
          <Route path="books" element={<Books />} />
          <Route path="books/add" element={<AddBook />} />
          <Route path="books/:id" element={<BookDetails />} />
          <Route path="books/:id/edit" element={<EditBook />} />
          
          {/* Members */}
          <Route path="members" element={<Members />} />
          <Route path="members/add" element={<AddMember />} />
          <Route path="members/pending" element={<PendingApprovals />} />
          <Route path="members/:id" element={<MemberDetails />} />
          <Route path="members/:id/edit" element={<EditMember />} />
          
          {/* Transactions */}
          <Route path="transactions/issue" element={<IssueBook />} />
          <Route path="transactions/return" element={<ReturnBook />} />
          <Route path="transactions/issued" element={<IssuedBooks />} />
          
          {/* Reservations */}
          <Route path="reservations" element={<Reservations />} />
          
          {/* Fines */}
          <Route path="fines" element={<Fines />} />
          
          {/* Reports */}
          <Route path="reports" element={<Reports />} />
          
          {/* Live Chat Support */}
          <Route path="live-chat" element={<LiveChatSupport />} />
          
          {/* Notifications */}
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="test-notifications" element={<TestNotifications />} />
          
          {/* Settings */}
          <Route path="settings" element={<Settings />} />
          
          {/* Admin Profile */}
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* Student Protected Routes - Status Pages */}
        <Route
          path="/student/profile-setup"
          element={
            <ProfileSetupRoute>
              <ProfileSetup />
            </ProfileSetupRoute>
          }
        />
        
        <Route
          path="/student/pending"
          element={
            <StudentStatusRoute allowedStatus="pending">
              <PendingApprovalPage />
            </StudentStatusRoute>
          }
        />
        
        <Route
          path="/student/rejected"
          element={
            <StudentStatusRoute allowedStatus="rejected">
              <RejectedStatusPage />
            </StudentStatusRoute>
          }
        />

        {/* Student Blocked Page */}
        <Route 
          path="/student/blocked" 
          element={
            <BlockedPageRoute>
              <BlockedPage />
            </BlockedPageRoute>
          } 
        />
        
        {/* Student Protected Routes - Main Portal */}
        <Route
          path="/student/*"
          element={
            <StudentProtectedRoute>
              <StudentLayout />
            </StudentProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="catalog" element={<StudentCatalog />} />
          <Route path="my-books" element={<StudentMyBooks />} />
          <Route path="reservations" element={<StudentReservations />} />
          <Route path="fines" element={<StudentFines />} />
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="chat-history" element={<ChatHistory />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
