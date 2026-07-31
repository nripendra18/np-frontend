import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const CUISINES = ["Indian", "Italian", "Chinese", "Mexican", "Thai", "American"];

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (query) params.q = query;
    if (cuisine) params.cuisine = cuisine;

    api
      .listRestaurants(params)
      .then((data) => setRestaurants(data.results))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query, cuisine]);

  const { user } = useAuth();

  return (
    <div className="app-shell">
      <div className="hero hero-landing">
        <div className="hero-copy">
          <h1>Delicious meals from local kitchens, delivered fast.</h1>
          <p>Discover restaurants in your neighborhood, place orders with confidence, and follow every delivery live.</p>
          <div className="hero-actions">
            <Link to={user ? "/" : "/register"} className="btn btn-primary">
              {user ? "Browse restaurants" : "Get started"}
            </Link>
            <button className="btn btn-ghost" onClick={() => setQuery("popular")}>Browse popular</button>
          </div>
        </div>
        <div className="hero-panel card">
          <div className="feature-step">
            <strong>1.</strong> Search restaurants by cuisine, rating, or location.
          </div>
          <div className="feature-step">
            <strong>2.</strong> Add favorites to your cart and checkout in seconds.
          </div>
          <div className="feature-step">
            <strong>3.</strong> Track your order in real time until it arrives.
          </div>
        </div>
      </div>

      <div className="field" style={{ maxWidth: 420 }}>
        <input
          placeholder="Search restaurants or cuisines…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="filter-bar">
        <button className={`filter-chip ${!cuisine ? "active" : ""}`} onClick={() => setCuisine(null)}>
          All cuisines
        </button>
        {CUISINES.map((c) => (
          <button
            key={c}
            className={`filter-chip ${cuisine === c ? "active" : ""}`}
            onClick={() => setCuisine(c === cuisine ? null : c)}
          >
            {c}
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="tag">Loading restaurants…</p>}

      {!loading && restaurants.length === 0 && (
        <div className="empty-state">
          <p>No restaurants match yet. Try clearing filters — or seed the database (see README).</p>
        </div>
      )}

      <div className="grid-restaurants">
        {restaurants.map((r) => (
          <div key={r._id} className="card card-hover restaurant-card" onClick={() => navigate(`/restaurants/${r._id}`)}>
            <div className="restaurant-thumb">{r.name[0]}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.name}</div>
                <div className="tag">{r.cuisine?.join(", ")}</div>
              </div>
              <span className={`badge ${r.isOpen ? "" : "badge-closed"}`}>{r.isOpen ? "Open" : "Closed"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span className="tag">{"$".repeat(r.priceTier || 1)}</span>
              <span className="tag">★ {r.ratingAverage?.toFixed(1) || "New"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
