import { StyleSheet, Text, View, TextInput, Alert, Button, ActivityIndicator } from "react-native";
import React from "react";
import { useForm, Controller } from "react-hook-form";

import { useAuth } from "../context/AuthContext";

interface props {
  onLoginSuccess: () => void;
  onRegisterSuccess: () => void;
}

interface FormValues {
  email: string;
  password: string;
}

export default function LoginForm({ onLoginSuccess, onRegisterSuccess }: props) {
  const { iniciarSesion, cargando } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await iniciarSesion(data.email, data.password);
      onLoginSuccess();
    } catch (error) {
      Alert.alert("No se pudo iniciar sesión", error instanceof Error ? error.message : "Intenta de nuevo.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Correo</Text>
      <Controller
        control={control}
        rules={{ required: "El correo es obligatorio" }}
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
        }}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder="Escribe tu contraseña"
            placeholderTextColor="#888"
            secureTextEntry
            autoCapitalize="none"
          />
        )}
      />
      {errors.password && (
        <Text style={styles.error}>{errors.password.message}</Text>
      )}

      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />
      ) : (
        <Button title="Ingresar" onPress={handleSubmit(onSubmit)} />
      )}
      <View style={{ marginTop: 10 }}>
        <Button title="Crear cuenta nueva" onPress={onRegisterSuccess} />
      </View>
      <Text style={styles.nota}>
        Admin de prueba: admin@gmail.com / 123456
      </Text>
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
  nota: {
    color: "#666",
    fontSize: 12,
    marginTop: 16,
    textAlign: "center",
  },
});
