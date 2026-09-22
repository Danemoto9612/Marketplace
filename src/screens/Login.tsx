import { View, Image, StyleSheet } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";

import LoginForm from "../components/LoginForm";

export default function Login() {
  const navigation = useNavigation<any>();

  // El cambio de pantalla hacia Home ocurre solo porque AuthContext cambia
  // `usuario`, y el Navigator raíz (App.tsx) reacciona a eso mostrando el
  // stack de la app en vez del stack de login/registro. No se navega
  // manualmente para evitar condiciones de carrera con react-navigation.
  function handleLoginSuccess() {}

  function handleRegister() {
    navigation.navigate("Register");
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
      />
      <LoginForm onLoginSuccess={handleLoginSuccess} onRegisterSuccess={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  logo: { width: 220, height: 370, alignSelf: "center", marginTop: 100 }
});
