import { StyleSheet, View, Image } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';

import RegisterForm from '../components/RegisterForm';

export default function Register() {
  const navigation = useNavigation<any>();

  // A diferencia del login, registrarse NO autentica: la cuenta queda
  // "Pendiente" hasta que un admin la active (HU-01/HU-02), así que aquí sí
  // hay que volver manualmente a la pantalla de Login.
  function handleRegisterSuccess() {
    navigation.navigate('Login');
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.image}
      />
      <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  image: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginTop: 20,
  },
});
