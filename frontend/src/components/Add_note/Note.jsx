import { useMemo, useState } from "react";

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  // Parse the ISO string and display in user's LOCAL timezone
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    weekday: "short",
    day:     "2-digit",
    month:   "numeric",
    year:    "numeric",
    hour:    "2-digit",
    minute:  "2-digit",
    hour12:  true,
  });
};

const countWords = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const categoryColors = {
  home:     { bg: "linear-gradient(135deg,#fff7e6,#ffecc8)", accent: "#f59e0b", dot: "#f59e0b" },
  work:     { bg: "linear-gradient(135deg,#eff6ff,#dbeafe)", accent: "#3b82f6", dot: "#3b82f6" },
  personal: { bg: "linear-gradient(135deg,#f0fdf4,#dcfce7)", accent: "#22c55e", dot: "#22c55e" },
};

const NoteCard = ({ note, onSave, onDelete, onToggle, onEdit, darkMode }) => {
  const [title, setTitle]           = useState(note.title || "");
  const [description, setDescription] = useState(note.description || "");
  const [category, setCategory]     = useState(note.category || "Home");

  const wordCount = useMemo(() => countWords(description), [description]);
  const colors    = categoryColors[category.toLowerCase()] || categoryColors.home;

  return (
    <div
      className={`note-card${note.completed ? " done" : ""}${note.isEditing ? " editing" : ""} note-cat-${category.toLowerCase()}`}
      style={darkMode ? { "--card-accent": colors.accent } : { "--card-accent": colors.accent, background: colors.bg }}
    >
      {/* Accent top bar */}
      <div className="note-accent-bar" style={{ background: colors.accent }} />

      <div className="note-header">
        <label className="checkbox-wrap" title={note.completed ? "Mark incomplete" : "Mark complete"}>
          <input
            type="checkbox"
            checked={note.completed}
            onChange={() => onToggle(note.id)}
          />
          <span className="custom-check" style={{ "--chk": colors.accent }} />
        </label>

        {note.isEditing ? (
          <input
            className="note-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title…"
            autoFocus
          />
        ) : (
          <strong className={`note-title-text${note.completed ? " strikethrough" : ""}`}>
            {note.title || "Untitled note"}
          </strong>
        )}
      </div>

      {note.isEditing ? (
        <>
          <textarea
            className="note-textarea"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write your note here…"
          />
          <div className="meta-row">
            <span className="word-count">{wordCount} word{wordCount !== 1 ? "s" : ""}</span>
            <select
              className="cat-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ borderColor: colors.accent, color: colors.accent }}
            >
              <option>Home</option>
              <option>Work</option>
              <option>Personal</option>
            </select>
          </div>
        </>
      ) : (
        <>
          <p className="note-description">{note.description || <span className="placeholder-text">No description</span>}</p>
          <div className="meta-row">
            <span className="word-count">{countWords(note.description)} word{countWords(note.description) !== 1 ? "s" : ""}</span>
            <span className="category-pill" style={{ background: `${colors.accent}20`, color: colors.accent }}>
              <span className="dot-mini" style={{ background: colors.accent }} />
              {note.category}
            </span>
          </div>
        </>
      )}

      <div className="date-info">
        {note.createdAt && <span>Created {formatTimestamp(note.createdAt)}</span>}
        {note.updatedAt && <span className="edited">· Edited {formatTimestamp(note.updatedAt)}</span>}
      </div>

      <div className="note-actions">
        {note.isEditing ? (
          <button
            className="action-btn save-btn"
            onClick={() => onSave(note.id, title, description, category)}
            title="Save note"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Save
          </button>
        ) : (
          <>
            <button className="action-btn edit-btn" onClick={() => onEdit(note.id)} title="Edit note">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <button className="action-btn delete-btn" onClick={() => onDelete(note.id)} title="Delete note">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default NoteCard;
