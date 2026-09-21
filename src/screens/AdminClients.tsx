import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";

import Screen from "../components/Screen";
import { listar } from "../repositories/clienteRepository";
import { Cliente } from "../types/models";

export default function AdminClients() {
  const db = useSQLiteContext();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setClientes(await listar(db));
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
    <Screen title="Clientes" subtitle={`${clientes.length} registrado(s)`}>
      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.vacio}>No hay clientes registrados.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.nombre}>
                {item.nombre || item.apellido
                  ? `${item.nombre} ${item.apellido}`.trim()
                  : "(sin datos personales todavía)"}
              </Text>
              <Text style={styles.correo}>{item.correo}</Text>
            </View>
          )}
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
  nombre: {
    color: "#fff",
    fontWeight: "bold",
  },
  correo: {
    color: "#aaa",
    marginTop: 4,
    fontSize: 13,
  },
});
