import React, { useState } from "react";
import "../styles/comingSoon.css";

const ComingSoonModal = ({ featureName = "Feature", onClose }) => {
  return (
    <div className="coming-soon-overlay">
      <div className="coming-soon-modal">
        <div className="coming-soon-content">
          <div className="coming-soon-icon">🚀</div>
          <h2>This feature is coming soon</h2>
          <p>Stay tuned for {featureName}!</p>
          <p className="coming-soon-subtitle">We're working hard to bring you amazing updates.</p>
          <button className="btn-close-modal" onClick={onClose}>
            Got it! 👍
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonModal;
