import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../api/socket";

const NEXT_STATUS = {
  placed: "confirmed",
  confirmed: "in_preparation",
  in_preparation: "out_for_delivery",
  out_for_delivery: "fulfilled",
};
const LABELS = {
  placed: "Placed",
  confirmed: "Confirmed",
  in_preparation: "In preparation",
  out_for_delivery: "Out for delivery",
  fulfilled: "Delivered",
  cancelled: "Cancelled",
};

export default function MerchantDashboard() {
  const { user, token } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({ name: "", cuisine: "", priceTier: 2 });
  const [menuForm, setMenuForm] = useState({ name: "", category: "Main", description: "", price: "", isAvailable: true });
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);

  const restaurantId = user?.restaurant;
  const orderCount = orders.length;
  const hasRestaurant = Boolean(restaurantId);

  const cuisinesText = useMemo(() => (restaurant?.cuisine || []).join(", "), [restaurant]);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    Promise.all([api.getRestaurant(restaurantId), api.restaurantOrders(restaurantId, token)])
      .then(([restaurantData, orderData]) => {
        setRestaurant(restaurantData.restaurant);
        setOrders(orderData.orders);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    const socket = getSocket(token);
    socket.emit("join:restaurant", restaurantId);

    function refreshOrders() {
      api.restaurantOrders(restaurantId, token).then((data) => setOrders(data.orders)).catch(() => {});
    }

    socket.on("order:new", refreshOrders);
    return () => {
      socket.off("order:new", refreshOrders);
    };
  }, [restaurantId, token]);

  if (loading) return <div className="app-shell"><p className="tag">Loading restaurant dashboard…</p></div>;

  // If the merchant has a restaurant id but the restaurant document hasn't been loaded yet,
  // show a friendly loading state instead of rendering and causing `restaurant.menu` errors.
  if (restaurantId && !restaurant) return <div className="app-shell"><p className="tag">Loading restaurant details…</p></div>;

  async function refreshRestaurant() {
    if (!restaurantId) return;
    try {
      const { restaurant: updated } = await api.getRestaurant(restaurantId);
      setRestaurant(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function advanceStatus(order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      await api.updateOrderStatus(order._id, next, token);
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: next } : o)));
      refreshRestaurant();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleOpen() {
    if (!restaurant) return;
    try {
      await api.updateRestaurant(restaurantId, { isOpen: !restaurant.isOpen }, token);
      setRestaurant((prev) => ({ ...prev, isOpen: !prev.isOpen }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateRestaurant(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.createRestaurant(
        {
          name: newRestaurant.name,
          cuisine: newRestaurant.cuisine.split(",").map((c) => c.trim()).filter(Boolean),
          priceTier: Number(newRestaurant.priceTier),
          location: { type: "Point", coordinates: [78.088, 27.8974] },
          isOpen: true,
        },
        token
      );
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function resetMenuForm() {
    setMenuForm({ name: "", category: "Main", description: "", price: "", isAvailable: true });
    setEditingMenuItemId(null);
  }

  async function handleMenuSubmit(e) {
    e.preventDefault();
    if (!menuForm.name || !menuForm.price) {
      setError("Menu item name and price are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: menuForm.name,
        description: menuForm.description,
        category: menuForm.category,
        price: Number(menuForm.price),
        isAvailable: menuForm.isAvailable,
      };

      if (editingMenuItemId) {
        await api.updateMenuItem(restaurantId, editingMenuItemId, payload, token);
      } else {
        await api.addMenuItem(restaurantId, payload, token);
      }
      await refreshRestaurant();
      resetMenuForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditMenu(item) {
    setEditingMenuItemId(item._id);
    setMenuForm({
      name: item.name,
      category: item.category || "Main",
      description: item.description || "",
      price: item.price?.toString() || "",
      isAvailable: item.isAvailable,
    });
  }

  async function handleDeleteMenu(itemId) {
    setSaving(true);
    setError("");
    try {
      await api.deleteMenuItem(restaurantId, itemId, token);
      await refreshRestaurant();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <div className="app-shell"><p className="tag">Log in as a merchant to continue.</p></div>;
  if (user.role !== "merchant" && user.role !== "admin") return <div className="app-shell"><p className="tag">This page is for restaurant owners only.</p></div>;

  if (!restaurantId) {
    return (
      <div className="app-shell" style={{ maxWidth: 520, paddingTop: 40 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Set up your restaurant</h2>
        <form className="card" onSubmit={handleCreateRestaurant}>
          <div className="field">
            <label>Restaurant name</label>
            <input value={newRestaurant.name} onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>Cuisines (comma separated)</label>
            <input value={newRestaurant.cuisine} onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisine: e.target.value })} placeholder="Indian, North Indian" />
          </div>
          <div className="field">
            <label>Price tier (1–4)</label>
            <input type="number" min={1} max={4} value={newRestaurant.priceTier} onChange={(e) => setNewRestaurant({ ...newRestaurant, priceTier: e.target.value })} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={saving}>{saving ? "Creating…" : "Create restaurant"}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ paddingTop: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>Kitchen dashboard</h2>
          <p className="tag">{restaurant?.name} • {cuisinesText} • {"$".repeat(restaurant?.priceTier || 1)}</p>
        </div>
        <button className="btn btn-primary" onClick={toggleOpen} disabled={saving}>
          {restaurant?.isOpen ? "Mark closed" : "Reopen kitchen"}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: 20, marginTop: 20 }}>
        <section>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Menu management</h3>
            <form onSubmit={handleMenuSubmit}>
              <div className="field">
                <label>Item name</label>
                <input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Category</label>
                <input value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} />
              </div>
              <div className="field">
                <label>Description</label>
                <input value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} />
              </div>
              <div className="field">
                <label>Price</label>
                <input type="number" min="0" step="0.1" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} required />
              </div>
              <div className="field">
                <label>
                  <input type="checkbox" checked={menuForm.isAvailable} onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })} />
                  {' '}Available
                </label>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {editingMenuItemId ? "Save item" : "Add menu item"}
                </button>
                {editingMenuItemId && (
                  <button className="btn btn-ghost" type="button" onClick={resetMenuForm}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Current menu</h3>
            {restaurant?.menu?.length === 0 ? (
              <p className="tag">No menu items yet. Add your first dish above.</p>
            ) : (
              (restaurant?.menu || []).map((item) => (
                <div key={item._id} className="card card-hover" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name} <span className="tag">${item.price.toFixed(2)}</span></div>
                    <div className="tag">{item.category}</div>
                    {item.description && <div className="tag" style={{ marginTop: 6 }}>{item.description}</div>}
                    <div className="tag" style={{ marginTop: 6 }}>{item.isAvailable ? "Available" : "Unavailable"}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => handleEditMenu(item)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => handleDeleteMenu(item._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <aside>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Restaurant summary</h3>
            <p className="tag">Status: {restaurant?.isOpen ? "Open" : "Closed"}</p>
            <p className="tag">Price tier: {'$'.repeat(restaurant?.priceTier || 1)}</p>
            <p className="tag">Orders in queue: {orderCount}</p>
            {restaurant?.address?.city && <p className="tag">Location: {restaurant.address.city}</p>}
          </div>

          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Incoming orders</h3>
            {orders.length === 0 ? (
              <p className="tag">No orders have arrived yet.</p>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="card" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>#{order._id.slice(-6).toUpperCase()}</div>
                      <div className="tag">{LABELS[order.status]}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="price">${order.total.toFixed(2)}</div>
                      {NEXT_STATUS[order.status] && (
                        <button className="btn btn-primary btn-sm" type="button" onClick={() => advanceStatus(order)}>
                          {LABELS[NEXT_STATUS[order.status]]}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
