import React, { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import './AuthLayout.css';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-container">
      <div className="auth-bg-shapes">
        <div className="auth-shape auth-shape-1"></div>
        <div className="auth-shape auth-shape-2"></div>
        <div className="auth-shape auth-shape-3"></div>
      </div>
      
      <div className="auth-glass-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <BookOpen size={24} color="#ffffff" strokeWidth={2.5} />
          </div>
          <span className="auth-logo-text">LearningForge</span>
        </div>
        
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
