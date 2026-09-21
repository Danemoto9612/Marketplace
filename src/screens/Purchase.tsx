import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View, FlatList, Button, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Screen from "../components/Screen";
import ProductCard from "../components/ProductCard";
import { listarProductos } from "../repositories/productoRepository";
import { realizarCompra } from "../repositories/compraRepository";
import { Producto } from "../types/models";

function formatoMoneda(valor: number): string {
  return `$${valor.toLocaleString("es-CO")}`;
}

export default function Purchase() {
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();
  const { sesion, perfilIncompleto } = useAuth();
  const { items, total, cambiarCantidad, quitarProducto, vaciarCarrito } = useCart();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const lista = await listarProductos(db);
      setProductos(lista);
    } finally {
      setCargando(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      // Guarda de seguridad además del bloqueo en el menú: si de alguna
      // forma se llega a esta pantalla sin perfil completo, se redirige.
      if (perfilIncompleto) {
        navigation.navigate("Profile");
        return;
      }
      cargar();
    }, [cargar, perfilIncompleto, navigation])
  );

  const handleConfirmar = async () => {
    if (!sesion?.cliente) return;
    setProcesando(true);
    try {
      const resultado = await realizarCompra(db, sesion.cliente.id, items);
      vaciarCarrito();
      await cargar();
      Alert.alert("Compra realizada", `Total pagado: ${formatoMoneda(resultado.total)}`);
    } catch (error) {
      Alert.alert(
        "No se pudo completar la compra",
        error instanceof Error ? error.message : "Error desconocido."
      );
    } finally {
      setProcesando(false);
    }
  };

  if (perfilIncompleto) return null;

  return (
    <Screen title="Comprar" subtitle="Selecciona productos y confirma tu compra">
      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
      ) : productos.length === 0 ? (
        <Text style={styles.vacio}>
          Todavía no hay productos registrados en el sistema. Vuelve más tarde.
        </Text>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => <ProductCard producto={item} />}
          ListFooterComponent={
            items.length > 0 ? (
              <View style={styles.carrito}>
                <Text style={styles.carritoTitulo}>Tu carrito</Text>
                {items.map((item) => (
                  <View key={item.producto.id} style={styles.carritoItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemNombre}>{item.producto.nombre}</Text>
                      <Text style={styles.itemDetalle}>
                        {item.cantidad} x {formatoMoneda(item.producto.valorUnitario)} ={" "}
                        {formatoMoneda(item.cantidad * item.producto.valorUnitario)}
                      </Text>
                    </View>
                    <View style={styles.stepper}>
                      <Button
                        title="-"
                        onPress={() => cambiarCantidad(item.producto.id, item.cantidad - 1)}
                      />
                      <Button title="Quitar" color="#ef4444" onPress={() => quitarProducto(item.producto.id)} />
                    </View>
                  </View>
                ))}
                <Text style={styles.total}>Total: {formatoMoneda(total)}</Text>
                {procesando ? (
                  <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />
                ) : (
                  <Button title="Confirmar compra" onPress={handleConfirmar} />
                )}
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  vacio: {
    color: "#888",
    textAlign: "center",
    marginTop: 30,
  },
  carrito: {
    borderTopWidth: 1,
    borderTopColor: "#222",
    marginTop: 12,
    paddingTop: 12,
  },
  carritoTitulo: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 8,
  },
  carritoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  itemNombre: {
    color: "#fff",
    fontWeight: "bold",
  },
  itemDetalle: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  stepper: {
    flexDirection: "row",
    gap: 4,
  },
  total: {
    color: "#4ade80",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 6,
    marginBottom: 10,
  },
});
