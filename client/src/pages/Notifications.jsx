import React, { useEffect, useState } from "react";
import api from "../api/axios";
import NotificationCard from "../components/NotificationCard";

const Notifications = () => {
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState("");

  const loadNotes = async () => {
    try {
      const response = await api.get("/getNotifications");
      setNotes(response.data);
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
      <p className="helper-text">Live feed of new film shares.</p>
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
