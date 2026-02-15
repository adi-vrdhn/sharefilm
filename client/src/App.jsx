import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AddMovie from "./pages/AddMovie";
import MovieList from "./pages/MovieList";
import Notifications from "./pages/Notifications";
import Friends from "./pages/Friends";
import Messages from "./pages/Messages";
import MovieParty from "./pages/MovieParty";
import Discover from "./pages/Discover";
import Watchlist from "./pages/Watchlist";
import Profile from "./pages/Profile";

const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'radial-gradient(circle at top left, rgba(214, 181, 111, 0.12), transparent 55%), radial-gradient(circle at 20% 70%, rgba(155, 107, 52, 0.18), transparent 52%), linear-gradient(135deg, #0b0d10, #13161b)',
    color: '#d6b56f',
    fontFamily: '"Space Grotesk", sans-serif',
  }}>
    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎬</div>
    <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontFamily: '"Unbounded", sans-serif' }}>FilmShare</h1>
    <p style={{ margin: '0', color: '#b4945c', fontSize: '1rem' }}>Loading your cinema...</p>
  </div>
);

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/add" : "/login"} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      <Route
        path="/add"
        element={
          <ProtectedRoute>
            <Layout>
              <AddMovie />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/party"
        element={
          <ProtectedRoute>
            <Layout>
              <MovieParty />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/discover"
        element={
          <ProtectedRoute>
            <Layout>
              <Discover />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/watchlist"
        element={
          <ProtectedRoute>
            <Layout>
              <Watchlist />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/list"
        element={
          <ProtectedRoute>
            <Layout>
              <MovieList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends"
        element={
          <ProtectedRoute>
            <Layout>
              <Friends />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Layout>
              <Messages />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
