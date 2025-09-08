import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Login({ onLogin, switchToSignup }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const resp = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await resp.json();
      if (data.success && data.user) {
        onLogin(data.user); // Go to main UI
      } else {
        setError(data.message || "Invalid username or password");
      }
    } catch (err) {
      setError("Server not responding. Please try again.");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <form onSubmit={handleLogin} className="bg-white p-5 rounded shadow" style={{ minWidth: 350 }}>
        <h2 className="mb-4 text-center">EduAI Login</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="mb-3">
          <label>Username</label>
          <input type="text" className="form-control"
            value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label>Password</label>
          <input type="password" className="form-control"
            value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary w-100 mb-2" type="submit">Login</button>
        <div className="text-center">
          <span>New? </span>
          <button type="button" className="btn btn-link p-0" onClick={switchToSignup}>Sign Up</button>
        </div>
      </form>
    </div>
  );
}
