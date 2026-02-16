import React, { useEffect, useState } from "react";
import api from "../api/axios";
import NotificationCard from "../components/NotificationCard";
import "../styles/notifications.css";

const Notifications = () => {
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState("");

  const loadNotes = async () => {
    try {
      const [notesRes, ratingRes] = await Promise.all([
        api.get("/getNotifications"),
        api.get("/getRatingNotifications").catch(() => ({ data: [] }))
      ]);

      // Combine regular notifications with rating notifications
      const regularNotes = notesRes.data || [];
      const ratingNotes = (ratingRes.data || []).map(rating => ({
        id: `rating_${rating.userMovieId}`,
        type: "rating",
        movie: rating.movie,
        ratings: rating.ratings,
        text: `Friends have rated "${rating.movie?.title}"`,
        read: false
      }));

      // Merge and sort by most recent
      const allNotes = [...ratingNotes, ...regularNotes];
      setNotes(allNotes);
    } catch (error) {
      setStatus("Failed to load notifications");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) {
      return;
    }

    try {
      await api.delete("/clearNotifications");
      setNotes([]);
      setStatus("All notifications cleared");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("Failed to clear notifications");
    }
  };

  const handleDeleteNotification = (noteId) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  useEffect(() => {
    loadNotes();
    const interval = setInterval(loadNotes, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p className="helper-text">Live feed of new film shares and ratings.</p>
        </div>
        {notes.length > 0 && (
          <button 
            className="clear-all-btn"
            onClick={handleClearAll}
            title="Clear all notifications"
          >
            Clear All
          </button>
        )}
      </div>
      {status && <p className="helper-text">{status}</p>}
      <div className="card-grid">
        {notes.map((note) => (
          <NotificationCard 
            key={note.id} 
            note={note} 
            onDelete={handleDeleteNotification}
          />
        ))}
      </div>
      {notes.length === 0 && <p className="helper-text">No alerts yet.</p>}
    </div>
  );
};

export default Notifications;
