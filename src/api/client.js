const BASE = "/api/v1";

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || data.errors?.[0]?.msg || "Request failed";
    const details = data.details ? `: ${data.details}` : "";
    throw new Error(message + details);
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/auth/me", { token }),

  listRestaurants: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/restaurants${qs ? `?${qs}` : ""}`);
  },
  getRestaurant: (id) => request(`/restaurants/${id}`),
  createRestaurant: (payload, token) => request("/restaurants", { method: "POST", body: payload, token }),
  updateRestaurant: (id, payload, token) => request(`/restaurants/${id}`, { method: "PUT", body: payload, token }),
  addMenuItem: (id, payload, token) => request(`/restaurants/${id}/menu`, { method: "POST", body: payload, token }),
  updateMenuItem: (restaurantId, itemId, payload, token) =>
    request(`/restaurants/${restaurantId}/menu/${itemId}`, { method: "PUT", body: payload, token }),
  deleteMenuItem: (restaurantId, itemId, token) => request(`/restaurants/${restaurantId}/menu/${itemId}`, { method: "DELETE", token }),

  placeOrder: (payload, token) => request("/orders", { method: "POST", body: payload, token }),
  chargePayment: (payload, token) => request("/payments/charge", { method: "POST", body: payload, token }),
  deliveryOrders: (token) => request("/orders/delivery", { token }),
  myOrders: (token) => request("/orders/mine", { token }),
  restaurantOrders: (restaurantId, token) => request(`/orders/restaurant/${restaurantId}`, { token }),
  getOrder: (id, token) => request(`/orders/${id}`, { token }),
  updateOrderStatus: (id, status, token) =>
    request(`/orders/${id}/status`, { method: "PUT", body: { status }, token }),
  reviewOrder: (id, payload, token) => request(`/orders/${id}/review`, { method: "POST", body: payload, token }),
};
