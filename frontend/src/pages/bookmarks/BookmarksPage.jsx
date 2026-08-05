// Bookmarks Page — saved news articles per user (backend-persisted)
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../../context/DarkModeContext';
import api from '../../api';
import './bookmarks.css';

export default function BookmarksPage() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookmarks');
      setBookmarks(res.data);
    } catch {
      setError('Failed to load bookmarks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (id) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch {
      alert('Could not remove bookmark. Try again.');
    }
  };

  return (
    <div className={`bm-page${darkMode ? ' dark' : ''}`}>
      <div className="bm-orb bm-orb1" aria-hidden="true" />
      <div className="bm-orb bm-orb2" aria-hidden="true" />

      <div className="bm-inner">
        <div className="bm-header">
          <button className="bm-back-btn" onClick={() => navigate('/home')} aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>
          <div className="bm-title-wrap">
            <i className="fas fa-bookmark" />
            <h1>Saved Articles</h1>
          </div>
          <span className="bm-count">{bookmarks.length} saved</span>
        </div>

        {loading && (
          <div className="bm-loader">
            <div className="bm-dots"><span/><span/><span/></div>
            <p>Loading your saved articles…</p>
          </div>
        )}

        {error && <p className="bm-error">{error}</p>}

        {!loading && !error && bookmarks.length === 0 && (
          <div className="bm-empty">
            <i className="fas fa-bookmark" />
            <p>No saved articles yet</p>
            <small>Click the bookmark icon on any news card to save it here.</small>
            <button className="bm-browse-btn" onClick={() => navigate('/home')}>Browse News</button>
          </div>
        )}

        <div className="bm-grid">
          {bookmarks.map(bm => (
            <div key={bm.id} className="bm-card">
              {bm.image && (
                <div className="bm-card-img-wrap">
                  <img
                    src={bm.image}
                    alt={bm.title}
                    loading="lazy"
                    onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x200/1e293b/64748b?text=No+Image'; }}
                  />
                </div>
              )}
              <div className="bm-card-body">
                {bm.source && <span className="bm-source">{bm.source}</span>}
                <p className="bm-article-title">{bm.title || 'Untitled Article'}</p>
                <span className="bm-date">{bm.savedAt ? new Date(bm.savedAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : ''}</span>
              </div>
              <div className="bm-card-actions">
                <button className="bm-open-btn" onClick={() => window.open(bm.url, '_blank')} aria-label="Open article">
                  <i className="fas fa-external-link-alt" /> Read
                </button>
                <button className="bm-remove-btn" onClick={() => handleRemove(bm.id)} aria-label="Remove bookmark">
                  <i className="fas fa-trash-alt" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
