import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import AppMenu from "./AppMenu";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  ocultarCerrarSesion?: boolean;
}

// Envuelve toda pantalla autenticada: encabezado consistente (título +
// cerrar sesión) + contenido + menú inferior fijo con las secciones según
// el rol. Así se garantiza el mismo menú y el mismo look en todas las
// pantallas de la app (criterio de diseño de la rúbrica).
export default function Screen({ title, subtitle, children, ocultarCerrarSesion }: Props) {
  const insets = useSafeAreaInsets();
  const { cerrarSesion } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitulo}>{subtitle}</Text>}
        </View>
        {!ocultarCerrarSesion && (
          <TouchableOpacity onPress={cerrarSesion}>
            <Text style={styles.cerrarSesion}>Cerrar sesión</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.contenido}>{children}</View>

      <View style={{ paddingBottom: insets.bottom }}>
        <AppMenu />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  titulo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitulo: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  cerrarSesion: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "bold",
  },
  contenido: {
    flex: 1,
    padding: 16,
  },
});
