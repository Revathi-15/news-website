// Voice assistant — mic button inside input bar
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './bot_ai.css';
import voiceGif from './voice.gif';

const Bot = () => {
  const navigate = useNavigate();
  const [inputText,     setInputText]     = useState("");
  const [contentText,   setContentText]   = useState("Click the mic or type a command");
  const [isListening,   setIsListening]   = useState(false);
  const [history,       setHistory]       = useState([]);
  const recognitionRef  = useRef(null);
  const inputRef        = useRef(null);

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

  const processCommand = useCallback((message) => {
    setIsListening(false);
    const msg = message.toLowerCase().trim();
    let response = "";

    if (!msg) return;

    if (msg.includes("hello") || msg.includes("hi"))          response = "Hello! How can I assist you?";
    else if (msg.includes("who are you"))                     response = "I'm Revathi, your virtual assistant.";
    else if (msg.includes("what can you do"))                 response = "I can open websites, search Google, and answer your questions!";
    else if (msg.includes("open google"))                     { response = "Opening Google"; window.open("https://www.google.com", "_blank"); }
    else if (msg.includes("open youtube"))                    { response = "Opening YouTube"; window.open("https://www.youtube.com", "_blank"); }
    else if (msg.includes("open github"))                     { response = "Opening GitHub"; window.open("https://www.github.com", "_blank"); }
    else if (msg.includes("open instagram"))                  { response = "Opening Instagram"; window.open("https://www.instagram.com", "_blank"); }
    else if (msg.includes("what time") || msg.includes("time")) {
      const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      response = `The current time is ${t}`;
    }
    else if (msg.includes("what date") || msg.includes("today")) {
      const d = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      response = `Today is ${d}`;
    }
    else { response = `Searching for "${message}"`; window.open(`https://www.google.com/search?q=${encodeURIComponent(msg)}`, "_blank"); }

    speak(response);
    setContentText(response);
    setHistory(prev => [{ user: message, bot: response }, ...prev].slice(0, 8));
    setInputText("");
  }, [speak]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputText(transcript);
      processCommand(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setContentText("Didn't catch that — try again");
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    wishMe();
  }, [processCommand, wishMe]);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setContentText("Listening…");
      setInputText("");
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    processCommand(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="app-container">
      <div className="ambient-blob blob-1" aria-hidden="true" />
      <div className="ambient-blob blob-2" aria-hidden="true" />
      <div className="ambient-blob blob-3" aria-hidden="true" />

      {/* Top bar */}
      <div className="bot-topbar">
        <button className="bot-back-btn" onClick={() => navigate("/home")} aria-label="Back to home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      {/* Main */}
      <div className="bot-main">
        <h1 className="title">
          I'm <span className="highlight-pink">Revathi</span>, Your{" "}
          <span className="highlight-cyan">Virtual Assistant</span>
        </h1>

        {/* Avatar */}
        <div className="avatar-ring">
          <div className="avatar-glow" />
          {isListening ? (
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

        {/* Status */}
        <div className="status-bubble">
          <span>{contentText}</span>
        </div>

        {/* Input bar with inline mic */}
        <div className="bot-input-bar">
          <input
            ref={inputRef}
            type="text"
            className="bot-input"
            placeholder="Type a command or click the mic…"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Command input"
          />
          {/* Send button */}
          <button
            className="bot-send-btn"
            onClick={handleSend}
            disabled={!inputText.trim()}
            aria-label="Send"
            title="Send"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
          {/* Mic button */}
          <button
            className={`bot-mic-btn${isListening ? " active" : ""}`}
            onClick={toggleMic}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
            title={isListening ? "Stop" : "Speak"}
          >
            {isListening ? (
              /* Stop icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              /* Mic icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
        </div>

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
