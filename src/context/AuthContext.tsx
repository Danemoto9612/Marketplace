import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
  autenticar,
  registrarLogin,
  obtenerLoginPorId,
  guardarSesion,
  leerSesionGuardada,
} from "../repositories/loginRepository";
import { obtenerPorIdLogin, actualizarPerfil } from "../repositories/clienteRepository";
import { Cliente, DatosPerfilCliente, Rol, Sesion, perfilClienteCompleto } from "../types/models";

interface AuthContextValue {
  sesion: Sesion | null;
  cargandoInicial: boolean; // rehidratando sesión guardada al abrir la app
  cargando: boolean; // acción puntual (login/registro/guardar) en curso
  esAdmin: boolean;
  perfilIncompleto: boolean; // rol Cliente sin nombre/apellido aún
  iniciarSesion: (correo: string, password: string) => Promise<void>;
  registrarse: (correo: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  guardarPerfil: (datos: DatosPerfilCliente) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function construirSesion(
  db: ReturnType<typeof useSQLiteContext>,
  idLogin: number,
  correo: string,
  rol: Rol
): Promise<Sesion> {
  let cliente: Cliente | null = null;
  if (rol === "Cliente") {
    cliente = await obtenerPorIdLogin(db, idLogin);
  }
  return { idLogin, correo, rol, cliente };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [cargando, setCargando] = useState(false);

  // Al abrir la app, intenta restaurar la sesión guardada en la tabla
  // `sesion` (persistencia de sesión entre reinicios de la app).
  useEffect(() => {
    (async () => {
      try {
        const idLogin = await leerSesionGuardada(db);
        if (idLogin != null) {
          const login = await obtenerLoginPorId(db, idLogin);
          if (login && login.estado === "Activo" && login.rol) {
            const nuevaSesion = await construirSesion(db, login.id, login.correo, login.rol);
            setSesion(nuevaSesion);
          } else {
            await guardarSesion(db, null);
          }
        }
      } finally {
        setCargandoInicial(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const iniciarSesion = useCallback(
    async (correo: string, password: string) => {
      setCargando(true);
      try {
        const login = await autenticar(db, correo, password);
        if (!login.rol) {
          throw new Error("Tu cuenta no tiene un rol asignado todavía.");
        }
        const nuevaSesion = await construirSesion(db, login.id, login.correo, login.rol);
        setSesion(nuevaSesion);
        await guardarSesion(db, login.id);
      } finally {
        setCargando(false);
      }
    },
    [db]
  );

  const registrarse = useCallback(
    async (correo: string, password: string) => {
      setCargando(true);
      try {
        await registrarLogin(db, correo, password);
        // No se inicia sesión: la cuenta queda "Pendiente" hasta que un
        // administrador la active (HU-01/HU-02).
      } finally {
        setCargando(false);
      }
    },
    [db]
  );

  const cerrarSesion = useCallback(async () => {
    await guardarSesion(db, null);
    setSesion(null);
  }, [db]);

  const guardarPerfil = useCallback(
    async (datos: DatosPerfilCliente) => {
      if (!sesion || !sesion.cliente) return;
      setCargando(true);
      try {
        const actualizado = await actualizarPerfil(db, sesion.cliente.id, datos);
        setSesion({ ...sesion, cliente: actualizado });
      } finally {
        setCargando(false);
      }
    },
    [db, sesion]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      sesion,
      cargandoInicial,
      cargando,
      esAdmin: sesion?.rol === "Admin",
      perfilIncompleto: sesion?.rol === "Cliente" && !perfilClienteCompleto(sesion.cliente),
      iniciarSesion,
      registrarse,
      cerrarSesion,
      guardarPerfil,
    }),
    [sesion, cargandoInicial, cargando, iniciarSesion, registrarse, cerrarSesion, guardarPerfil]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  }
  return ctx;
}
