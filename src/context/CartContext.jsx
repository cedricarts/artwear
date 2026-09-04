import { createContext, useState, useMemo } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext(null);

const cartKey = (id, variantId) => `${id}-${variantId ?? "no-variant"}`;

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addToCart = (product, variant = null) => {
    const key      = cartKey(product.id, variant?.id);
    const imageUrl = Array.isArray(product.images)
      ? product.images[0]
      : product.imageUrl ?? "";

    setItems((prev) => {
      const existing = prev.find((item) => cartKey(item.id, item.variantId) === key);
      if (existing) {
        return prev.map((item) =>
          cartKey(item.id, item.variantId) === key
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          variantId: variant?.id ?? "no-variant",
          name: product.name,
          size: variant?.size ?? null,
          color: variant?.color ?? null,
          colorHex: variant?.colorHex ?? null,
          price: product.price,
          imageUrl,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (productId, variantId) => {
    const key = cartKey(productId, variantId);
    setItems((prev) => prev.filter((item) => cartKey(item.id, item.variantId) !== key));
  };

  const updateQuantity = (productId, variantId, quantity) => {
    const key = cartKey(productId, variantId);
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        cartKey(item.id, item.variantId) === key ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value = { items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
