import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";

import Screen from "../components/Screen";
import { listarTodasLasCompras } from "../repositories/compraRepository";
import { EncabezadoConCliente } from "../types/models";

function formatoMoneda(valor: number): string {
  return `$${valor.toLocaleString("es-CO")}`;
}

export default function AdminPurchases() {
  const db = useSQLiteContext();
  const [compras, setCompras] = useState<EncabezadoConCliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setCompras(await listarTodasLasCompras(db));
    } finally {
      setCargando(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  return (
    <Screen title="Compras" subtitle={`${compras.length} realizada(s)`}>
      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={compras}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.vacio}>Todavía no hay compras registradas.</Text>}
          renderItem={({ item }) => {
            const abierto = expandido === item.id;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => setExpandido(abierto ? null : item.id)}
              >
                <View style={styles.filaResumen}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cliente}>{item.nombreCliente}</Text>
                    <Text style={styles.fecha}>{new Date(item.fecha).toLocaleString("es-CO")}</Text>
                  </View>
                  <Text style={styles.total}>{formatoMoneda(item.total)}</Text>
                </View>
                {abierto && (
                  <View style={styles.detalleContainer}>
                    {item.detalles.map((d) => (
                      <Text key={d.id} style={styles.detalleLinea}>
                        {d.cantidad} x {d.nombreProducto} — {formatoMoneda(d.subtotal)}
                      </Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
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
  card: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  filaResumen: {
    flexDirection: "row",
    alignItems: "center",
  },
  cliente: {
    color: "#fff",
    fontWeight: "bold",
  },
  fecha: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  total: {
    color: "#4ade80",
    fontWeight: "bold",
  },
  detalleContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  detalleLinea: {
    color: "#ccc",
    fontSize: 13,
    marginBottom: 2,
  },
});
