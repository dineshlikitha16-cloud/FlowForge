import React, { useState } from 'react';
import { User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from './AuthLayout';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('All fields are required');
      return;
    }
    
    setError('');
    setIsLoading(true);
    // Connect to backend API
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <AuthLayout>
      <h2 className="auth-title">Create an Account</h2>
      <p className="auth-subtitle">
        Join the best learning platform today
      </p>

      {error && <div className="auth-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      <form className="auth-form" onSubmit={handleRegister}>
        <div className="auth-form-group">
          <label className="auth-label">Full Name</label>
          <div className="auth-input-wrapper">
            <User className="auth-input-icon" size={18} />
            <input
              type="text"
              name="name"
              className="auth-input"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="auth-form-group">
          <label className="auth-label">Email Address</label>
          <div className="auth-input-wrapper">
            <Mail className="auth-input-icon" size={18} />
            <input
              type="email"
              name="email"
              className="auth-input"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="auth-form-group">
          <label className="auth-label">Phone Number</label>
          <div className="auth-input-wrapper">
            <Phone className="auth-input-icon" size={18} />
            <input
              type="text"
              name="phone"
              className="auth-input"
              placeholder="+1 555-000-0000"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="auth-form-group">
          <label className="auth-label">Password</label>
          <div className="auth-input-wrapper">
            <Lock className="auth-input-icon" size={18} />
            <input
              type="password"
              name="password"
              className="auth-input"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
          style={{ marginTop: '0.75rem' }}
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
          {!isLoading && <ArrowRight size={18} />}
        </button>
      </form>

      <div className="auth-footer">
        Already have an account? <button className="auth-link">Log in</button>
      </div>
    </AuthLayout>
  );
};

export default Register;
