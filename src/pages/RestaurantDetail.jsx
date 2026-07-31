import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";

export default function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState("");
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getRestaurant(id)
      .then((data) => setRestaurant(data.restaurant))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="app-shell"><p className="error-text">{error}</p></div>;
  if (!restaurant) return <div className="app-shell"><p className="tag">Loading menu…</p></div>;

  if (restaurant.menu?.length === 0) {
    return (
      <div className="app-shell" style={{ padding: "32px 0 8px" }}>
        <h1 style={{ fontSize: 32 }}>{restaurant.name}</h1>
        <p className="tag" style={{ marginTop: 6 }}>{restaurant.cuisine?.join(", ")} · {'$'.repeat(restaurant.priceTier)} · ★ {restaurant.ratingAverage?.toFixed(1) || 'New'}</p>
        <div className="card" style={{ marginTop: 20 }}>
          <p className="tag">This restaurant currently has no menu items. You can try again later.</p>
          <p style={{ marginTop: 8 }}>
            If you're testing locally, you can populate this restaurant's menu by running the dev seeder endpoint.
          </p>
        </div>
      </div>
    );
  }

  const categories = [...new Set(restaurant.menu.map((m) => m.category))];

  return (
    <div className="app-shell">
      <div style={{ padding: "32px 0 8px" }}>
        <h1 style={{ fontSize: 32 }}>{restaurant.name}</h1>
        <p className="tag" style={{ marginTop: 6 }}>
          {restaurant.cuisine?.join(", ")} · {"$".repeat(restaurant.priceTier)} · ★{" "}
          {restaurant.ratingAverage?.toFixed(1) || "New"} · ~{restaurant.estimatedPrepMinutes} min
        </p>
        {restaurant.description && <p style={{ color: "var(--ink-soft)", marginTop: 10 }}>{restaurant.description}</p>}
        {!restaurant.isOpen && <span className="badge badge-closed" style={{ marginTop: 10 }}>Currently closed</span>}
      </div>

      {categories.map((cat) => (
        <div key={cat} className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 15, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--marigold)" }}>
            {cat}
          </h3>
          {restaurant.menu
            .filter((m) => m.category === cat)
            .map((item) => (
              <MenuRow
                key={item._id}
                item={item}
                disabled={!restaurant.isOpen || !item.isAvailable}
                onAdd={(qty, modifiers) => {
                  addItem(restaurant, item, qty, modifiers);
                  navigate("/checkout");
                }}
              />
            ))}
        </div>
      ))}
    </div>
  );
}

function MenuRow({ item, disabled, onAdd }) {
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState({});

  function toggleOption(group, option) {
    setSelected((prev) => {
      const current = prev[group.name] || [];
      const exists = current.find((o) => o.name === option.name);
      let next;
      if (group.multiSelect) {
        next = exists ? current.filter((o) => o.name !== option.name) : [...current, option];
      } else {
        next = exists ? [] : [option];
      }
      return { ...prev, [group.name]: next };
    });
  }

  function handleAdd() {
    const selectedModifiers = Object.entries(selected).flatMap(([groupName, options]) =>
      options.map((o) => ({ groupName, optionName: o.name, priceDelta: o.priceDelta }))
    );
    onAdd(qty, selectedModifiers);
    setQty(1);
    setSelected({});
  }

  return (
    <div className="menu-row">
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{item.name}</div>
        {item.description && <div className="tag" style={{ marginTop: 3 }}>{item.description}</div>}
        {item.modifierGroups?.map((group) => (
          <div key={group.name} style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              {group.name} {group.required && "· required"}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {group.options.map((opt) => {
                const active = (selected[group.name] || []).some((o) => o.name === opt.name);
                return (
                  <button
                    key={opt.name}
                    className={`filter-chip ${active ? "active" : ""}`}
                    onClick={() => toggleOption(group, opt)}
                    type="button"
                  >
                    {opt.name}
                    {opt.priceDelta ? ` +$${opt.priceDelta.toFixed(2)}` : ""}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="price" style={{ marginTop: 8 }}>${item.price.toFixed(2)}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <div className="qty-control">
          <button className="qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="mono">{qty}</span>
          <button className="qty-btn" onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
        <button className="btn btn-primary btn-sm" disabled={disabled} onClick={handleAdd}>
          {disabled ? "Unavailable" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
