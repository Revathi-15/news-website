// Homepage — News feed with: Category Tabs, Infinite Scroll,
// Search History, Bookmark button, and AI Summarizer (Gemini)

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDarkMode } from "../../context/DarkModeContext";
import api from "../../api";
import logo from "../../assets/logo16-1.png";
import srch from "../../assets/srch.png";
import "./HomePage.css";

const NEWS_API_KEY = "71146ebefc69425aa26e16e6e9e066d1";
const NEWS_URL     = "https://newsapi.org/v2/everything?";
const PAGE_SIZE    = 20;   // max per page on free tier
const MAX_HISTORY  = 5;

// ── Category tabs config ────────────────────────────────────────────
const CATEGORIES = [
  { id: "India",         label: "Top",          icon: "fas fa-fire" },
  { id: "technology",    label: "Technology",   icon: "fas fa-microchip" },
  { id: "sports",        label: "Sports",       icon: "fas fa-futbol" },
  { id: "business",      label: "Business",     icon: "fas fa-briefcase" },
  { id: "health",        label: "Health",       icon: "fas fa-heartbeat" },
  { id: "entertainment", label: "Entertainment",icon: "fas fa-film" },
];

// ── Live clock ──────────────────────────────────────────────────────
const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  return (
    <div className="live-clock">
      <span className="clock-time">{timeStr}</span>
      <span className="clock-date">{dateStr}</span>
    </div>
  );
};

// ── Profile dropdown ────────────────────────────────────────────────
const ProfileMenu = ({ firstName, email, onLogout }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initial = (firstName || "?")[0].toUpperCase();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="profile-menu" ref={ref}>
      <button className="avatar-btn" onClick={() => setOpen(v => !v)} aria-label="Profile menu" aria-expanded={open}>
        {initial}
      </button>
      {open && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-info">
            <div className="profile-dropdown-avatar">{initial}</div>
            <div className="profile-dropdown-text">
              <span className="profile-dropdown-name">{firstName}</span>
              <span className="profile-dropdown-email">{email}</span>
            </div>
          </div>
          <div className="profile-dropdown-divider" />
          <button className="profile-dropdown-item" onClick={() => { setOpen(false); navigate("/profile"); }}>
            <i className="fas fa-user" /> View Profile
          </button>
          <button className="profile-dropdown-item" onClick={() => { setOpen(false); navigate("/bookmarks"); }}>
            <i className="fas fa-bookmark" /> Saved Articles
          </button>
          <div className="profile-dropdown-divider" />
          <button className="profile-dropdown-logout" onClick={onLogout}>
            <i className="fas fa-sign-out-alt" /> Log out
          </button>
        </div>
      )}
    </div>
  );
};

// ── Summary modal ───────────────────────────────────────────────────
const SummaryModal = ({ summary, title, onClose }) => (
  <div className="summary-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Article summary">
    <div className="summary-modal" onClick={e => e.stopPropagation()}>
      <div className="summary-header">
        <div className="summary-badge"><i className="fas fa-robot" /> AI Summary</div>
        <button className="summary-close" onClick={onClose} aria-label="Close"><i className="fas fa-times" /></button>
      </div>
      <h3 className="summary-title">{title}</h3>
      <p className="summary-body">{summary}</p>
    </div>
  </div>
);

