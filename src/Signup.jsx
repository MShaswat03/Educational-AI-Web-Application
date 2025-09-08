import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Signup({ onSignup, switchToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const resp = await fetch("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email }),
    });
    const data = await resp.json();
    if (data.success) {
      setSuccess("Account created! Please log in.");
      setTimeout(() => onSignup(), 1200); // Automatically switch to login
    } else {
      setError(data.message || "Signup failed");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <form onSubmit={handleSignup} className="bg-white p-5 rounded shadow" style={{ minWidth: 350 }}>
        <h2 className="mb-4 text-center">Sign Up</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="mb-3">
          <label>Username</label>
          <input type="text" className="form-control"
            value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label>Email</label>
          <input type="email" className="form-control"
            value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label>Password</label>
          <input type="password" className="form-control"
            value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-success w-100 mb-2" type="submit">Sign Up</button>
        <div className="text-center">
          <span>Already have an account? </span>
          <button type="button" className="btn btn-link p-0" onClick={switchToLogin}>Login</button>
        </div>
      </form>
    </div>
  );
}
