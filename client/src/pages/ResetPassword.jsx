import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../contexts/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("No reset token provided. Please use the link from your email.");
        setTokenValid(false);
        return;
      }

      try {
        const response = await api.get(`/auth/verify-reset-token/${token}`);
        if (response.data.valid) {
          setTokenValid(true);
        } else {
          setError(response.data.message || "Invalid or expired reset link.");
          setTokenValid(false);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to verify reset link.");
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!regex.test(password)) {
      return "Password must be at least 8 characters with uppercase, lowercase, number, and special character (!@#$%^&*)";
    }
    return null;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { newPassword, confirmPassword } = formData;

      // Validate inputs
      if (!newPassword || !confirmPassword) {
        setError("Both password fields are required");
        setLoading(false);
        return;
      }

      // Validate password strength
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        setError(passwordError);
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      // Send reset request
      const response = await api.post("/auth/reset-password", {
        token: token,
        newPassword: newPassword
      });

      setMessage(response.data.message || "Password reset successful!");
      setFormData({ newPassword: "", confirmPassword: "" });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="container">
        <div className="auth-wrapper">
          <div className="auth-brand">
            <span>FilmShare</span>
          </div>
          <h1 className="auth-title">Verifying...</h1>
          <p className="helper-text">Please wait while we verify your reset link.</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="container">
        <div className="auth-wrapper">
          <div className="auth-brand">
            <span>FilmShare</span>
          </div>
          <h1 className="auth-title">Invalid Reset Link</h1>
          <div className="error-box" style={{ background: "#f8d7da", border: "1px solid #f5c6cb", color: "#721c24", padding: "12px", borderRadius: "4px", marginBottom: "20px" }}>
            ❌ {error}
          </div>
          <p className="helper-text">
            <Link to="/forgot-password">Request a new reset link</Link>
          </p>
          <div className="auth-footer">Created by ADITYAVARDHAN (BATMAN)</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="auth-wrapper">
        <div className="auth-brand">
          <span>FilmShare</span>
        </div>
        <h1 className="auth-title">Reset Your Password</h1>
        <p className="helper-text">Enter your new password below.</p>

        {message ? (
          <div className="success-box" style={{ background: "#d4edda", border: "1px solid #c3e6cb", color: "#155724", padding: "12px", borderRadius: "4px", marginBottom: "20px" }}>
            ✅ {message}
            <p style={{ fontSize: "12px", marginTop: "10px" }}>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "16px"
                  }}
                  tabIndex="-1"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                Must contain: 8+ characters, uppercase, lowercase, number, special character (!@#$%^&*)
              </p>
            </div>

            <div className="form-row">
              <label>Confirm Password</label>
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
                disabled={loading}
              />
            </div>

            {error && <p className="helper-text" style={{ color: "#dc3545" }}>❌ {error}</p>}

            <button 
              className="primary" 
              type="submit"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="auth-footer">Created by ADITYAVARDHAN (BATMAN)</div>
      </div>
    </div>
  );
};

export default ResetPassword;
