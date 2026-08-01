import '@fortawesome/fontawesome-free/css/all.min.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './auth.css';

// Step 1 → enter email
// Step 2 → enter 6-digit OTP sent to email
// Step 3 → set new password → redirect to login

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step,        setStep]        = useState(1);
  const [email,       setEmail]       = useState('');
  const [code,        setCode]        = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [info,        setInfo]        = useState('');

  /* ── Step 1: send OTP ── */
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setLoading(true);
    try {
      await api.post('/forgot-password', { email });
      setInfo(`A 6-digit code has been sent to ${email}.`);
      setStep(2);
    } catch {
      setError('Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: verify OTP → step 3 ── */
  const handleVerifyCode = (e) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setStep(3);
  };

  /* ── Step 3: reset password ── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!newPassword.trim()) { setError('Please enter a new password.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/reset-password', { code, password: newPassword });
      navigate('/login', { state: { message: 'Password reset! Please sign in.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code. Start over.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 420 }}>

        {/* Back link */}
        <button
          type="button"
          onClick={() => (step > 1 ? setStep(step - 1) : navigate('/login'))}
          style={{
            background: 'none', border: 'none', color: '#818cf8',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            padding: 0, marginBottom: 20, display: 'flex',
            alignItems: 'center', gap: 6,
          }}
        >
          <i className="fas fa-arrow-left" />
          {step > 1 ? 'Back' : 'Back to Sign In'}
        </button>

        {/* Icon + Title */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(99,102,241,0.15)', marginBottom: 14,
          }}>
            <i className="fas fa-info-circle" style={{ color: '#818cf8', fontSize: '1.4rem' }} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
            Password Reset
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.4)', marginTop: 8, lineHeight: 1.5 }}>
            {step === 1 && "Forgot your password? Enter your email and we'll send a verification code."}
            {step === 2 && `Enter the 6-digit code sent to ${email}.`}
            {step === 3 && 'Enter your new password below.'}
          </p>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              width: s === step ? 22 : 8, height: 8, borderRadius: 50,
              background: s === step ? '#7c3aed' : s < step ? '#34d399' : 'rgba(255,255,255,0.12)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Info message */}
        {info && (
          <div style={{
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
            borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem',
            color: '#34d399', marginBottom: 14,
          }}>
            <i className="fas fa-check-circle" style={{ marginRight: 8 }} />
            {info}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem',
            color: '#f87171', marginBottom: 14,
          }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: 8 }} />
            {error}
          </div>
        )}

        {/* ── Step 1: Email ── */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendCode} noValidate>
            <div className="auth-input-group">
              <label htmlFor="fp-email">Email address</label>
              <div className="auth-input-wrap">
                <i className="fas fa-envelope field-icon" />
                <input
                  id="fp-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Continue'}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP code ── */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyCode} noValidate>
            <div className="auth-input-group">
              <label htmlFor="fp-code">Verification code</label>
              <div className="auth-input-wrap">
                <i className="fas fa-key field-icon" />
                <input
                  id="fp-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  style={{ letterSpacing: '0.25em', textAlign: 'center', paddingLeft: '38px' }}
                />
              </div>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              Verify Code
            </button>
            <p className="auth-legal" style={{ cursor: 'pointer' }}>
              Didn't receive it?{' '}
              <a href="#resend" onClick={(e) => { e.preventDefault(); setStep(1); setInfo(''); }}>
                Resend code
              </a>
            </p>
          </form>
        )}

        {/* ── Step 3: New password ── */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleResetPassword} noValidate>
            <div className="auth-input-group">
              <label htmlFor="fp-newpass">New password</label>
              <div className="auth-input-wrap">
                <i className="fas fa-lock field-icon" />
                <input
                  id="fp-newpass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  autoComplete="new-password"
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide' : 'Show'}
                  tabIndex={-1}
                >
                  <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Reset Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
