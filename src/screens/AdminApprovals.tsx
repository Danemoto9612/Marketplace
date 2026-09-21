import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View, FlatList, Button, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";

import Screen from "../components/Screen";
import { listarPendientes, activarCuenta } from "../repositories/loginRepository";
import { Login, Rol } from "../types/models";

export default function AdminApprovals() {
  const db = useSQLiteContext();
  const [pendientes, setPendientes] = useState<Login[]>([]);
  const [cargando, setCargando] = useState(true);
  const [rolSeleccionado, setRolSeleccionado] = useState<Record<number, Rol>>({});
  const [procesando, setProcesando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const lista = await listarPendientes(db);
      setPendientes(lista);
    } finally {
      setCargando(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const elegirRol = (idLogin: number, rol: Rol) => {
    setRolSeleccionado((prev) => ({ ...prev, [idLogin]: rol }));
  };

  const handleActivar = async (login: Login) => {
    const rol = rolSeleccionado[login.id];
    if (!rol) {
      Alert.alert("Selecciona un rol", "Debes elegir Admin o Cliente antes de activar la cuenta.");
      return;
    }
    setProcesando(login.id);
    try {
      await activarCuenta(db, login.id, rol);
      await cargar();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo activar la cuenta.");
    } finally {
      setProcesando(null);
    }
  };

  return (
    <Screen title="Aprobaciones" subtitle={`${pendientes.length} cuenta(s) pendiente(s)`}>
      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={pendientes}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.vacio}>No hay cuentas pendientes por aprobar.</Text>
          }
          renderItem={({ item }) => {
            const seleccion = rolSeleccionado[item.id];
            return (
              <View style={styles.card}>
                <Text style={styles.correo}>{item.correo}</Text>
                <View style={styles.filaRoles}>
                  <BotonRol
                    label="Cliente"
                    activo={seleccion === "Cliente"}
                    onPress={() => elegirRol(item.id, "Cliente")}
                  />
                  <BotonRol
                    label="Admin"
                    activo={seleccion === "Admin"}
                    onPress={() => elegirRol(item.id, "Admin")}
                  />
                </View>
                {procesando === item.id ? (
                  <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />
                ) : (
                  <Button title="Activar cuenta" onPress={() => handleActivar(item)} />
                )}
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}

function BotonRol({ label, activo, onPress }: { label: string; activo: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.botonRol, activo && styles.botonRolActivo]} onPress={onPress}>
      <Text style={[styles.botonRolTexto, activo && styles.botonRolTextoActivo]}>{label}</Text>
    </TouchableOpacity>
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
    padding: 14,
    marginBottom: 12,
  },
  correo: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
  },
  filaRoles: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  botonRol: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: "center",
  },
  botonRolActivo: {
    backgroundColor: "#4ade80",
    borderColor: "#4ade80",
  },
  botonRolTexto: {
    color: "#ccc",
  },
  botonRolTextoActivo: {
    color: "#000",
    fontWeight: "bold",
  },
});
