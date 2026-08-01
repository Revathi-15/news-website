import '@fortawesome/fontawesome-free/css/all.min.css';
import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './auth.css';

const isValidEmail = (v) =>
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z][a-zA-Z0-9-]*\.[a-zA-Z]{2,6}$/.test(
    v.trim()
  );

export default function LoginPage() {
  const navigate = useNavigate();

  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [showPass,       setShowPass]       = useState(false);
  const [emailTouched,   setEmailTouched]   = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [serverError,    setServerError]    = useState('');

  const emailError = !email.trim()
    ? 'Email is required'
    : !isValidEmail(email)
    ? 'Enter a valid email address'
    : null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setEmailTouched(true);
    setServerError('');

    if (emailError)    return;
    if (!password)     { setServerError('Password is required'); return; }

    setLoading(true);
    try {
      const res = await api.post('/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('firstName', res.data.firstName || '');
      localStorage.setItem('email', email);
      navigate('/home');
    } catch (err) {
      if (err.response?.status === 401) {
        const msg = err.response.data?.error || '';
        setServerError(
          msg.includes('Google')
            ? 'This account uses Google Sign-In. Please use the button below.'
            : 'Invalid email or password.'
        );
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/google-login', {
        credential: credentialResponse.credential,
      });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('firstName', res.data.firstName || '');
      localStorage.setItem('email', res.data.email || '');
      navigate('/home');
    } catch (err) {
      console.error('Google login error:', err.response?.data || err.message);
      setServerError('Google sign-in failed. Please try again.');
    }
  };

  const emailGroupClass = `auth-input-group${
    emailTouched && emailError  ? ' invalid'
    : emailTouched && !emailError ? ' valid'
    : ''
  }`;

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Header row */}
        <div className="auth-card-header">
          <h1>Welcome back</h1>
          <div className="auth-tabs">
            <button className="auth-tab active">Login</button>
            <button className="auth-tab" onClick={() => navigate('/register')}>
              Register
            </button>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleLogin} noValidate>

          {/* Email */}
          <div className={emailGroupClass}>
            <label htmlFor="login-email">Email</label>
            <div className="auth-input-wrap">
              <i className="fas fa-envelope field-icon" />
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={(e) => { setEmail(e.target.value); setEmailTouched(true); }}
                onBlur={() => setEmailTouched(true)}
              />
              {emailTouched && (
                <span className={`field-status ${emailError ? 'err' : 'ok'}`}>
                  <i className={`fas ${emailError ? 'fa-times-circle' : 'fa-check-circle'}`} />
                </span>
              )}
            </div>
            {emailTouched && emailError && (
              <span className="field-error">{emailError}</span>
            )}
          </div>

          {/* Password */}
          <div className="auth-input-group">
            <label htmlFor="login-password">Password</label>
            <div className="auth-input-wrap">
              <i className="fas fa-lock field-icon" />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <button
            type="button"
            className="forgot-link"
            onClick={() => navigate('/forgot-password')}
          >
            Forgot password?
          </button>

          {/* Server error */}
          {serverError && (
            <span className="field-error" style={{ paddingLeft: 0, textAlign: 'center' }}>
              {serverError}
            </span>
          )}

          {/* Submit */}
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Login →'}
          </button>

          {/* Legal */}
          <p className="auth-legal">
            By continuing, you agree to our{' '}
            <a href="#terms">Terms</a> &amp; <a href="#privacy">Privacy Policy</a>.
          </p>

          {/* Bottom nav */}
          <p className="auth-bottom-link">
            Don't have an account?
            <button type="button" onClick={() => navigate('/register')}>
              Sign Up
            </button>
          </p>

          {/* OR divider */}
          <div className="auth-divider">or you can sign in with</div>

          {/* Google */}
          <div className="google-btn-wrap">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setServerError('Google sign-in failed.')}
            />
          </div>

        </form>
      </div>
    </div>
  );
}
