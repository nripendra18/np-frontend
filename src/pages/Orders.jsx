import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const LABELS = {
  placed: "Placed",
  confirmed: "Confirmed",
  in_preparation: "In preparation",
  out_for_delivery: "Out for delivery",
  fulfilled: "Delivered",
  cancelled: "Cancelled",
};

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.myOrders(token).then((data) => setOrders(data.orders));
  }, [token]);

  return (
    <div className="app-shell" style={{ paddingTop: 32 }}>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>My orders</h2>
      {orders.length === 0 && <p className="tag">No orders yet.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {orders.map((o) => (
          <Link to={`/orders/${o._id}`} key={o._id} className="card card-hover" style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600 }}>#{o._id.slice(-8).toUpperCase()}</div>
              <div className="tag">{new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="price">${o.total.toFixed(2)}</div>
              <span className="badge">{LABELS[o.status] || o.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
