import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="container">
      <div className="auth-wrapper">
        <div className="auth-brand">
          <span>FilmShare</span>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="helper-text">Your username is how friends find you.</p>
        <div className="warning-box">
          <strong>⚠️ IMPORTANT:</strong> Do NOT use your original email ID. Create a temporary email for this app.
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Username</label>
            <input
              className="input"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input
              className="input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input
              className="input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          {error && <p className="helper-text">{error}</p>}
          <button className="primary" type="submit">
            Sign Up
          </button>
        </form>
        <p className="helper-text">
          Already a member? <Link to="/login">Log in</Link>.
        </p>
        <div className="auth-footer">Created by ADITYAVARDHAN (BATMAN)</div>
      </div>
    </div>
  );
};

export default Signup;
