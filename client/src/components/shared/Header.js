import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Header.css';

const Header = ({ user, logout }) => {
  const location = useLocation();
  const [firstChildId, setFirstChildId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Fetch children data for parent users
  useEffect(() => {
    const fetchChildren = async () => {
      if (user && user.role === 'parent') {
        try {
          const response = await axios.get(`/api/parents/${user.id}/children`);
          if (response.data && response.data.length > 0) {
            setFirstChildId(response.data[0].id);
          }
        } catch (error) {
          console.error('Error fetching children:', error);
        }
      }
    };
    
    fetchChildren();
  }, [user]);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Determine active link based on current path
  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // More specific handler for teacher navigation
  const isTeacherTabActive = (tab) => {
    if (tab === 'dashboard') {
      // Dashboard is active only if path is exactly /teacher or /teacher/
      return location.pathname === '/teacher' || location.pathname === '/teacher/' ? 'active' : '';
    } else if (tab === 'classroom') {
      // Classroom tab is active for any classroom-related path
      return location.pathname.includes('/teacher/classroom') ? 'active' : '';
    } else if (tab === 'profile') {
      return location.pathname.includes('/teacher/profile') ? 'active' : '';
    }
    return '';
  };
  
  // More specific handler for parent navigation
  const isParentTabActive = (tab) => {
    if (tab === 'dashboard') {
      // Dashboard is active only if path is exactly /parent or /parent/
      return location.pathname === '/parent' || location.pathname === '/parent/' ? 'active' : '';
    } else if (tab === 'child') {
      // Child tab is active for any child-related path
      return location.pathname.includes('/parent/child') ? 'active' : '';
    } else if (tab === 'profile') {
      return location.pathname.includes('/parent/profile') ? 'active' : '';
    }
    return '';
  };
  
  return (
    <header className="app-header">
      <div className="container">
        <div className="logo">
          <Link to="/">
            <div className="logo-main">
              <img src="/logo.png" alt="Math Tagumpay Logo" className="logo-icon" />
              <span className="logo-subtitle">Intelligent Tutoring System for Philippine Grade Level</span>
            </div>
          </Link>
        </div>
        
        {user && (
          <>
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
            <nav className={`main-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {user.role === 'student' && ( // Use user.role
            <>
              <Link to="/student" className={location.pathname === '/student' || location.pathname === '/student/' ? 'active' : ''}>Dashboard</Link>
              <Link to="/student/progress" className={isActive('/student/progress')}>My Progress</Link>
              <Link to="/student/profile" className={isActive('/student/profile')}>My Profile</Link> {/* Added Profile Link */}
            </>
          )}

          {user.role === 'admin' && ( // Added Admin links
            <>
              <Link to="/admin" className={isActive('/admin')}>User Management</Link>
              {/* Add other admin links here if needed */}
            </> // Added missing closing fragment tag
          )}
          
          {user.role === 'teacher' && ( // Use user.role
            <>
              <Link to="/teacher" className={isTeacherTabActive('dashboard')}>Dashboard</Link>
              <Link to={user.classrooms && user.classrooms.length > 0 
                ? `/teacher/classroom/${user.classrooms[0].id}` 
                : "/teacher"} 
                className={isTeacherTabActive('classroom')}>
                My Classroom
              </Link>
              <Link to="/teacher/profile" className={isTeacherTabActive('profile')}>My Profile</Link> {/* Added Profile Link */}
            </>
          )}
          
          {user.role === 'parent' && ( // Use user.role
            <>
              <Link to="/parent" className={isParentTabActive('dashboard')}>Dashboard</Link>
              <Link to={firstChildId ? `/parent/child/${firstChildId}` : "/parent"} className={isParentTabActive('child')}>
                My Child
              </Link>
              <Link to="/parent/profile" className={isParentTabActive('profile')}>My Profile</Link> {/* Added Profile Link */}
            </>
          )}
          
            <button onClick={logout} className="logout-button">Logout</button>
          </nav>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
