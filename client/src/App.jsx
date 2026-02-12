import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AddMovie from "./pages/AddMovie";
import MovieList from "./pages/MovieList";
import Notifications from "./pages/Notifications";
import Friends from "./pages/Friends";

const App = () => {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <nav className="navbar">
        <Link className="logo" to={user ? "/dashboard" : "/login"}>
          Movie Gifts
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/add">Add Movie</Link>
              <Link to="/list">My List</Link>
              <Link to="/friends">Friends</Link>
              <Link to="/notifications">Alerts</Link>
              <button className="nav-button" onClick={logout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Sign Up</Link>
            </>
          )}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AddMovie />
            </ProtectedRoute>
          }
        />
        <Route
          path="/list"
          element={
            <ProtectedRoute>
              <MovieList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
