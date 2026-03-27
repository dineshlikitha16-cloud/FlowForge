import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Smartphone } from 'lucide-react';
import AuthLayout from './AuthLayout';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email or phone number');
      return;
    }
    if (loginMethod === 'password' && !password) {
      setError('Please enter your password');
      return;
    }
    
    setError('');
    setIsLoading(true);
    // Connection to backend API goes here
    setTimeout(() => {
      setIsLoading(false);
      console.log('Login attempt:', { email, password, method: loginMethod });
    }, 1000);
  };

  return (
    <AuthLayout>
      <h2 className="auth-title">Welcome back</h2>
      <p className="auth-subtitle">
        Sign in to access your learning dashboard
      </p>

      {error && <div className="auth-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      <form className="auth-form" onSubmit={handleLogin}>
        <div className="auth-form-group">
          <label className="auth-label">Email or Phone</label>
          <div className="auth-input-wrapper">
            <Mail className="auth-input-icon" size={18} />
            <input
              type="text"
              className="auth-input"
              placeholder="Enter your email or phone"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {loginMethod === 'password' && (
          <div className="auth-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="auth-label">Password</label>
              <button type="button" className="auth-link">Forgot password?</button>
            </div>
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" size={18} />
              <input
                type="password"
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
          {!isLoading && <ArrowRight size={18} />}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button 
          type="button" 
          className="auth-button" 
          style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'none' }}
          onClick={() => {
            setLoginMethod(prev => prev === 'password' ? 'otp' : 'password');
            setError('');
          }}
        >
          {loginMethod === 'password' ? (
            <><Smartphone size={18} /> Login with OTP instead</>
          ) : (
            <><Lock size={18} /> Login with Password instead</>
          )}
        </button>
      </div>

      <div className="auth-footer">
        Don't have an account? <button className="auth-link">Sign up</button>
      </div>
    </AuthLayout>
  );
};

export default Login;
