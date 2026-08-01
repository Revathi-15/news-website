// Notes Application 

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../../context/DarkModeContext";
import NoteCard from "./Note";
import "./notes.css";

const categories = ["All", "Home", "Work", "Personal"];

const AdvancedNotesApp = () => {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [notes, setNotes] = useState(() => {
    const stored = localStorage.getItem("advancedNotes");
    return stored ? JSON.parse(stored) : [];
  });

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredNotes = notes.filter(
    (note) =>
      (filter === "All" || note.category?.trim().toLowerCase() === filter.toLowerCase()) &&
      (
        (note.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (note.description || "").toLowerCase().includes(search.toLowerCase())
      )
  );

  const completedCount = notes.filter((n) => n.completed).length;
  const hasNotes = notes.length > 0;

  const handleAddNote = () => {
    // Use the current filter category so the new note is immediately visible
    const defaultCategory = filter === "All" ? "Home" : filter;
    const newNote = {
      id: Date.now(),
      title: "",
      description: "",
      category: defaultCategory,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      saved: false,
      completed: false,
      isEditing: true,
    };
    setNotes([newNote, ...notes]);
  };

  const handleSave = (id, updatedTitle, updatedDescription, updatedCategory) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              title: updatedTitle,
              description: updatedDescription,
              category: updatedCategory,
              isEditing: false,
              saved: true,
              updatedAt: note.saved ? new Date().toISOString() : note.updatedAt,
              createdAt: note.createdAt || new Date().toISOString(),
            }
          : note
      )
    );
  };

  const handleDelete = (id) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const handleToggleComplete = (id) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, completed: !note.completed } : note
      )
    );
  };

  const handleEdit = (id) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, isEditing: true } : note
      )
    );
  };

  useEffect(() => {
    localStorage.setItem("advancedNotes", JSON.stringify(notes));
  }, [notes]);

  const progressPct = hasNotes ? Math.round((completedCount / notes.length) * 100) : 0;

  return (
    <div className={`notes-wrapper${darkMode ? " dark" : ""}`}>
      {/* Animated gradient orbs in background */}
      <div className="notes-bg-orb orb1" aria-hidden="true" />
      <div className="notes-bg-orb orb2" aria-hidden="true" />

      <div className="top-bar">
        <button
          className="icon-btn back-btn"
          onClick={() => navigate("/home")}
          aria-label="Go back to home"
          title="Back to home"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
          </svg>
        </button>

        <div className="search-wrap">
          <svg className="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="add-note-btn" onClick={handleAddNote}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Note
        </button>
      </div>

      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`cat-tab${filter === cat ? " active" : ""} cat-${cat.toLowerCase()}`}
            onClick={() => setFilter(cat)}
          >
            {cat !== "All" && <span className={`dot dot-${cat.toLowerCase()}`} />}
            {cat}
            {cat !== "All" && (
              <span className="cat-count">
                {notes.filter(n => n.category?.toLowerCase() === cat.toLowerCase()).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="progress-section">
        <div className="progress-text">
          {!hasNotes
            ? "No notes yet — click Add Note to get started."
            : completedCount > 0
              ? `${completedCount} of ${notes.length} notes completed`
              : `${notes.length} active note${notes.length > 1 ? "s" : ""}`
          }
          {hasNotes && <span className="pct-badge">{progressPct}%</span>}
        </div>
        <div className="progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="filled" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="notes-grid">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onSave={handleSave}
              onDelete={handleDelete}
              onToggle={handleToggleComplete}
              onEdit={handleEdit}
              darkMode={darkMode}
            />
          ))
        ) : (
          <div className="empty-state">
            {filter === "All"
              ? <p>No notes yet</p>
              : <p>No notes in <strong>{filter}</strong></p>
            }
            <small>Click <em>Add Note</em> to create one.</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedNotesApp;
