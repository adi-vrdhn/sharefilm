import React from "react";

const NotificationCard = ({ note }) => {
  return (
    <div className="notice-card">
      <div>
        <strong>{note.text}</strong>
        <div className="helper-text">{note.read ? "Read" : "New"}</div>
      </div>
      <span className="badge">Alert</span>
    </div>
  );
};

export default NotificationCard;
