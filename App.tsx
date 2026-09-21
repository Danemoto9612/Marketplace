import React, { Suspense } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SQLiteProvider } from "expo-sqlite";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DATABASE_NAME, migrateDbIfNeeded } from "./src/database/database";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";

import Login from "./src/screens/Login";
import Register from "./src/screens/Register";
import Home from "./src/screens/Home";
import Profile from "./src/screens/Profile";
import Purchase from "./src/screens/Purchase";
import AdminApprovals from "./src/screens/AdminApprovals";
import AdminClients from "./src/screens/AdminClients";
import AdminProducts from "./src/screens/AdminProducts";
import AdminPurchases from "./src/screens/AdminPurchases";

const Stack = createNativeStackNavigator();

function CargandoPantalla({ mensaje }: { mensaje: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color="#fff" size="large" />
      <Text style={{ color: "#fff", marginTop: 10 }}>{mensaje}</Text>
    </View>
  );
}

function RootNavigator() {
  const { sesion, esAdmin, perfilIncompleto, cargandoInicial } = useAuth();

  // Rehidratando la sesión guardada en SQLite (persistencia entre
  // reinicios de la app) antes de decidir qué stack mostrar.
  if (cargandoInicial) {
    return <CargandoPantalla mensaje="Restaurando sesión..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!sesion ? (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
        </>
      ) : esAdmin ? (
        <>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="AdminApprovals" component={AdminApprovals} />
          <Stack.Screen name="AdminClients" component={AdminClients} />
          <Stack.Screen name="AdminProducts" component={AdminProducts} />
          <Stack.Screen name="AdminPurchases" component={AdminPurchases} />
        </>
      ) : perfilIncompleto ? (
        // HU-03: en el primer ingreso como Cliente, solo puede ver/llenar
        // su perfil; el resto de la app se habilita al completarlo.
        <Stack.Screen name="Profile" component={Profile} />
      ) : (
        <>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="Purchase" component={Purchase} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Suspense fallback={<CargandoPantalla mensaje="Preparando base de datos..." />}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded} useSuspense>
          <AuthProvider>
            <CartProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </CartProvider>
          </AuthProvider>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}
