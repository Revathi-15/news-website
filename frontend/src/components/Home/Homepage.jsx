// News browsing

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDarkMode } from "../../context/DarkModeContext";
import logo from "../../assets/logo16-1.png";
import srch from "../../assets/srch.png";
import "./HomePage.css";

/* ── Live clock ── */
const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div className="live-clock">
      <span className="clock-time">{timeStr}</span>
      <span className="clock-date">{dateStr}</span>
    </div>
  );
};

/* ── Profile avatar + dropdown ── */
const ProfileMenu = ({ firstName, email, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initial = (firstName || "?")[0].toUpperCase();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="profile-menu" ref={ref}>
      <button
        className="avatar-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Profile menu"
        aria-expanded={open}
      >
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
          <button className="profile-dropdown-logout" onClick={onLogout}>
            <i className="fas fa-sign-out-alt" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

/* ── News card ── */
const NewsCard = ({ article }) => {
  const pubDate  = new Date(article.publishedAt);
  const now      = new Date();
  const diffHrs  = Math.floor((now - pubDate) / 3600000);
  const diffDays = Math.floor((now - pubDate) / 86400000);

  const timeAgo =
    diffHrs < 1    ? "Just now"
    : diffHrs < 24 ? `${diffHrs}h ago`
    : diffDays < 7 ? `${diffDays}d ago`
    : pubDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const fullDate = pubDate.toLocaleString("en-GB", {
    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short", year: "numeric",
  });

  const textBlob       = [article.title || "", article.description || "", article.content || ""].join(" ");
  const wordCount      = textBlob.split(/\s+/).filter(Boolean).length;
  const estimatedWords = article.content ? wordCount * 4 : wordCount * 12;
  const readMins       = Math.max(1, Math.round(estimatedWords / 200));

  return (
    <div className="card" onClick={() => window.open(article.url, "_blank")}>
      <div className="card-header">
        <img
          src={article.urlToImage}
          alt={article.title || "News Image"}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/400x230/e0e0e0/505050?text=No+Image";
          }}
        />
        <div className="card-read-time">{readMins} min read</div>
      </div>
      <div className="card-content">
        <h5 className="news-title">{article.title}</h5>
        <div className="card-meta-row">
          <span className="news-source-badge">{article.source.name}</span>
          <span className="news-time" title={fullDate}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            {timeAgo}
          </span>
        </div>
        <p className="news-des">{article.description}</p>
      </div>
    </div>
  );
};

/* ── Main page ── */
const HomePage = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const Api_key = "71146ebefc69425aa26e16e6e9e066d1";
  const apiUrl  = "https://newsapi.org/v2/everything?";

  const firstName = (localStorage.getItem("firstName") || "").slice(0, 20);
  const email     = localStorage.getItem("email") || "";

  const [articles,    setArticles]    = useState([]);
  const [currentLanguage]             = useState("en");
  const [currentNav,  setCurrentNav]  = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message,     setMessage]     = useState("");
  const [loading,     setLoading]     = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchNews("India");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNews = useCallback(async (query) => {
    setMessage("");
    setLoading(true);
    try {
      const url = `${apiUrl}q=${encodeURIComponent(query)}&apiKey=${Api_key}&language=${currentLanguage}`;
      const res = await fetch(url, { headers: { "User-Agent": "News-App/1.0" } });

      if (!res.ok) {
        setMessage(
          res.status === 426
            ? "NewsAPI key may be invalid or over its daily limit."
            : `Error fetching news: ${res.statusText || "Unknown Error"}`
        );
        throw new Error(res.statusText);
      }

      const data = await res.json();
      if (data.articles?.length > 0) {
        const withImages = data.articles.filter((a) => a.urlToImage);
        setArticles(withImages);
        if (withImages.length === 0)
          setMessage("No articles with images found. Try a different term.");
      } else {
        setArticles([]);
        setMessage("No articles found. Try a different search term.");
      }
    } catch (err) {
      console.error(err);
      if (!message.includes("API")) setMessage(`Error: ${err.message}`);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [currentLanguage, message]);

  const onNavItemClick = useCallback((id) => {
    fetchNews(id);
    if (searchInputRef.current) searchInputRef.current.value = "";
    setCurrentNav(id);
  }, [fetchNews]);

  const handleSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (!query) {
      setMessage("Please enter a search term.");
      searchInputRef.current?.focus();
      return;
    }
    fetchNews(query);
    setCurrentNav(null);
  }, [fetchNews, searchQuery]);

  const handleKeyPress = useCallback(
    (e) => { if (e.key === "Enter") handleSearch(); },
    [handleSearch]
  );

  const reload = useCallback(() => window.location.reload(), []);

  const toggleHamburger = () => {
    document.getElementById("nav-links").classList.toggle("active");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    localStorage.removeItem("email");
    navigate("/");
  };

  return (
    <>
      <nav>
        <div className="nav_top flex">
          <a href="#" onClick={reload} className="company-logo">
            <img src={logo} alt="Logo" />
          </a>

          <div className="hamburger" id="hamburger" onClick={toggleHamburger}>
            <span/><span/><span/>
          </div>

          <div className="nav-links" id="nav-links">
            <ul className="flex">
              <li><Link to="/weather">Weather</Link></li>
              <li><Link to="/addnote">Add Note</Link></li>
              <li
                className={`hover-link nav-item${currentNav === "trending" ? " active" : ""}`}
                onClick={() => onNavItemClick("trending")}
              >
                Trending
              </li>
              <li><Link to="/bot">Bot</Link></li>
            </ul>
          </div>

          <div className="assign">
            <LiveClock />
            <div className="search-bar flex">
              <input
                id="search-text"
                type="text"
                className="news-input"
                placeholder="Search news..."
                onChange={(e) => { setSearchQuery(e.target.value); if (message) setMessage(""); }}
                onKeyDown={handleKeyPress}
                value={searchQuery}
                ref={searchInputRef}
                aria-label="Search news"
                autoComplete="off"
              />
              <button className="search-button" onClick={handleSearch} aria-label="Search">
                <img src={srch} alt="Search" />
              </button>
            </div>

            <div className="flex" style={{ gap: "4px", alignItems: "center" }}>
              <div
                className="toggle-button dark-mode-button"
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
              >
                <div className="icons">
                  {darkMode ? <i className="fas fa-sun" /> : <i className="fas fa-moon" />}
                </div>
              </div>

              <ProfileMenu
                firstName={firstName}
                email={email}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </nav>

      {message && <div className="page-message">{message}</div>}

      <div className="cards-container" id="cards-container">
        {loading ? (
          <div className="news-loader">
            <div className="dots"><span/><span/><span/></div>
            <div className="loading-text">Loading the latest stories…</div>
          </div>
        ) : articles.length > 0 ? (
          articles.map((article, idx) => (
            <NewsCard key={article.url || idx} article={article} />
          ))
        ) : (
          !message && (
            <div className="no-news">No articles found. Please try a different search.</div>
          )
        )}
      </div>

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
      />
    </>
  );
};

export default HomePage;
