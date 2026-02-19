import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../contexts/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (!email) {
        setError("Email is required");
        setLoading(false);
        return;
      }

      const response = await api.post("/auth/forgot-password", { email });
      
      setMessage(response.data.message || "Password reset email sent! Check your inbox.");
      setSent(true);
      setEmail("");

      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-wrapper">
        <div className="auth-brand">
          <span>FilmShare</span>
        </div>
        <h1 className="auth-title">Forgot Password?</h1>
        <p className="helper-text">Enter your email to receive a password reset link.</p>

        {sent ? (
          <div className="success-box" style={{ background: "#d4edda", border: "1px solid #c3e6cb", color: "#155724", padding: "12px", borderRadius: "4px", marginBottom: "20px" }}>
            ✅ {message}
            <p style={{ fontSize: "12px", marginTop: "10px" }}>Redirecting to login...</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>Email Address</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>

              {error && <p className="helper-text" style={{ color: "#dc3545" }}>❌ {error}</p>}
              {message && !sent && <p className="helper-text" style={{ color: "#28a745" }}>✅ {message}</p>}

              <button 
                className="primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p className="helper-text">
              Remember your password? <Link to="/login">Back to login</Link>.
            </p>
          </>
        )}

        <div className="auth-footer">Created by ADITYAVARDHAN (BATMAN)</div>
      </div>
    </div>
  );
};

export default ForgotPassword;
