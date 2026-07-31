import { Routes, Route } from "react-router-dom";
import TopBar from "./components/TopBar";
import Home from "./pages/Home";
import RestaurantDetail from "./pages/RestaurantDetail";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MerchantDashboard from "./pages/MerchantDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user } = useAuth();
  return (
    <>
      <TopBar />
      <Routes>
        <Route path="/" element={user ? <Home /> : <Login />} />
        <Route path="/restaurants/:id" element={<RestaurantDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderTracking />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/merchant" element={<MerchantDashboard />} />
        <Route path="/deliveries" element={<DeliveryDashboard />} />
      </Routes>
    </>
  );
}