// ── News card ───────────────────────────────────────────────────────
const NewsCard = ({ article, onBookmark, bookmarkedUrls, onSummarize, summarizing }) => {
  const isBookmarked = bookmarkedUrls.has(article.url);
  const pubDate = new Date(article.publishedAt);
  const now     = new Date();
  const diffHrs  = Math.floor((now - pubDate) / 3600000);
  const diffDays = Math.floor((now - pubDate) / 86400000);
  const timeAgo =
    diffHrs  < 1  ? "Just now"
    : diffHrs < 24 ? `${diffHrs}h ago`
    : diffDays < 7 ? `${diffDays}d ago`
    : pubDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const textBlob  = [article.title || "", article.description || "", article.content || ""].join(" ");
  const wc        = textBlob.split(/\s+/).filter(Boolean).length;
  const estimated = article.content ? wc * 4 : wc * 12;
  const readMins  = Math.max(1, Math.round(estimated / 200));

  return (
    <div className="card">
      <div className="card-header" onClick={() => window.open(article.url, "_blank")} style={{ cursor: "pointer" }}>
        <img
          src={article.urlToImage}
          alt={article.title || "News"}
          loading="lazy"
          onError={e => { e.target.onerror = null; e.target.src = "https://placehold.co/400x230/e0e0e0/505050?text=No+Image"; }}
        />
        <div className="card-read-time">{readMins} min read</div>
      </div>
      <div className="card-content">
        <h5 className="news-title" onClick={() => window.open(article.url, "_blank")} style={{ cursor: "pointer" }}>
          {article.title}
        </h5>
        <div className="card-meta-row">
          <span className="news-source-badge">{article.source.name}</span>
          <span className="news-time">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            {timeAgo}
          </span>
        </div>
        <p className="news-des">{article.description}</p>
        <div className="card-actions-row">
          <button
            className={`card-action-btn summarize-btn${summarizing ? " loading" : ""}`}
            onClick={() => onSummarize(article)}
            disabled={summarizing}
            title="AI Summarize"
          >
            {summarizing ? <span className="mini-spinner" /> : <i className="fas fa-robot" />}
            {summarizing ? "Summarizing…" : "Summarize"}
          </button>
          <button
            className={`card-action-btn bookmark-btn${isBookmarked ? " bookmarked" : ""}`}
            onClick={() => onBookmark(article)}
            title={isBookmarked ? "Remove bookmark" : "Save article"}
            aria-label={isBookmarked ? "Remove bookmark" : "Save article"}
          >
            <i className={isBookmarked ? "fas fa-bookmark" : "far fa-bookmark"} />
            {isBookmarked ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main HomePage ───────────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();

  const firstName = (localStorage.getItem("firstName") || "").slice(0, 20);
  const email     = localStorage.getItem("email") || "";

  // ── Voice search state ──
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const voiceRecognitionRef = useRef(null);

  // State
  const [articles,       setArticles]       = useState([]);
  const [currentQuery,   setCurrentQuery]   = useState("India");
  const [activeCategory, setActiveCategory] = useState("India");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchHistory,  setSearchHistory]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("newsSearchHistory") || "[]"); } catch { return []; }
  });
  const [message,        setMessage]        = useState("");
  const [loading,        setLoading]        = useState(false);
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [bookmarkedUrls, setBookmarkedUrls] = useState(new Set());
  const [summaryData,    setSummaryData]    = useState(null);   // {title, text}
  const [summarizingUrl, setSummarizingUrl] = useState(null);

  const searchInputRef  = useRef(null);
  const sentinelRef     = useRef(null);  // IntersectionObserver target

  // ── Load bookmarked URLs on mount ──
  useEffect(() => {
    api.get("/bookmarks")
      .then(res => setBookmarkedUrls(new Set(res.data.map(b => b.url))))
      .catch(() => {});
  }, []);

  // ── Fetch news (page 1, reset) ──
  const fetchNews = useCallback(async (query, lang = "en") => {
    setMessage(""); setLoading(true); setArticles([]); setPage(1); setHasMore(true);
    try {
      const url = `${NEWS_URL}q=${encodeURIComponent(query)}&apiKey=${NEWS_API_KEY}&language=${lang}&pageSize=${PAGE_SIZE}&page=1&sortBy=publishedAt`;
      const res = await fetch(url);
      if (!res.ok) { setMessage(`Error: ${res.statusText || "Unknown error"}`); setLoading(false); return; }
      const data = await res.json();
      // Sort newest first, filter out articles without images
      const withImg = (data.articles || [])
        .filter(a => a.urlToImage)
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      setArticles(withImg);
      setHasMore((data.articles || []).length === PAGE_SIZE);
      if (withImg.length === 0) setMessage("No articles found. Try a different search term.");
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch more (append) ──
  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const url = `${NEWS_URL}q=${encodeURIComponent(currentQuery)}&apiKey=${NEWS_API_KEY}&language=en&pageSize=${PAGE_SIZE}&page=${nextPage}&sortBy=publishedAt`;
      const res = await fetch(url);
      if (!res.ok) { setHasMore(false); return; }
      const data = await res.json();
      const withImg = (data.articles || []).filter(a => a.urlToImage);
      setArticles(prev => {
        const existing = new Set(prev.map(a => a.url));
        const fresh = withImg.filter(a => !existing.has(a.url));
        return [...prev, ...fresh];
      });
      setPage(nextPage);
      if (withImg.length < PAGE_SIZE) setHasMore(false);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [currentQuery, page, hasMore, loadingMore]);

  // ── IntersectionObserver for infinite scroll ──
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading) fetchMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchMore, hasMore, loading]);

  // ── Initial load ──
  useEffect(() => { fetchNews("India"); }, [fetchNews]);

  // ── Voice search setup ──
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsVoiceListening(false);
      // auto-search with the spoken term
      setSearchHistory(prev => {
        const updated = [transcript, ...prev.filter(h => h.toLowerCase() !== transcript.toLowerCase())].slice(0, MAX_HISTORY);
        localStorage.setItem("newsSearchHistory", JSON.stringify(updated));
        return updated;
      });
      setCurrentQuery(transcript);
      setActiveCategory(null);
      fetchNews(transcript);
    };
    rec.onerror = () => setIsVoiceListening(false);
    rec.onend   = () => setIsVoiceListening(false);
    voiceRecognitionRef.current = rec;
  }, [fetchNews]);

  const toggleVoiceSearch = useCallback(() => {
    if (!voiceRecognitionRef.current) return;
    if (isVoiceListening) {
      voiceRecognitionRef.current.stop();
      setIsVoiceListening(false);
    } else {
      voiceRecognitionRef.current.start();
      setIsVoiceListening(true);
      setSearchQuery("");
    }
  }, [isVoiceListening]);

  // ── Category click ──
  const onCategoryClick = useCallback((catId) => {
    setActiveCategory(catId);
    setCurrentQuery(catId);
    setSearchQuery("");
    fetchNews(catId);
  }, [fetchNews]);

  // ── Search ──
  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) { setMessage("Please enter a search term."); searchInputRef.current?.focus(); return; }
    // Save to history
    setSearchHistory(prev => {
      const updated = [q, ...prev.filter(h => h.toLowerCase() !== q.toLowerCase())].slice(0, MAX_HISTORY);
      localStorage.setItem("newsSearchHistory", JSON.stringify(updated));
      return updated;
    });
    setCurrentQuery(q);
    setActiveCategory(null);
    fetchNews(q);
  }, [fetchNews, searchQuery]);

  const handleKeyDown = useCallback(e => { if (e.key === "Enter") handleSearch(); }, [handleSearch]);

  const removeHistory = useCallback((term) => {
    setSearchHistory(prev => {
      const updated = prev.filter(h => h !== term);
      localStorage.setItem("newsSearchHistory", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Bookmark toggle ──
  const handleBookmark = useCallback(async (article) => {
    const url = article.url;
    if (bookmarkedUrls.has(url)) {
      // Find id and remove
      try {
        const res = await api.get("/bookmarks");
        const bm = res.data.find(b => b.url === url);
        if (bm) await api.delete(`/bookmarks/${bm.id}`);
        setBookmarkedUrls(prev => { const s = new Set(prev); s.delete(url); return s; });
      } catch { alert("Could not remove bookmark."); }
    } else {
      try {
        await api.post("/bookmarks", { url, title: article.title, image: article.urlToImage, source: article.source?.name || "" });
        setBookmarkedUrls(prev => new Set([...prev, url]));
      } catch (err) {
        if (err.response?.status === 409) { alert("Already bookmarked."); }
        else alert("Could not save bookmark.");
      }
    }
  }, [bookmarkedUrls]);

  // ── Gemini Summarizer ──
  const handleSummarize = useCallback(async (article) => {
    setSummarizingUrl(article.url);
    const GEMINI_KEY = process.env.REACT_APP_GEMINI_API_KEY;

    if (!GEMINI_KEY || GEMINI_KEY === "your_gemini_api_key_here" || !GEMINI_KEY.startsWith("AIza")) {
      setSummaryData({ title: article.title, text: "Gemini API key not configured or invalid. Get a free key at aistudio.google.com/app/apikey — it must start with 'AIza'. Add it as REACT_APP_GEMINI_API_KEY in frontend/.env and restart." });
      setSummarizingUrl(null);
      return;
    }

    const content = `Summarize this news article in exactly 3 clear, concise sentences. Be factual and direct:\n\nTitle: ${article.title}\n\nDescription: ${article.description || ""}\n\nContent: ${(article.content || "").substring(0, 1000)}`;

    // Try models in order — flash is most available on free tier
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: content }] }],
              generationConfig: { maxOutputTokens: 300, temperature: 0.3 }
            }),
          }
        );
        const data = await res.json();
        console.log(`Gemini [${model}] response:`, JSON.stringify(data?.error || data?.candidates?.[0]?.content, null, 2));

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          setSummaryData({ title: article.title, text: text.trim() });
          setSummarizingUrl(null);
          return;
        }
        if (data?.error?.code === 429) {
          // Rate limited — try next model
          continue;
        }
        if (data?.error) {
          setSummaryData({ title: article.title, text: `Gemini error: ${data.error.message}` });
          setSummarizingUrl(null);
          return;
        }
      } catch (err) {
        console.error(`Gemini [${model}] fetch error:`, err);
      }
    }

    setSummaryData({ title: article.title, text: "All Gemini models are currently rate-limited. Please wait 30 seconds and try again." });
    setSummarizingUrl(null);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    localStorage.removeItem("email");
    navigate("/");
  };

  const toggleHamburger = () => {
    document.getElementById("nav-links").classList.toggle("active");
  };

  return (
    <>
      <nav>
        <div className="nav_top flex">
          <a href="#" onClick={() => window.location.reload()} className="company-logo">
            <img src={logo} alt="Logo" />
          </a>
          <div className="hamburger" id="hamburger" onClick={toggleHamburger}>
            <span/><span/><span/>
          </div>
          <div className="nav-links" id="nav-links">
            <ul className="flex">
              <li><Link to="/weather">Weather</Link></li>
              <li><Link to="/addnote">Notes</Link></li>
              <li><Link to="/bookmarks">Bookmarks</Link></li>
            </ul>
          </div>
          <div className="assign">
            <LiveClock />
            <div className="search-bar flex">
              {/* Mic button on the LEFT */}
              <button
                className={`news-mic-btn news-mic-left${isVoiceListening ? " listening" : ""}`}
                onClick={toggleVoiceSearch}
                aria-label={isVoiceListening ? "Stop voice search" : "Voice search"}
                title={isVoiceListening ? "Stop listening" : "Search by voice"}
                type="button"
              >
                {isVoiceListening ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
              </button>
              <input
                id="search-text" type="text" className="news-input"
                placeholder={isVoiceListening ? "Listening…" : "Search news…"}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); if (message) setMessage(""); }}
                onKeyDown={handleKeyDown}
                ref={searchInputRef}
                aria-label="Search news"
                autoComplete="off"
              />
              <button className="search-button" onClick={handleSearch} aria-label="Search">
                <img src={srch} alt="Search" />
              </button>
            </div>
            <div className="flex" style={{ gap: "4px", alignItems: "center" }}>
              <div className="toggle-button dark-mode-button" onClick={toggleDarkMode} aria-label="Toggle dark mode">
                <div className="icons">
                  {darkMode ? <i className="fas fa-sun" /> : <i className="fas fa-moon" />}
                </div>
              </div>
              <ProfileMenu firstName={firstName} email={email} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </nav>

      {/* Search history chips */}
      {searchHistory.length > 0 && (
        <div className="search-history-bar">
          <span className="sh-label"><i className="fas fa-history" /> Recent:</span>
          {searchHistory.map(term => (
            <div key={term} className="sh-chip">
              <span onClick={() => { setSearchQuery(term); setCurrentQuery(term); setActiveCategory(null); fetchNews(term); }}>
                {term}
              </span>
              <button className="sh-remove" onClick={() => removeHistory(term)} aria-label={`Remove ${term}`}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Category tabs */}
      <div className="category-tabs-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`cat-tab-btn${activeCategory === cat.id ? " active" : ""}`}
            onClick={() => onCategoryClick(cat.id)}
          >
            <i className={cat.icon} />
            {cat.label}
          </button>
        ))}
      </div>

      {message && <div className="page-message">{message}</div>}

      <div className="cards-container" id="cards-container">
        {loading ? (
          <div className="news-loader">
            <div className="dots"><span/><span/><span/></div>
            <div className="loading-text">Loading the latest stories…</div>
          </div>
        ) : articles.length > 0 ? (
          articles.map((article, idx) => (
            <NewsCard
              key={article.url || idx}
              article={article}
              onBookmark={handleBookmark}
              bookmarkedUrls={bookmarkedUrls}
              onSummarize={handleSummarize}
              summarizing={summarizingUrl === article.url}
            />
          ))
        ) : (
          !message && <div className="no-news">No articles found. Please try a different search.</div>
        )}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />
      {loadingMore && (
        <div className="load-more-spinner">
          <div className="dots"><span/><span/><span/></div>
          <span>Loading more…</span>
        </div>
      )}
      {!hasMore && articles.length > 0 && (
        <p className="no-more-text">You've reached the end of results.</p>
      )}

      {/* AI Summary modal */}
      {summaryData && (
        <SummaryModal title={summaryData.title} summary={summaryData.text} onClose={() => setSummaryData(null)} />
      )}

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    </>
  );
};

export default HomePage;
