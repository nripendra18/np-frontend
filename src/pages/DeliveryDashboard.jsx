import { useEffect, useState } from "react";
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

export default function DeliveryDashboard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  async function refresh() {
    if (!token) return;
    try {
      const data = await api.deliveryOrders(token);
      setOrders(data.orders || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!token) return;
    refresh();
  }, [token]);

  return (
    <div className="app-shell" style={{ paddingTop: 32 }}>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Delivery dashboard</h2>
      {error && <p className="error-text">{error}</p>}
      {orders.length === 0 && <p className="tag">No delivery assignments yet.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {orders.map((order) => (
          <div key={order._id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>#{order._id.slice(-8).toUpperCase()}</div>
                <div className="tag">{order.restaurant?.name || "Unknown restaurant"}</div>
                <div className="tag" style={{ marginTop: 6 }}>${order.total.toFixed(2)} • {LABELS[order.status]}</div>

                <div style={{ marginTop: 10 }}>
                  <strong>Items</strong>
                  <div style={{ marginTop: 8 }}>
                    {order.items.map((it) => (
                      <div key={it.menuItemId} style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                          {it.quantity}× {it.name}
                          {it.selectedModifiers?.length > 0 && (
                            <div className="tag" style={{ marginTop: 4 }}>{it.selectedModifiers.map((m) => m.optionName).join(", ")}</div>
                          )}
                        </div>
                        <div className="mono">${it.lineTotal.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <strong>Delivery address</strong>
                  <div className="tag" style={{ marginTop: 6 }}>{order.deliveryAddress?.street}</div>
                  <div className="tag">{order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zip}</div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <strong>Payment</strong>
                  <div className="tag">{order.payment?.provider || 'cod'} · {order.payment?.status}</div>
                  {order.payment?.transactionId && <div className="tag">Txn: {order.payment.transactionId}</div>}
                </div>
              </div>
              <div style={{ width: 180, textAlign: "right" }}>
                <div className="price">{order.deliveryAddress?.city || "Delivery"}</div>
                <div style={{ marginTop: 8, marginBottom: 8 }}>
                  <span className="badge">{order.deliveryAgent ? "Assigned" : "Unassigned"}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {order.status !== 'out_for_delivery' && order.status !== 'fulfilled' && (
                    <button className="btn btn-primary" onClick={async () => { try { await api.updateOrderStatus(order._id, 'out_for_delivery', token); await refresh(); } catch (e) { setError(e.message); } }}>
                      Claim & Pick up
                    </button>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <button className="btn btn-primary" onClick={async () => { try { await api.updateOrderStatus(order._id, 'fulfilled', token); await refresh(); } catch (e) { setError(e.message); } }}>
                      Mark delivered
                    </button>
                  )}
                  <button className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(window.location.origin + `/orders/${order._id}`)}>
                    Copy order link
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
