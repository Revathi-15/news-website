import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './profile.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user,       setUser]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [editing,    setEditing]    = useState(false);
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');

  useEffect(() => {
    api.get('/profile')
      .then(res => {
        setUser(res.data);
        setFirstName(res.data.firstName || '');
        setLastName(res.data.lastName || '');
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!firstName.trim()) { setError('First name is required'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await api.put('/profile', { firstName, lastName });
      setUser(prev => ({ ...prev, firstName: res.data.firstName, lastName: res.data.lastName }));
      localStorage.setItem('firstName', res.data.firstName);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch {
      setError('Failed to update. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initial = (user?.firstName || '?')[0].toUpperCase();

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loader">
          <div className="pf-spinner" /><p>Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Background orbs */}
      <div className="pf-orb pf-orb1" aria-hidden="true" />
      <div className="pf-orb pf-orb2" aria-hidden="true" />

      <div className="pf-card">
        {/* Back button */}
        <button className="pf-back-btn" onClick={() => navigate('/home')} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
          </svg>
          Back to Home
        </button>

        {/* Avatar */}
        <div className="pf-avatar-wrap">
          <div className="pf-avatar">{initial}</div>
          <div className="pf-avatar-ring" aria-hidden="true" />
        </div>

        {/* Name & email */}
        <h1 className="pf-name">{user.firstName} {user.lastName}</h1>
        <p className="pf-email">{user.email}</p>

        {/* Account type badge */}
        <div className={`pf-badge ${user.googleUser ? 'pf-badge-google' : 'pf-badge-email'}`}>
          {user.googleUser
            ? <><i className="fab fa-google" /> Google Account</>
            : <><i className="fas fa-envelope" /> Email Account</>
          }
        </div>

        {/* Info grid */}
        <div className="pf-info-grid">
          <div className="pf-info-item">
            <span className="pf-info-label">First Name</span>
            <span className="pf-info-value">{user.firstName || '—'}</span>
          </div>
          <div className="pf-info-item">
            <span className="pf-info-label">Last Name</span>
            <span className="pf-info-value">{user.lastName || '—'}</span>
          </div>
          <div className="pf-info-item pf-info-full">
            <span className="pf-info-label">Email</span>
            <span className="pf-info-value">{user.email}</span>
          </div>
          <div className="pf-info-item pf-info-full">
            <span className="pf-info-label">Account Type</span>
            <span className="pf-info-value">{user.googleUser ? 'Google OAuth' : 'Email & Password'}</span>
          </div>
        </div>

        {/* Edit form */}
        {!user.googleUser && (
          <>
            {!editing ? (
              <button className="pf-edit-btn" onClick={() => { setEditing(true); setSuccess(''); setError(''); }}>
                <i className="fas fa-pen" /> Edit Display Name
              </button>
            ) : (
              <form className="pf-edit-form" onSubmit={handleSave} noValidate>
                <h3 className="pf-edit-title">Update Display Name</h3>
                <div className="pf-edit-row">
                  <div className="pf-field">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      maxLength={50}
                      placeholder="First name"
                      autoFocus
                    />
                  </div>
                  <div className="pf-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      maxLength={50}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                {error   && <p className="pf-error">{error}</p>}
                {success && <p className="pf-success">{success}</p>}
                <div className="pf-edit-actions">
                  <button type="submit" className="pf-save-btn" disabled={saving}>
                    {saving ? <span className="pf-btn-spinner" /> : 'Save Changes'}
                  </button>
                  <button type="button" className="pf-cancel-btn" onClick={() => { setEditing(false); setError(''); }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {success && !editing && <p className="pf-success pf-success-outer">{success}</p>}
          </>
        )}

        {user.googleUser && (
          <p className="pf-google-note">
            <i className="fas fa-info-circle" /> Display name is managed by your Google account.
          </p>
        )}
      </div>
    </div>
  );
}
