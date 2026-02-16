import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      <h1>Hey {user?.name}, ready to share a movie?</h1>
      <div className="hero">
        <Link to="/add" className="section-card">
          <div className="section-title">Add Movie</div>
          <p>Send a recommendation with a poster preview and a note.</p>
        </Link>
        <Link to="/list" className="section-card">
          <div className="section-title">Movie List</div>
          <p>See the movies friends gifted to you and clean up your list.</p>
        </Link>
        <Link to="/friends" className="section-card">
          <div className="section-title">Friends</div>
          <p>Manage your friends and discover new people to share with.</p>
        </Link>
        <Link to="/notifications" className="section-card">
          <div className="section-title">Notifications</div>
          <p>Catch the latest alerts in a live feed style.</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
