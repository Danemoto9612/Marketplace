import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View, FlatList, Button, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";

import Screen from "../components/Screen";
import {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "../repositories/productoRepository";
import { Producto, ProductoInput } from "../types/models";
import ProductFormModal from "../components/ProductFormModal";

function formatoMoneda(valor: number): string {
  return `$${valor.toLocaleString("es-CO")}`;
}

export default function AdminProducts() {
  const db = useSQLiteContext();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);

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
      cargar();
    }, [cargar])
  );

  const abrirNuevo = () => {
    setProductoEditar(null);
    setModalVisible(true);
  };

  const abrirEditar = (producto: Producto) => {
    setProductoEditar(producto);
    setModalVisible(true);
  };

  const handleGuardar = async (datos: ProductoInput) => {
    try {
      if (productoEditar) {
        await actualizarProducto(db, productoEditar.id, datos);
      } else {
        await crearProducto(db, datos);
      }
      setModalVisible(false);
      // Los cambios se reflejan de inmediato en la pantalla de compra del
      // cliente porque Purchase.tsx vuelve a consultar `producto` cada vez
      // que recibe foco (useFocusEffect), no mantiene una copia cacheada.
      await cargar();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo guardar el producto.");
    }
  };

  const handleEliminar = (producto: Producto) => {
    Alert.alert(
      "Eliminar producto",
      `¿Seguro que quieres eliminar "${producto.nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarProducto(db, producto.id);
              await cargar();
            } catch (error) {
              Alert.alert(
                "No se pudo eliminar",
                error instanceof Error ? error.message : "Error desconocido."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <Screen title="Productos" subtitle={`${productos.length} en catálogo`}>
      <View style={styles.header}>
        <Button title="+ Nuevo producto" onPress={abrirNuevo} />
      </View>

      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.vacio}>No hay productos.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombre}>{item.nombre}</Text>
                {!!item.descripcion && (
                  <Text style={styles.descripcion}>{item.descripcion}</Text>
                )}
                <Text style={styles.detalle}>
                  Stock: {item.stock} · {formatoMoneda(item.valorUnitario)}
                </Text>
              </View>
              <View style={styles.acciones}>
                <Button title="Editar" onPress={() => abrirEditar(item)} />
                <View style={{ height: 6 }} />
                <Button title="Eliminar" color="#ef4444" onPress={() => handleEliminar(item)} />
              </View>
            </View>
          )}
        />
      )}

      <ProductFormModal
        visible={modalVisible}
        productoEditar={productoEditar}
        onCancelar={() => setModalVisible(false)}
        onGuardar={handleGuardar}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  vacio: {
    color: "#888",
    textAlign: "center",
    marginTop: 30,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
  },
  nombre: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  descripcion: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  detalle: {
    color: "#ccc",
    marginTop: 6,
    fontSize: 13,
  },
  acciones: {
    justifyContent: "center",
    marginLeft: 8,
  },
});
