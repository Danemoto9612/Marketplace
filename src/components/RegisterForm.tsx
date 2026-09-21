import { StyleSheet, Text, View, TextInput, Alert, Button, ActivityIndicator } from "react-native";
import React from "react";
import { useForm, Controller } from "react-hook-form";

import { useAuth } from "../context/AuthContext";

interface props {
  onRegisterSuccess: () => void;
}

interface FormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

// Debe reflejar la misma regla que loginRepository.validarPasswordSeguro:
// mínimo 8 caracteres, una mayúscula y un número.
const PASSWORD_SEGURO_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function RegisterForm({ onRegisterSuccess }: props) {
  const { registrarse, cargando } = useAuth();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: FormValues) => {
    try {
      await registrarse(data.email, data.password);
      Alert.alert(
        "Cuenta creada",
        "Tu cuenta quedó pendiente de aprobación. Un administrador debe activarla y asignarte un rol antes de que puedas ingresar."
      );
      onRegisterSuccess();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo crear la cuenta.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Correo</Text>
      <Controller
        control={control}
        rules={{
          required: "El correo es obligatorio",
          pattern: { value: /^\S+@\S+\.\S+$/, message: "Correo no válido" },
        }}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder="Escribe tu correo"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      <Text style={styles.label}>Contraseña</Text>
      <Controller
        control={control}
        rules={{
          required: "La contraseña es obligatoria",
          pattern: {
            value: PASSWORD_SEGURO_REGEX,
            message: "Mínimo 8 caracteres, una mayúscula y un número",
          },
        }}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
            placeholderTextColor="#888"
            secureTextEntry
            autoCapitalize="none"
          />
        )}
      />
      {errors.password && (<Text style={styles.error}>{errors.password.message}</Text>)}

      <Text style={styles.label}>Confirmar contraseña</Text>
      <Controller
        control={control}
        rules={{
          required: "Confirma tu contraseña",
          validate: (value) => value === password || "Las contraseñas no coinciden",
        }}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder="Repite tu contraseña"
            placeholderTextColor="#888"
            secureTextEntry
            autoCapitalize="none"
          />
        )}
      />
      {errors.confirmPassword && (
        <Text style={styles.error}>{errors.confirmPassword.message}</Text>
      )}

      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />
      ) : (
        <Button title="Registrarme" onPress={handleSubmit(onSubmit)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  label: {
    marginBottom: 5,
    fontWeight: "bold",
    color: "#fff",
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
});
