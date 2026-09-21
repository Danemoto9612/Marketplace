import type { SQLiteDatabase } from "expo-sqlite";
import { hashPassword } from "../utils/crypto";
import { Login, Rol } from "../types/models";

// Password "segura": mínimo 8 caracteres, al menos una mayúscula y un
// número (criterio de aceptación de HU-01).
const PASSWORD_SEGURO_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const CORREO_REGEX = /^\S+@\S+\.\S+$/;

export function validarCorreo(correo: string): boolean {
  return CORREO_REGEX.test(correo.trim());
}

export function validarPasswordSeguro(password: string): boolean {
  return PASSWORD_SEGURO_REGEX.test(password);
}

/**
 * Registro de un nuevo visitante (HU-01). Queda en estado "Pendiente" y
 * sin rol asignado hasta que un administrador lo apruebe (HU-02).
 */
export async function registrarLogin(
  db: SQLiteDatabase,
  correo: string,
  password: string
): Promise<Login> {
  const correoNormalizado = correo.trim().toLowerCase();

  if (!validarCorreo(correoNormalizado)) {
    throw new Error("El correo no tiene un formato válido.");
  }
  if (!validarPasswordSeguro(password)) {
    throw new Error(
      "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número."
    );
  }

  const existente = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM login WHERE correo = ?",
    correoNormalizado
  );
  if (existente) {
    throw new Error("Ya existe una cuenta registrada con ese correo.");
  }

  const passwordHasheado = await hashPassword(password);
  const resultado = await db.runAsync(
    `INSERT INTO login (correo, password, estado, rol) VALUES (?, ?, 'Pendiente', NULL)`,
    correoNormalizado,
    passwordHasheado
  );

  const nuevo = await db.getFirstAsync<Login>("SELECT * FROM login WHERE id = ?", resultado.lastInsertRowId);
  if (!nuevo) throw new Error("No se pudo crear la cuenta.");
  return nuevo;
}

/**
 * Valida credenciales y estado de la cuenta (HU-03). Lanza un Error con un
 * mensaje distinto según el motivo del rechazo, para poder mostrarlo tal
 * cual en el formulario de login.
 */
export async function autenticar(
  db: SQLiteDatabase,
  correo: string,
  password: string
): Promise<Login> {
  const correoNormalizado = correo.trim().toLowerCase();
  const passwordHasheado = await hashPassword(password);

  const login = await db.getFirstAsync<Login>(
    "SELECT * FROM login WHERE correo = ? AND password = ?",
    correoNormalizado,
    passwordHasheado
  );

  if (!login) {
    throw new Error("El correo o la contraseña son incorrectos.");
  }
  if (login.estado !== "Activo") {
    throw new Error(
      "Tu cuenta todavía está pendiente de aprobación por un administrador."
    );
  }
  return login;
}

export async function obtenerLoginPorId(
  db: SQLiteDatabase,
  id: number
): Promise<Login | null> {
  const login = await db.getFirstAsync<Login>("SELECT * FROM login WHERE id = ?", id);
  return login ?? null;
}

// ---- HU-02: gestión y activación de cuentas (exclusivo Admin) ----

export async function listarPendientes(db: SQLiteDatabase): Promise<Login[]> {
  return db.getAllAsync<Login>(
    "SELECT * FROM login WHERE estado = 'Pendiente' ORDER BY id ASC"
  );
}

export async function activarCuenta(
  db: SQLiteDatabase,
  idLogin: number,
  rol: Rol
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "UPDATE login SET estado = 'Activo', rol = ? WHERE id = ?",
      rol,
      idLogin
    );

    if (rol === "Cliente") {
      const existente = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM cliente WHERE idLogin = ?",
        idLogin
      );
      if (!existente) {
        const login = await db.getFirstAsync<{ correo: string }>(
          "SELECT correo FROM login WHERE id = ?",
          idLogin
        );
        await db.runAsync(
          "INSERT INTO cliente (idLogin, nombre, apellido, correo) VALUES (?, '', '', ?)",
          idLogin,
          login?.correo ?? ""
        );
      }
    }
  });
}

// ---- Persistencia de sesión (tabla `sesion`, una sola fila) ----

export async function guardarSesion(db: SQLiteDatabase, idLogin: number | null): Promise<void> {
  await db.runAsync("UPDATE sesion SET idLogin = ? WHERE id = 1", idLogin);
}

export async function leerSesionGuardada(db: SQLiteDatabase): Promise<number | null> {
  const row = await db.getFirstAsync<{ idLogin: number | null }>(
    "SELECT idLogin FROM sesion WHERE id = 1"
  );
  return row?.idLogin ?? null;
}
