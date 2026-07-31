import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("customer@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token, user } = await api.login({ email, password });
      login(token, user);
      // Redirect based on role
      if (user.role === "merchant") navigate("/merchant");
      else if (user.role === "delivery_agent") navigate("/deliveries");
      else navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell" style={{ maxWidth: 380, margin: "0 auto", paddingTop: 60 }}>
      <h2 style={{ fontSize: 26, marginBottom: 24 }}>Log in</h2>
      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
        <p className="tag" style={{ marginTop: 14, textAlign: "center" }}>
          No account? <Link to="/register" style={{ color: "var(--marigold)" }}>Sign up</Link>
        </p>
        {/* <p className="tag" style={{ marginTop: 6, textAlign: "center", fontSize: 11 }}>
          Demo: customer@example.com / merchant@example.com — password123
        </p> */}
      </form>
    </div>
  );
}
