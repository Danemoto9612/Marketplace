import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CartItem, Producto } from "../types/models";

interface CartContextValue {
  items: CartItem[];
  total: number;
  cantidadTotal: number;
  agregarProducto: (producto: Producto, cantidad?: number) => void;
  quitarProducto: (idProducto: number) => void;
  cambiarCantidad: (idProducto: number, cantidad: number) => void;
  vaciarCarrito: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const agregarProducto = useCallback((producto: Producto, cantidad = 1) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id);
      if (existente) {
        const nuevaCantidad = Math.min(
          existente.cantidad + cantidad,
          producto.stock
        );
        return prev.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: nuevaCantidad } : i
        );
      }
      return [...prev, { producto, cantidad: Math.min(cantidad, producto.stock) }];
    });
  }, []);

  const quitarProducto = useCallback((idProducto: number) => {
    setItems((prev) => prev.filter((i) => i.producto.id !== idProducto));
  }, []);

  const cambiarCantidad = useCallback((idProducto: number, cantidad: number) => {
    setItems((prev) => {
      if (cantidad <= 0) {
        return prev.filter((i) => i.producto.id !== idProducto);
      }
      return prev.map((i) =>
        i.producto.id === idProducto
          ? { ...i, cantidad: Math.min(cantidad, i.producto.stock) }
          : i
      );
    });
  }, []);

  const vaciarCarrito = useCallback(() => setItems([]), []);

  const total = useMemo(
    () => items.reduce((acc, i) => acc + i.cantidad * i.producto.valorUnitario, 0),
    [items]
  );

  const cantidadTotal = useMemo(
    () => items.reduce((acc, i) => acc + i.cantidad, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      total,
      cantidadTotal,
      agregarProducto,
      quitarProducto,
      cambiarCantidad,
      vaciarCarrito,
    }),
    [items, total, cantidadTotal, agregarProducto, quitarProducto, cambiarCantidad, vaciarCarrito]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de <CartProvider>.");
  }
  return ctx;
}
