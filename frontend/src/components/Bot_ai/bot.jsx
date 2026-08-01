// Voice assistant interaction

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './bot_ai.css';
import micIcon from './mic.svg';
import voiceGif from './voice.gif';

const Bot = () => {
  const navigate = useNavigate();
  const [contentText, setContentText] = useState("Click the mic to talk to me");
  const [showVoiceGif, setShowVoiceGif] = useState(false);
  const [showMicButton, setShowMicButton] = useState(true);
  const [history, setHistory] = useState([]);
  const recognitionRef = useRef(null);

  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const wishMe = useCallback(() => {
    if (sessionStorage.getItem("botGreeted")) return;
    sessionStorage.setItem("botGreeted", "true");
    const hours = new Date().getHours();
    if (hours < 12) speak("Good morning!");
    else if (hours < 18) speak("Good afternoon!");
    else speak("Good evening!");
  }, [speak]);

  const takeCommand = useCallback((message) => {
    setShowVoiceGif(false);
    setShowMicButton(true);
    const msg = message.toLowerCase();
    let response = "";

    if (msg.includes("hello") || msg.includes("hi")) {
      response = "Hello! How can I assist you?";
    } else if (msg.includes("who are you")) {
      response = "I'm Revathi, your virtual assistant.";
    } else if (msg.includes("what can you do")) {
      response = "I can open websites, search Google, and answer questions for you!";
    } else if (msg.includes("open google")) {
      response = "Opening Google";
      window.open("https://www.google.com", "_blank");
    } else if (msg.includes("open youtube")) {
      response = "Opening YouTube";
      window.open("https://www.youtube.com", "_blank");
    } else if (msg.includes("open github")) {
      response = "Opening GitHub";
      window.open("https://www.github.com", "_blank");
    } else {
      response = `Searching for "${message}"`;
      window.open(`https://www.google.com/search?q=${encodeURIComponent(msg)}`, "_blank");
    }

    speak(response);
    setHistory(prev => [{ user: message, bot: response, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 6));
    setContentText(response);
  }, [speak]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setContentText(transcript);
      takeCommand(transcript);
    };
    recognition.onerror = () => {
      speak("Sorry, I didn't catch that. Please try again.");
      setShowVoiceGif(false);
      setShowMicButton(true);
      setContentText("Didn't catch that — try again");
    };
    recognitionRef.current = recognition;
    wishMe();
  }, [takeCommand, wishMe, speak]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setShowVoiceGif(true);
      setShowMicButton(false);
      setContentText("Listening…");
    }
  };

  return (
    <div className="app-container">
      {/* Ambient background blobs */}
      <div className="ambient-blob blob-1" aria-hidden="true" />
      <div className="ambient-blob blob-2" aria-hidden="true" />
      <div className="ambient-blob blob-3" aria-hidden="true" />

      {/* Top bar */}
      <div className="bot-topbar">
        <button className="bot-back-btn" onClick={() => navigate("/home")} aria-label="Go back to home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      {/* Main content */}
      <div className="bot-main">
        <h1 className="title">
          I'm <span className="highlight-pink">Revathi</span>, Your{" "}
          <span className="highlight-cyan">Virtual Assistant</span>
        </h1>

        {/* Avatar — no black background */}
        <div className="avatar-ring">
          <div className="avatar-glow" />
          {showVoiceGif ? (
            <img src={voiceGif} alt="Listening" className="avatar-gif" />
          ) : (
            <div className="avatar-idle">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(0,231,231,0.8)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z" />
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="3" fill="rgba(0,231,231,0.15)" />
              </svg>
            </div>
          )}
        </div>

        {/* Status text */}
        <div className="status-bubble">
          <span>{contentText}</span>
        </div>

        {/* Mic button */}
        {showMicButton && (
          <button id="btn" onClick={startListening} aria-label="Start listening">
            <img src={micIcon} alt="Mic" className="mic-icon" />
            <span>Talk to me</span>
          </button>
        )}

        {/* Conversation history */}
        {history.length > 0 && (
          <div className="bot-history">
            <p className="history-label">Recent</p>
            {history.map((item, i) => (
              <div key={i} className="history-item">
                <div className="history-user">
                  <span className="h-badge you">You</span>
                  <span>{item.user}</span>
                </div>
                <div className="history-bot">
                  <span className="h-badge rev">Revathi</span>
                  <span>{item.bot}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bot;
