import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="container">
      <div className="auth-wrapper">
        <div className="auth-brand">
          <Logo size="40" />
          <span>FilmShare</span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="helper-text">Log in to gift movies to friends.</p>
        <form onSubmit={handleSubmit}>
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
            Log In
          </button>
        </form>
        <p className="helper-text">
          New here? <Link to="/signup">Create an account</Link>.
        </p>
        <div className="auth-footer">Created by ADITYAVARDHAN (BATMAN)</div>
      </div>
    </div>
  );
};

export default Login;
