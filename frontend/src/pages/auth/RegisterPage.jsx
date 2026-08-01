import '@fortawesome/fontawesome-free/css/all.min.css';
import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './auth.css';

const isValidEmail = (v) =>
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z][a-zA-Z0-9\-]*\.[a-zA-Z]{2,6}$/.test(
    v.trim()
  );

export default function RegisterPage() {
  const navigate = useNavigate();

  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [touched,      setTouched]      = useState({});
  const [loading,      setLoading]      = useState(false);
  const [serverError,  setServerError]  = useState('');

  const emailError = !email.trim()
    ? 'Email is required'
    : !isValidEmail(email)
    ? 'Enter a valid email address'
    : null;

  const touch = (field) => setTouched((p) => ({ ...p, [field]: true }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, password: true });
    setServerError('');

    if (!firstName.trim() || !lastName.trim() || emailError || !password.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/signup', { firstName, lastName, email, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('firstName', res.data.firstName || firstName);
      localStorage.setItem('email', email);
      navigate('/home');
    } catch (err) {
      if (err.response?.status === 409) {
        setServerError('An account with this email already exists.');
      } else {
        setServerError('Signup failed. Please try again.');
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

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Header row */}
        <div className="auth-card-header">
          <h1>Create account</h1>
          <div className="auth-tabs">
            <button className="auth-tab" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="auth-tab active">Register</button>
          </div>
        </div>

        <p className="auth-subtitle">
          Fill in your details below to get started.
        </p>

        <form className="auth-form" onSubmit={handleRegister} noValidate>

          {/* Name row */}
          <div className="auth-name-row">
            <div className={`auth-input-group${touched.firstName && !firstName.trim() ? ' invalid' : ''}`}>
              <label htmlFor="reg-firstname">First Name</label>
              <div className="auth-input-wrap">
                <i className="fas fa-user field-icon" />
                <input
                  id="reg-firstname"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  maxLength={20}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => touch('firstName')}
                />
              </div>
              {touched.firstName && !firstName.trim() && (
                <span className="field-error">First name is required</span>
              )}
            </div>

            <div className={`auth-input-group${touched.lastName && !lastName.trim() ? ' invalid' : ''}`}>
              <label htmlFor="reg-lastname">Last Name</label>
              <div className="auth-input-wrap">
                <i className="fas fa-user field-icon" />
                <input
                  id="reg-lastname"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  maxLength={20}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => touch('lastName')}
                />
              </div>
              {touched.lastName && !lastName.trim() && (
                <span className="field-error">Last name is required</span>
              )}
            </div>
          </div>

          {/* Email */}
          <div className={`auth-input-group${
            touched.email && emailError  ? ' invalid'
            : touched.email && !emailError ? ' valid'
            : ''
          }`}>
            <label htmlFor="reg-email">Email</label>
            <div className="auth-input-wrap">
              <i className="fas fa-envelope field-icon" />
              <input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={(e) => { setEmail(e.target.value); touch('email'); }}
                onBlur={() => touch('email')}
              />
              {touched.email && (
                <span className={`field-status ${emailError ? 'err' : 'ok'}`}>
                  <i className={`fas ${emailError ? 'fa-times-circle' : 'fa-check-circle'}`} />
                </span>
              )}
            </div>
            {touched.email && emailError && (
              <span className="field-error">{emailError}</span>
            )}
          </div>

          {/* Password */}
          <div className={`auth-input-group${touched.password && !password.trim() ? ' invalid' : ''}`}>
            <label htmlFor="reg-password">Password</label>
            <div className="auth-input-wrap">
              <i className="fas fa-lock field-icon" />
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                placeholder="Create a password"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => touch('password')}
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
            {touched.password && !password.trim() && (
              <span className="field-error">Password is required</span>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <span className="field-error" style={{ paddingLeft: 0, textAlign: 'center' }}>
              {serverError}
            </span>
          )}

          {/* Submit */}
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Create account'}
          </button>

          {/* Legal */}
          <p className="auth-legal">
            By continuing, you agree to our{' '}
            <a href="#terms">Terms</a> &amp; <a href="#privacy">Privacy Policy</a>.
          </p>

          {/* Bottom nav */}
          <p className="auth-bottom-link">
            Have an account?
            <button type="button" onClick={() => navigate('/login')}>
              Sign In
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
