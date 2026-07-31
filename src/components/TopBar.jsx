import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function TopBar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const itemCount = items.reduce((s, it) => s + it.quantity, 0);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">Tiffin</span>
          <span className="brand-tag">local kitchens</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Browse</Link>
          {user?.role === "customer" && <Link to="/orders">My orders</Link>}
          {(user?.role === "merchant" || user?.role === "admin") && (
            <Link to="/merchant">Kitchen dashboard</Link>
          )}
          {user?.role === "delivery_agent" && (
            <Link to="/deliveries">Delivery dashboard</Link>
          )}
          {!user && <Link to="/login">Log in</Link>}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {itemCount > 0 && (
            <button className="cart-pill" onClick={() => navigate("/checkout")}>
              🧺 {itemCount}
            </button>
          )}
          {user ? (
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              {user.name.split(" ")[0]} · Log out
            </button>
          ) : (
            <Link to="/register" className="btn btn-primary btn-sm">
              Sign up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
