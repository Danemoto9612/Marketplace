import React, { useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";

import { Producto } from "../types/models";
import { useCart } from "../context/CartContext";

function formatoMoneda(valor: number): string {
  return `$${valor.toLocaleString("es-CO")}`;
}

export default function ProductCard({ producto }: { producto: Producto }) {
  const { agregarProducto } = useCart();
  const [cantidad, setCantidad] = useState(1);

  const sinStock = producto.stock <= 0;

  const disminuir = () => setCantidad((c) => Math.max(1, c - 1));
  const aumentar = () =>
    setCantidad((c) => Math.min(producto.stock, c + 1));

  const handleAgregar = () => {
    agregarProducto(producto, cantidad);
    setCantidad(1);
  };

  return (
    <View style={[styles.card, sinStock && styles.cardSinStock]}>
      <Text style={styles.nombre}>{producto.nombre}</Text>
      {!!producto.descripcion && (
        <Text style={styles.descripcion}>{producto.descripcion}</Text>
      )}
      <View style={styles.filaInfo}>
        <Text style={styles.precio}>{formatoMoneda(producto.valorUnitario)}</Text>
        <Text style={sinStock ? styles.stockAgotado : styles.stock}>
          {sinStock ? "Sin existencias" : `Stock: ${producto.stock}`}
        </Text>
      </View>

      {!sinStock && (
        <View style={styles.filaAcciones}>
          <View style={styles.stepper}>
            <Button title="-" onPress={disminuir} />
            <Text style={styles.cantidadTexto}>{cantidad}</Text>
            <Button title="+" onPress={aumentar} />
          </View>
          <Button title="Agregar" onPress={handleAgregar} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  cardSinStock: {
    opacity: 0.6,
  },
  nombre: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  descripcion: {
    color: "#aaa",
    fontSize: 13,
    marginTop: 4,
  },
  filaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  precio: {
    color: "#4ade80",
    fontWeight: "bold",
    fontSize: 15,
  },
  stock: {
    color: "#ccc",
    fontSize: 13,
  },
  stockAgotado: {
    color: "#f87171",
    fontSize: 13,
    fontWeight: "bold",
  },
  filaAcciones: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cantidadTexto: {
    color: "#fff",
    fontSize: 16,
    minWidth: 24,
    textAlign: "center",
  },
});
