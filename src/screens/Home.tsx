import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View, Button, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";

import { useAuth } from "../context/AuthContext";
import Screen from "../components/Screen";
import { listarPendientes } from "../repositories/loginRepository";
import { listar as listarClientes } from "../repositories/clienteRepository";
import { listarProductos } from "../repositories/productoRepository";
import { listarTodasLasCompras, listarComprasPorCliente } from "../repositories/compraRepository";

interface StatsAdmin {
  pendientes: number;
  clientes: number;
  productos: number;
  compras: number;
}

export default function Home() {
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();
  const { sesion, esAdmin, perfilIncompleto } = useAuth();

  const [statsAdmin, setStatsAdmin] = useState<StatsAdmin | null>(null);
  const [comprasCliente, setComprasCliente] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      if (esAdmin) {
        const [pendientes, clientes, productos, compras] = await Promise.all([
          listarPendientes(db),
          listarClientes(db),
          listarProductos(db),
          listarTodasLasCompras(db),
        ]);
        setStatsAdmin({
          pendientes: pendientes.length,
          clientes: clientes.length,
          productos: productos.length,
          compras: compras.length,
        });
      } else if (sesion?.cliente && !perfilIncompleto) {
        const compras = await listarComprasPorCliente(db, sesion.cliente.id);
        setComprasCliente(compras.length);
      }
    } finally {
      setCargando(false);
    }
  }, [db, esAdmin, sesion, perfilIncompleto]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  if (!sesion) return null;

  return (
    <Screen title={esAdmin ? "Panel administrador" : "Inicio"} subtitle={sesion.correo}>
      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
      ) : esAdmin ? (
        <View>
          <Text style={styles.saludo}>Bienvenido, administrador</Text>
          <View style={styles.grid}>
            <Tarjeta titulo="Pendientes por activar" valor={statsAdmin?.pendientes ?? 0} />
            <Tarjeta titulo="Clientes registrados" valor={statsAdmin?.clientes ?? 0} />
            <Tarjeta titulo="Productos en catálogo" valor={statsAdmin?.productos ?? 0} />
            <Tarjeta titulo="Compras realizadas" valor={statsAdmin?.compras ?? 0} />
          </View>
          {!!statsAdmin?.pendientes && (
            <View style={{ marginTop: 16 }}>
              <Button
                title={`Revisar ${statsAdmin.pendientes} cuenta(s) pendiente(s)`}
                onPress={() => navigation.navigate("AdminApprovals")}
              />
            </View>
          )}
        </View>
      ) : perfilIncompleto ? (
        <View>
          <Text style={styles.saludo}>¡Bienvenido!</Text>
          <Text style={styles.texto}>
            Antes de poder comprar necesitas completar tus datos personales
            (nombre, apellido y correo).
          </Text>
          <View style={{ marginTop: 12 }}>
            <Button title="Completar mis datos" onPress={() => navigation.navigate("Profile")} />
          </View>
        </View>
      ) : (
        <View>
          <Text style={styles.saludo}>
            Hola, {sesion.cliente?.nombre} {sesion.cliente?.apellido}
          </Text>
          <Text style={styles.texto}>
            {comprasCliente === 0
              ? "Todavía no has hecho ninguna compra."
              : `Tienes ${comprasCliente} compra(s) realizada(s).`}
          </Text>
          <View style={{ marginTop: 12 }}>
            <Button title="Ir a comprar" onPress={() => navigation.navigate("Purchase")} />
          </View>
        </View>
      )}
    </Screen>
  );
}

function Tarjeta({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <View style={styles.tarjeta}>
      <Text style={styles.tarjetaValor}>{valor}</Text>
      <Text style={styles.tarjetaTitulo}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  saludo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  texto: {
    color: "#aaa",
    fontSize: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  tarjeta: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 14,
    width: "47%",
  },
  tarjetaValor: {
    color: "#4ade80",
    fontSize: 24,
    fontWeight: "bold",
  },
  tarjetaTitulo: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
  },
});
