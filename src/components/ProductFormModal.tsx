import React, { useEffect } from "react";
import { Modal, StyleSheet, Text, View, TextInput, Button, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";

import { Producto, ProductoInput } from "../types/models";

interface Props {
  visible: boolean;
  productoEditar: Producto | null;
  onCancelar: () => void;
  onGuardar: (datos: ProductoInput) => void;
}

interface FormValues {
  nombre: string;
  descripcion: string;
  stock: string;
  valorUnitario: string;
}

const valoresVacios: FormValues = {
  nombre: "",
  descripcion: "",
  stock: "",
  valorUnitario: "",
};

export default function ProductFormModal({
  visible,
  productoEditar,
  onCancelar,
  onGuardar,
}: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: valoresVacios });

  useEffect(() => {
    if (visible) {
      reset(
        productoEditar
          ? {
              nombre: productoEditar.nombre,
              descripcion: productoEditar.descripcion ?? "",
              stock: String(productoEditar.stock),
              valorUnitario: String(productoEditar.valorUnitario),
            }
          : valoresVacios
      );
    }
  }, [visible, productoEditar, reset]);

  const onSubmit = (data: FormValues) => {
    onGuardar({
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      stock: Number(data.stock),
      valorUnitario: Number(data.valorUnitario),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancelar}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView>
            <Text style={styles.titulo}>
              {productoEditar ? "Editar producto" : "Nuevo producto"}
            </Text>

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
                  placeholder="Nombre del producto"
                  placeholderTextColor="#888"
                />
              )}
            />
            {errors.nombre && <Text style={styles.error}>{errors.nombre.message}</Text>}

            <Text style={styles.label}>Descripción</Text>
            <Controller
              control={control}
              name="descripcion"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[styles.input, { height: 70 }]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Descripción (opcional)"
                  placeholderTextColor="#888"
                  multiline
                />
              )}
            />

            <Text style={styles.label}>Stock</Text>
            <Controller
              control={control}
              name="stock"
              rules={{
                required: "El stock es obligatorio",
                validate: (v) =>
                  (!isNaN(Number(v)) && Number(v) >= 0) || "Debe ser un número >= 0",
              }}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Cantidad disponible"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                />
              )}
            />
            {errors.stock && <Text style={styles.error}>{errors.stock.message}</Text>}

            <Text style={styles.label}>Valor unitario</Text>
            <Controller
              control={control}
              name="valorUnitario"
              rules={{
                required: "El precio es obligatorio",
                validate: (v) =>
                  (!isNaN(Number(v)) && Number(v) > 0) || "Debe ser un número > 0",
              }}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Valor en pesos"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                />
              )}
            />
            {errors.valorUnitario && (
              <Text style={styles.error}>{errors.valorUnitario.message}</Text>
            )}

            <View style={styles.filaBotones}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Button title="Cancelar" color="#888" onPress={onCancelar} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Guardar" onPress={handleSubmit(onSubmit)} />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 20,
    maxHeight: "85%",
  },
  titulo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
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
  filaBotones: {
    flexDirection: "row",
    marginTop: 10,
  },
});
