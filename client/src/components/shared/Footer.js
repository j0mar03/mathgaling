import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>&copy; {currentYear} Mathgaling - Intelligent Tutoring System for Philippine Grade Level</p>
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Use</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
