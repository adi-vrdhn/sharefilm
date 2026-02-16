import React, { useEffect, useState } from "react";
import api from "../api/axios";
import NotificationCard from "../components/NotificationCard";

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

  useEffect(() => {
    loadNotes();
    const interval = setInterval(loadNotes, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <h1>Notifications</h1>
      <p className="helper-text">Live feed of new film shares and ratings.</p>
      {status && <p className="helper-text">{status}</p>}
      <div className="card-grid">
        {notes.map((note) => (
          <NotificationCard key={note.id} note={note} />
        ))}
      </div>
      {notes.length === 0 && <p className="helper-text">No alerts yet.</p>}
    </div>
  );
};

export default Notifications;
