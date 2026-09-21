import type { SQLiteDatabase } from "expo-sqlite";
import { Cliente, DatosPerfilCliente } from "../types/models";

export async function obtenerPorIdLogin(
  db: SQLiteDatabase,
  idLogin: number
): Promise<Cliente | null> {
  const cliente = await db.getFirstAsync<Cliente>(
    "SELECT * FROM cliente WHERE idLogin = ?",
    idLogin
  );
  return cliente ?? null;
}

export async function obtenerPorId(db: SQLiteDatabase, id: number): Promise<Cliente | null> {
  const cliente = await db.getFirstAsync<Cliente>("SELECT * FROM cliente WHERE id = ?", id);
  return cliente ?? null;
}

// HU-04: admin puede ver el listado completo de clientes.
export async function listar(db: SQLiteDatabase): Promise<Cliente[]> {
  return db.getAllAsync<Cliente>("SELECT * FROM cliente ORDER BY nombre ASC, apellido ASC");
}

// HU-04: el cliente consulta y edita sus propios datos (Nombre, Apellido,
// Correo). También se usa para completar el perfil la primera vez.
export async function actualizarPerfil(
  db: SQLiteDatabase,
  idCliente: number,
  datos: DatosPerfilCliente
): Promise<Cliente> {
  if (!datos.nombre.trim() || !datos.apellido.trim()) {
    throw new Error("Nombre y apellido son obligatorios.");
  }
  if (!/^\S+@\S+\.\S+$/.test(datos.correo.trim())) {
    throw new Error("El correo no tiene un formato válido.");
  }

  await db.runAsync(
    "UPDATE cliente SET nombre = ?, apellido = ?, correo = ? WHERE id = ?",
    datos.nombre.trim(),
    datos.apellido.trim(),
    datos.correo.trim().toLowerCase(),
    idCliente
  );

  const actualizado = await obtenerPorId(db, idCliente);
  if (!actualizado) throw new Error("Cliente no encontrado.");
  return actualizado;
}
