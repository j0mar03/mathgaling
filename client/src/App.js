import React from 'react'; // Removed useState, useEffect as they are handled in context
import { Routes, Route, Navigate, BrowserRouter as Router } from 'react-router-dom'; // Router moved to index.js, but keep imports needed here
import { useAuth } from './context/AuthContext'; // Import real useAuth hook
import './App.css';

// Student Interface Components
import StudentDashboard from './components/student/StudentDashboard';
import LessonView from './components/student/LessonView';
import QuizView from './components/student/QuizView';
import StudentProgress from './components/student/StudentProgress';
import StudentProfile from './components/student/StudentProfile'; // Import StudentProfile
import BookQuizDashboard from './components/student/BookQuizDashboard';
import PracticeQuizView from './components/student/PracticeQuizView';
import MasteryLevelDashboard from './components/student/MasteryLevelDashboard';
import StudentInbox from './components/student/StudentInbox'; // Import StudentInbox

// Shared Components
import Header from './components/shared/Header';
import Footer from './components/shared/Footer';
import Login from './components/shared/Login';
import LoginImproved from './components/shared/LoginImproved';
import Signup from './components/shared/Signup'; // Import Signup component
import SignupImproved from './components/shared/SignupImproved';
import NotFound from './components/shared/NotFound';

// Teacher Interface Components
import TeacherDashboard from './components/teacher/TeacherDashboard';
import ClassroomView from './components/teacher/ClassroomViewEnhanced';
import StudentDetailView from './components/teacher/StudentDetailView';
import KnowledgeComponentView from './components/teacher/KnowledgeComponentView';
import TeacherProfile from './components/teacher/TeacherProfile'; // Import TeacherProfile

// Parent Interface Components
import ParentDashboard from './components/parent/ParentDashboard';
import ChildProgressView from './components/parent/ChildProgressView';
import WeeklyReportView from './components/parent/WeeklyReportView';
import ParentProfile from './components/parent/ParentProfile'; // Import ParentProfile

// Admin Interface Components
import AdminDashboard from './components/admin/AdminDashboard'; // Import AdminDashboard

// PDF Review Components
import PDFReviewList from './components/review/PDFReviewList'; // Import the new review list component
import PDFReviewDetail from './components/review/PDFReviewDetail'; // Import the detail component

// Removed mock useAuth hook - using the one from context now

// Protected route component
// Updated ProtectedRoute to use context and handle loading state
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]; // Ensure roles is an array

  if (loading) {
    // Optional: Show a loading spinner while checking auth state
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !roles.includes(user.role)) {
    // Redirect to their own dashboard if role doesn't match
    // Or show an 'Access Denied' page
    console.warn(`[ProtectedRoute] Access denied: User role '${user.role}' not in allowed roles '${roles.join(', ')}'`);
    console.warn(`[ProtectedRoute] Current URL: ${window.location.pathname}`);
    console.warn(`[ProtectedRoute] Redirecting to: /${user.role}`);
    return <Navigate to={`/${user.role}`} replace />; // Redirect to their default dashboard
  }

  // Render children if authenticated and role matches (or no specific role required)
  return children;
};

function App() {
  const { user, login, logout, loading } = useAuth(); // Get loading state from context
  
  // For prototype, we'll use a simple interface selector if not logged in
  // Removed InterfaceSelector - login/signup handles role selection now
  
  // Show loading indicator while context is initializing
  if (loading) {
    return <div className="app-loading">Loading Application...</div>;
  }

  return (
    // Router is now in index.js
      <div className="app">
        <Header user={user} logout={logout} />
        
        <main className="main-content">
          <Routes>
            {/* Public routes */}
            {/* Pass the actual login function from context */}
            <Route path="/login" element={user ? <Navigate to={`/${user.role}`} /> : <LoginImproved />} />
            {/* Signup component might handle login via context after success */}
            <Route path="/signup" element={user ? <Navigate to={`/${user.role}`} /> : <SignupImproved />} />
            
            {/* Home route - redirect to login or dashboard */}
            <Route path="/" element={
              user
                ? <Navigate to={`/${user.role}`} /> // Redirect to role-specific dashboard
                : <Navigate to="/login" /> // Redirect to login if not authenticated
            } />
            
            {/* Student routes */}
            {/* Updated ProtectedRoute usage */}
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/mastery-dashboard" element={
              <ProtectedRoute allowedRoles={['student']}>
                <MasteryLevelDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/lesson/:id" element={
              <ProtectedRoute allowedRoles={['student']}>
                <LessonView />
              </ProtectedRoute>
            } />
            {/* Make :id optional by adding '?' */}
            <Route path="/student/quiz/:id?" element={
              <ProtectedRoute allowedRoles={['student']}>
                <QuizView />
              </ProtectedRoute>
            } />
            <Route path="/student/progress" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProgress />
              </ProtectedRoute>
            } />
            <Route path="/student/profile" element={ // Added profile route
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProfile />
              </ProtectedRoute>
            } />
            <Route path="/student/book-quiz-dashboard" element={<BookQuizDashboard />} />
            <Route path="/student/practice-quiz" element={<PracticeQuizView />} />
            <Route path="/student/messages" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentInbox />
              </ProtectedRoute>
            } />
            
            <Route path="/teacher" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher/classroom/:id" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <ClassroomView />
              </ProtectedRoute>
            } />
            <Route path="/teacher/profile" element={ // Added profile route
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherProfile />
              </ProtectedRoute>
            } />
            <Route path="/teacher/student/:id" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <StudentDetailView />
              </ProtectedRoute>
            } />
            <Route path="/teacher/knowledge-components/:id" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <KnowledgeComponentView />
              </ProtectedRoute>
            } />
            <Route path="/parent/profile" element={ // Added profile route
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentProfile />
              </ProtectedRoute>
            } />
            
            <Route path="/parent" element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboard />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/parent/child/:id" element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ChildProgressView />
              </ProtectedRoute>
            } />
            <Route path="/parent/child/:id/report" element={
              <ProtectedRoute allowedRoles={['parent']}>
                <WeeklyReportView />
              </ProtectedRoute>
            } />

            {/* PDF Review Routes (Accessible by Teacher and Admin) */}
            <Route path="/reviews" element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <PDFReviewList />
              </ProtectedRoute>
            } />
            <Route path="/review/:pdfId" element={ // Route for the detail view
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <PDFReviewDetail />
              </ProtectedRoute>
            } />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    // Router is now in index.js
  ); // Added missing closing parenthesis
}

export default App;
