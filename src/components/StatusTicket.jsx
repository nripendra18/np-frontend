const PIPELINE = [
  { key: "placed", label: "Order placed" },
  { key: "confirmed", label: "Confirmed by kitchen" },
  { key: "in_preparation", label: "In preparation" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "fulfilled", label: "Delivered" },
];

export default function StatusTicket({ order }) {
  if (!order) return null;
  const isCancelled = order.status === "cancelled";
  const activeIndex = PIPELINE.findIndex((p) => p.key === order.status);

  const historyFor = (key) => order.statusHistory?.find((h) => h.status === key);

  return (
    <div className="ticket">
      <div className="ticket-header">
        <span className="display" style={{ fontSize: 18 }}>Order ticket</span>
        <span className="ticket-id">#{order._id.slice(-8).toUpperCase()}</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-faint)" }}>
        {order.items.length} item{order.items.length !== 1 ? "s" : ""} · ${order.total.toFixed(2)}
      </div>

      {order.payment && (
        <div style={{ marginTop: 8, fontSize: 13 }}>
          <div className="tag" style={{ display: "inline-block", marginBottom: 6 }}>
            Payment: {order.payment.provider || "cod"} · <strong>{order.payment.status}</strong>
          </div>
          {order.payment.transactionId && (
            <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 4 }}>Txn: {order.payment.transactionId}</div>
          )}
        </div>
      )}

      {isCancelled ? (
        <div className="status-step cancelled" style={{ marginTop: 18 }}>
          <span className="status-dot" />
          <span className="status-label">Order cancelled</span>
        </div>
      ) : (
        <div className="status-rail">
          {PIPELINE.map((step, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;
            const entry = historyFor(step.key);
            return (
              <div key={step.key}>
                <div className={`status-step ${done ? "done" : ""} ${active ? "active" : ""}`}>
                  <span className="status-dot" />
                  <div className="status-line">
                    <div className="status-label" style={{ color: active || done ? "var(--ink)" : "var(--ink-faint)" }}>
                      {step.label}
                    </div>
                    {entry && (
                      <div className="status-time">{new Date(entry.at).toLocaleTimeString()}</div>
                    )}
                  </div>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className={`status-line-connector ${done ? "done" : ""}`} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
