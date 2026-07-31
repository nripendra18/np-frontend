import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../api/socket";
import StatusTicket from "../components/StatusTicket";

export default function OrderTracking() {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    api
      .getOrder(id, token)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err.message));
  }, [id, token]);

  useEffect(() => {
    const socket = getSocket(token);
    socket.emit("join:order", id);

    function onStatus(payload) {
      if (payload.orderId === id) {
        api.getOrder(id, token).then((data) => setOrder(data.order));
      }
    }
    socket.on("order:status", onStatus);
    return () => {
      socket.off("order:status", onStatus);
      socket.emit("leave:order", id);
    };
  }, [id, token]);

  async function submitReview() {
    try {
      await api.reviewOrder(id, { rating, comment }, token);
      setReviewSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <div className="app-shell"><p className="error-text">{error}</p></div>;
  if (!order) return <div className="app-shell"><p className="tag">Loading order…</p></div>;

  return (
    <div className="app-shell" style={{ paddingTop: 32, maxWidth: 480, margin: "0 auto" }}>
      <StatusTicket order={order} />

      {order.status === "fulfilled" && !order.review?.rating && !reviewSubmitted && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>How was it?</h3>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`filter-chip ${rating === n ? "active" : ""}`}
                onClick={() => setRating(n)}
              >
                {n}★
              </button>
            ))}
          </div>
          <textarea
            className="field"
            placeholder="Optional comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            style={{ width: "100%", background: "var(--counter-2)", border: "1px solid rgba(246,239,225,0.12)", borderRadius: 8, color: "var(--paper)", padding: 10 }}
          />
          <button className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={submitReview}>
            Submit review
          </button>
        </div>
      )}
      {(order.review?.rating || reviewSubmitted) && (
        <p className="tag" style={{ marginTop: 16, textAlign: "center" }}>Thanks for the feedback! 🙌</p>
      )}
    </div>
  );
}
