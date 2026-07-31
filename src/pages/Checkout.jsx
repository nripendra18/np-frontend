import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const TAX_RATE = 0.05;
const DELIVERY_FEE = 2.99;

export default function Checkout() {
  const { restaurantId, restaurantName, items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ street: "", city: "", state: "", zip: "" });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + (items.length ? DELIVERY_FEE : 0);

  async function handlePlaceOrder() {
    if (!user) return navigate("/login");
    setPlacing(true);
    setError("");
    try {
      const { order } = await api.placeOrder(
        {
          restaurantId,
          items: items.map((it) => ({
            menuItemId: it.menuItemId,
            quantity: it.quantity,
            selectedModifiers: it.selectedModifiers,
          })),
          deliveryAddress: address,
          payment: { provider: paymentMethod === "card" ? "stripe" : "cod" },
        },
        token
      );
      // If card payment selected, attempt to charge via payments endpoint (simulated)
      if (paymentMethod === "card") {
        await api.chargePayment({ orderId: order._id, provider: "stripe" }, token);
      }
      clearCart();
      navigate(`/orders/${order._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="app-shell">
        <div className="empty-state">
          <p>Your cart is empty. Find something delicious first.</p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate("/")}>
            Browse restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, paddingTop: 32 }}>
      <div>
        <h2 style={{ fontSize: 24, marginBottom: 4 }}>Your order</h2>
        <p className="tag">From {restaurantName}</p>

        <div className="card" style={{ marginTop: 16 }}>
          {items.map((it, i) => (
            <div key={i} className="menu-row">
              <div>
                <div style={{ fontWeight: 600 }}>{it.name}</div>
                {it.selectedModifiers?.length > 0 && (
                  <div className="tag">{it.selectedModifiers.map((m) => m.optionName).join(", ")}</div>
                )}
                <div className="qty-control" style={{ marginTop: 8 }}>
                  <button className="qty-btn" onClick={() => updateQuantity(i, it.quantity - 1)}>−</button>
                  <span className="mono">{it.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(i, it.quantity + 1)}>+</button>
                  <button className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>Remove</button>
                </div>
              </div>
              <div className="price">${(it.unitPrice * it.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Delivery address</h3>
          <div className="field">
            <label>Street</label>
            <input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>City</label>
              <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            </div>
            <div className="field">
              <label>State</label>
              <input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
            </div>
            <div className="field">
              <label>ZIP</label>
              <input value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card" style={{ position: "sticky", top: 90 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Summary</h3>
          <Row label="Subtotal" value={subtotal} />
          <Row label="Delivery fee" value={DELIVERY_FEE} />
          <Row label="Tax" value={tax} />
          <div style={{ borderTop: "1px solid rgba(246,239,225,0.1)", margin: "10px 0" }} />
          <Row label="Total" value={total} bold />

          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", marginBottom: 8 }}>Payment method</label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="radio" name="pm" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
              <span>Cash on delivery</span>
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <input type="radio" name="pm" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} />
              <span>Pay by card (simulated)</span>
            </label>
          </div>

          {error && <p className="error-text" style={{ marginTop: 10 }}>{error}</p>}
          {!user && <p className="tag" style={{ marginTop: 10 }}>Log in to place your order.</p>}

          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={placing} onClick={handlePlaceOrder}>
            {placing ? "Placing order…" : user ? "Place order" : "Log in to order"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: bold ? 700 : 400 }}>
      <span>{label}</span>
      <span className="mono">${value.toFixed(2)}</span>
    </div>
  );
}
