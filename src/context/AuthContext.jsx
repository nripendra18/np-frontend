import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("tiffin_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me(token)
      .then(({ user }) => setUser(user))
      .catch(() => {
        setToken(null);
        localStorage.removeItem("tiffin_token");
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Auto-redirect once immediately after login if role requires a dashboard.
  const prevUserRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const prev = prevUserRef.current;
    if (!prev && user) {
      if (user.role === "merchant") navigate("/merchant");
      else if (user.role === "delivery_agent") navigate("/deliveries");
    }
    prevUserRef.current = user;
  }, [user, navigate]);

  function login(nextToken, nextUser) {
    localStorage.setItem("tiffin_token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem("tiffin_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
