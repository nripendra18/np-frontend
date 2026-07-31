import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantName, setRestaurantName] = useState(null);
  const [items, setItems] = useState([]); // { menuItemId, name, unitPrice, quantity, selectedModifiers }

  function addItem(restaurant, menuItem, quantity, selectedModifiers = []) {
    // Switching restaurants clears the cart — a single active order per restaurant
    if (restaurantId && restaurantId !== restaurant._id) {
      const confirmSwitch = window.confirm(
        `Your cart has items from ${restaurantName}. Start a new cart for ${restaurant.name}?`
      );
      if (!confirmSwitch) return;
      setItems([]);
    }
    setRestaurantId(restaurant._id);
    setRestaurantName(restaurant.name);

    const modifierDelta = selectedModifiers.reduce((s, m) => s + (m.priceDelta || 0), 0);
    setItems((prev) => [
      ...prev,
      {
        menuItemId: menuItem._id,
        name: menuItem.name,
        unitPrice: menuItem.price + modifierDelta,
        quantity,
        selectedModifiers,
      },
    ]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuantity(index, quantity) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, quantity: Math.max(1, quantity) } : it))
    );
  }

  function clearCart() {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
  }

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.unitPrice * it.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ restaurantId, restaurantName, items, addItem, removeItem, updateQuantity, clearCart, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
