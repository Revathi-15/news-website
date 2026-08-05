// Notes Application — backend-persisted (Feature 1)
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../../context/DarkModeContext";
import api from "../../api";
import NoteCard from "./Note";
import "./notes.css";

const categories = ["All", "Home", "Work", "Personal"];

const AdvancedNotesApp = () => {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  const [notes,   setNotes]   = useState([]);
  const [filter,  setFilter]  = useState("All");
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // ── Load notes from backend ──
  const loadNotes = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/notes");
      // Add isEditing:false and saved:true to all fetched notes
      setNotes(res.data.map(n => ({ ...n, isEditing: false, saved: true })));
    } catch {
      setError("Failed to load notes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const filteredNotes = notes.filter(
    (note) =>
      (filter === "All" || note.category?.trim().toLowerCase() === filter.toLowerCase()) &&
      (
        (note.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (note.description || "").toLowerCase().includes(search.toLowerCase())
      )
  );

  const completedCount = notes.filter(n => n.completed && n.saved).length;
  const savedNotes     = notes.filter(n => n.saved);
  const hasNotes       = savedNotes.length > 0;

  // ── Add (creates a local unsaved card) ──
  const handleAddNote = () => {
    const defaultCategory = filter === "All" ? "Home" : filter;
    const tempId = `temp-${Date.now()}`;
    const newNote = {
      id:          tempId,
      title:       "",
      description: "",
      category:    defaultCategory,
      createdAt:   new Date().toISOString(),
      updatedAt:   null,
      saved:       false,
      completed:   false,
      isEditing:   true,
    };
    setNotes(prev => [newNote, ...prev]);
  };

  // ── Save (POST or PUT) ──
  const handleSave = async (id, title, description, category) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    if (!note.saved) {
      // New note — POST to backend
      try {
        const res = await api.post("/notes", { title, description, category, completed: false });
        setNotes(prev => prev.map(n =>
          n.id === id
            ? { ...res.data, isEditing: false, saved: true }
            : n
        ));
      } catch {
        alert("Could not save note. Please try again.");
      }
    } else {
      // Existing — PUT
      try {
        const res = await api.put(`/notes/${id}`, { title, description, category, completed: note.completed });
        setNotes(prev => prev.map(n =>
          n.id === id ? { ...res.data, isEditing: false, saved: true } : n
        ));
      } catch {
        alert("Could not update note. Please try again.");
      }
    }
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    if (!note.saved) {
      // Unsaved temp note — just remove from state
      setNotes(prev => prev.filter(n => n.id !== id));
      return;
    }
    try {
      await api.delete(`/notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {
      alert("Could not delete note. Please try again.");
    }
  };

  // ── Toggle complete ──
  const handleToggleComplete = async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note || !note.saved) return;
    const newCompleted = !note.completed;
    // Optimistic UI
    setNotes(prev => prev.map(n => n.id === id ? { ...n, completed: newCompleted } : n));
    try {
      await api.put(`/notes/${id}`, {
        title: note.title, description: note.description,
        category: note.category, completed: newCompleted,
      });
    } catch {
      // Revert on failure
      setNotes(prev => prev.map(n => n.id === id ? { ...n, completed: !newCompleted } : n));
    }
  };

  // ── Edit (local state only) ──
  const handleEdit = (id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isEditing: true } : n));
  };

  const progressPct = hasNotes ? Math.round((completedCount / savedNotes.length) * 100) : 0;

  return (
    <div className={`notes-wrapper${darkMode ? " dark" : ""}`}>
      <div className="notes-bg-orb orb1" aria-hidden="true" />
      <div className="notes-bg-orb orb2" aria-hidden="true" />

      <div className="top-bar">
        <button className="icon-btn back-btn" onClick={() => navigate("/home")} aria-label="Back to home" title="Back to home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
          </svg>
        </button>

        <div className="search-wrap">
          <svg className="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <button className="add-note-btn" onClick={handleAddNote}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Note
        </button>
      </div>

      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`cat-tab${filter === cat ? " active" : ""} cat-${cat.toLowerCase()}`}
            onClick={() => setFilter(cat)}
          >
            {cat !== "All" && <span className={`dot dot-${cat.toLowerCase()}`} />}
            {cat}
            {cat !== "All" && (
              <span className="cat-count">
                {notes.filter(n => n.saved && n.category?.toLowerCase() === cat.toLowerCase()).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="progress-section">
        <div className="progress-text">
          {loading
            ? "Loading notes…"
            : !hasNotes
              ? "No notes yet — click Add Note to get started."
              : completedCount > 0
                ? `${completedCount} of ${savedNotes.length} notes completed`
                : `${savedNotes.length} active note${savedNotes.length > 1 ? "s" : ""}`
          }
          {hasNotes && !loading && <span className="pct-badge">{progressPct}%</span>}
        </div>
        <div className="progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="filled" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {error && <div className="notes-error">{error} <button onClick={loadNotes}>Retry</button></div>}

      {loading ? (
        <div className="notes-loading-state">
          <div className="notes-dots"><span/><span/><span/></div>
          <p>Loading your notes…</p>
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.length > 0 ? (
            filteredNotes.map(note => (
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
              {filter === "All" ? <p>No notes yet</p> : <p>No notes in <strong>{filter}</strong></p>}
              <small>Click <em>Add Note</em> to create one.</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedNotesApp;
