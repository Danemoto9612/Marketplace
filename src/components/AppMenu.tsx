import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useAuth } from "../context/AuthContext";

interface ItemMenu {
  screen: string;
  label: string;
}

const ITEMS_ADMIN: ItemMenu[] = [
  { screen: "Home", label: "Inicio" },
  { screen: "AdminApprovals", label: "Aprobaciones" },
  { screen: "AdminClients", label: "Clientes" },
  { screen: "AdminProducts", label: "Productos" },
  { screen: "AdminPurchases", label: "Compras" },
];

const ITEMS_CLIENTE: ItemMenu[] = [
  { screen: "Home", label: "Inicio" },
  { screen: "Profile", label: "Mi cuenta" },
  { screen: "Purchase", label: "Comprar" },
];

export default function AppMenu() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { esAdmin, perfilIncompleto } = useAuth();

  const items = esAdmin ? ITEMS_ADMIN : ITEMS_CLIENTE;

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const activo = route.name === item.screen;
        // Mientras el perfil del cliente esté incompleto, solo puede
        // moverse a "Mi cuenta" (HU-03: debe completar sus datos primero).
        const bloqueado = perfilIncompleto && item.screen !== "Profile";
        return (
          <TouchableOpacity
            key={item.screen}
            style={styles.item}
            disabled={bloqueado}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text
              style={[
                styles.label,
                activo && styles.labelActivo,
                bloqueado && styles.labelBloqueado,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#222",
    backgroundColor: "#0a0a0a",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  label: {
    color: "#aaa",
    fontSize: 12,
    textAlign: "center",
  },
  labelActivo: {
    color: "#4ade80",
    fontWeight: "bold",
  },
  labelBloqueado: {
    color: "#444",
  },
});
