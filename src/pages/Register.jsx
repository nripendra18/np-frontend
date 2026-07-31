import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token, user } = await api.register(form);
      login(token, user);
      navigate(user.role === "merchant" ? "/merchant" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell" style={{ maxWidth: 380, margin: "0 auto", paddingTop: 60 }}>
      <h2 style={{ fontSize: 26, marginBottom: 24 }}>Create an account</h2>
      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} required />
        </div>
        <div className="field">
          <label>I am a…</label>
          <select value={form.role} onChange={(e) => update("role", e.target.value)}>
            <option value="customer">Customer, ordering food</option>
            <option value="merchant">Restaurant owner</option>
            <option value="delivery_agent">Delivery agent</option>
          </select>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Creating account…" : "Sign up"}
        </button>
        <p className="tag" style={{ marginTop: 14, textAlign: "center" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--marigold)" }}>Log in</Link>
        </p>
      </form>
    </div>
  );
}
