import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import AuthLayout from './AuthLayout';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1000);
  };

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 className="auth-title">Forgot Password?</h2>
        <p className="auth-subtitle">
          {isSubmitted 
            ? "Check your email for reset instructions."
            : "No worries! Enter your email and we'll send you reset instructions."
          }
        </p>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {!isSubmitted ? (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail className="auth-input-icon" size={18} />
              <input
                type="email"
                className="auth-input"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
            style={{ marginTop: '1rem' }}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            type="button" 
            className="auth-button"
            onClick={() => window.location.href = '/auth/login'}
          >
            Back to Login
          </button>
        </div>
      )}

      {!isSubmitted && (
        <div className="auth-footer" style={{ marginTop: '2rem' }}>
          <button className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={14} /> Back to Log in
          </button>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
