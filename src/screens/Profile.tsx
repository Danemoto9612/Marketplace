import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View, TextInput, Button, Alert, FlatList, ActivityIndicator } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";

import { useAuth } from "../context/AuthContext";
import Screen from "../components/Screen";
import { listarComprasPorCliente } from "../repositories/compraRepository";
import { EncabezadoConDetalle } from "../types/models";

interface FormValues {
  nombre: string;
  apellido: string;
  correo: string;
}

function formatoMoneda(valor: number): string {
  return `$${valor.toLocaleString("es-CO")}`;
}

export default function Profile() {
  const db = useSQLiteContext();
  const { sesion, perfilIncompleto, guardarPerfil, cargando } = useAuth();
  const [compras, setCompras] = useState<EncabezadoConDetalle[]>([]);
  const [cargandoCompras, setCargandoCompras] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      nombre: sesion?.cliente?.nombre ?? "",
      apellido: sesion?.cliente?.apellido ?? "",
      correo: sesion?.cliente?.correo ?? sesion?.correo ?? "",
    },
  });

  // Si el correo de sesión cambia (poco común) o al montar, sincroniza el
  // formulario con los datos actuales del cliente.
  useEffect(() => {
    reset({
      nombre: sesion?.cliente?.nombre ?? "",
      apellido: sesion?.cliente?.apellido ?? "",
      correo: sesion?.cliente?.correo ?? sesion?.correo ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion?.cliente?.id]);

  const cargarCompras = useCallback(async () => {
    if (!sesion?.cliente || perfilIncompleto) return;
    setCargandoCompras(true);
    try {
      const lista = await listarComprasPorCliente(db, sesion.cliente.id);
      setCompras(lista);
    } finally {
      setCargandoCompras(false);
    }
  }, [db, sesion, perfilIncompleto]);

  useFocusEffect(
    useCallback(() => {
      cargarCompras();
    }, [cargarCompras])
  );

  const onSubmit = async (data: FormValues) => {
    try {
      await guardarPerfil(data);
      Alert.alert("Datos guardados correctamente");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo guardar.");
    }
  };

  if (!sesion) return null;

  return (
    <Screen title="Mi cuenta" subtitle={sesion.correo}>
      <FlatList
        data={perfilIncompleto ? [] : compras}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
            {perfilIncompleto && (
              <Text style={styles.alerta}>
                Completa tus datos para poder empezar a comprar.
              </Text>
            )}

            <Text style={styles.label}>Nombre</Text>
            <Controller
              control={control}
              name="nombre"
              rules={{ required: "El nombre es obligatorio" }}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholderTextColor="#888"
                />
              )}
            />
            {errors.nombre && <Text style={styles.error}>{errors.nombre.message}</Text>}

            <Text style={styles.label}>Apellido</Text>
            <Controller
              control={control}
              name="apellido"
              rules={{ required: "El apellido es obligatorio" }}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholderTextColor="#888"
                />
              )}
            />
            {errors.apellido && <Text style={styles.error}>{errors.apellido.message}</Text>}

            <Text style={styles.label}>Correo</Text>
            <Controller
              control={control}
              name="correo"
              rules={{
                required: "El correo es obligatorio",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Correo no válido" },
              }}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#888"
                />
              )}
            />
            {errors.correo && <Text style={styles.error}>{errors.correo.message}</Text>}

            {cargando ? (
              <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />
            ) : (
              <Button title="Guardar" onPress={handleSubmit(onSubmit)} />
            )}

            {!perfilIncompleto && (
              <>
                <Text style={[styles.label, { marginTop: 24, fontSize: 16 }]}>Mis compras</Text>
                {cargandoCompras && <ActivityIndicator color="#fff" />}
                {!cargandoCompras && compras.length === 0 && (
                  <Text style={styles.vacio}>Todavía no tienes compras.</Text>
                )}
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.compraCard}>
            <Text style={styles.compraFecha}>{new Date(item.fecha).toLocaleString("es-CO")}</Text>
            {item.detalles.map((d) => (
              <Text key={d.id} style={styles.compraLinea}>
                {d.cantidad} x {d.nombreProducto} — {formatoMoneda(d.subtotal)}
              </Text>
            ))}
            <Text style={styles.compraTotal}>Total: {formatoMoneda(item.total)}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  alerta: {
    color: "#facc15",
    marginBottom: 12,
  },
  label: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    color: "#fff",
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
  vacio: {
    color: "#888",
    marginTop: 6,
  },
  compraCard: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  compraFecha: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 6,
  },
  compraLinea: {
    color: "#fff",
    fontSize: 13,
  },
  compraTotal: {
    color: "#4ade80",
    fontWeight: "bold",
    marginTop: 6,
  },
});
