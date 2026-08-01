import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const features = [
  { icon: "fas fa-newspaper", title: "Live News Feed", desc: "Top stories curated in real-time, always fresh." },
  { icon: "fas fa-sticky-note", title: "Smart Notes", desc: "Categorise, search and track every thought instantly." },
  { icon: "fas fa-cloud-sun", title: "Live Weather", desc: "Precise forecasts with beautiful animated backgrounds." },
  { icon: "fas fa-robot", title: "AI Assistant", desc: "Talk to Revathi — your voice-powered virtual companion." },
];

export default function LandingPage() {
  // Subtle parallax on cursor move
  useEffect(() => {
    const el = document.querySelector(".landing-wrapper");
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      el.style.setProperty("--cx", `${x}%`);
      el.style.setProperty("--cy", `${y}%`);
      el.style.setProperty("--co", "1");
    };
    const onLeave = () => el.style.setProperty("--co", "0");
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div className="landing-wrapper">
      {/* Ambient blobs */}
      <div className="lp-blob lp-blob-1" aria-hidden="true" />
      <div className="lp-blob lp-blob-2" aria-hidden="true" />
      <div className="lp-blob lp-blob-3" aria-hidden="true" />

      {/* Cursor glow */}
      <div className="cursor-glow" aria-hidden="true" />

      <div className="landing-inner">
        {/* Hero */}
        <div className="landing-hero">
          <div className="lp-badge">
            <i className="fas fa-bolt" /> All-in-one workspace
          </div>
          <h1 className="lp-title">
            Write. Read.<br />
            <span className="lp-grad">Stay Inspired.</span>
          </h1>
          <p className="lp-sub">
            Your personal space for news, notes, weather, and AI — beautifully unified.
          </p>
          <div className="landing-buttons">
            <Link to="/login" className="lp-btn lp-btn-primary">
              <i className="fas fa-sign-in-alt" /> Get started
            </Link>
            <Link to="/register" className="lp-btn lp-btn-secondary">
              Create account →
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="lp-features">
          {features.map((f) => (
            <div key={f.title} className="lp-feature-card">
              <div className="lp-feature-icon">
                <i className={f.icon} />
              </div>
              <div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
