import React, { useState, useRef, KeyboardEvent } from 'react';
import { ArrowRight, RefreshCw, KeyRound } from 'lucide-react';
import AuthLayout from './AuthLayout';
import './OtpVerification.css';

const OtpVerification: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      setError('Please enter all 6 digits');
      return;
    }
    
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log('Verifying OTP:', otpValue);
    }, 1000);
  };

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div className="auth-logo-icon" style={{ margin: '0 auto 1.5rem', width: '56px', height: '56px', borderRadius: '50%' }}>
          <KeyRound size={28} color="#fff" />
        </div>
        <h2 className="auth-title">Verify Your Email</h2>
        <p className="auth-subtitle" style={{ marginBottom: '1rem' }}>
          We've sent a 6-digit code to your email address. Enter it below to confirm your account.
        </p>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      <form className="auth-form" onSubmit={handleVerify}>
        <div className="otp-container">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              maxLength={1}
              value={digit}
              className="otp-input"
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
            />
          ))}
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading || otp.some(d => !d)}
          style={{ marginTop: '1rem' }}
        >
          {isLoading ? 'Verifying...' : 'Verify Content'}
          {!isLoading && <ArrowRight size={18} />}
        </button>
      </form>

      <div className="auth-footer" style={{ marginTop: '2rem' }}>
        Didn't receive the code? {' '}
        <button className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <RefreshCw size={14} /> Resend OTP
        </button>
      </div>
    </AuthLayout>
  );
};

export default OtpVerification;
