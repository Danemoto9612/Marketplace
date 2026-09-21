import type { SQLiteDatabase } from "expo-sqlite";
import { Producto, ProductoInput } from "../types/models";

export async function listarProductos(db: SQLiteDatabase): Promise<Producto[]> {
  return db.getAllAsync<Producto>("SELECT * FROM producto ORDER BY nombre ASC");
}

export async function contarProductos(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    "SELECT COUNT(*) as total FROM producto"
  );
  return row?.total ?? 0;
}

export async function obtenerProducto(db: SQLiteDatabase, id: number): Promise<Producto | null> {
  const producto = await db.getFirstAsync<Producto>("SELECT * FROM producto WHERE id = ?", id);
  return producto ?? null;
}

function validarProducto(datos: ProductoInput) {
  if (!datos.nombre.trim()) {
    throw new Error("El nombre del producto es obligatorio.");
  }
  if (!Number.isInteger(datos.stock) || datos.stock < 0) {
    throw new Error("El stock debe ser un número entero mayor o igual a 0.");
  }
  if (!(datos.valorUnitario > 0)) {
    throw new Error("El valor unitario debe ser un número positivo.");
  }
}

// CRUD completo de productos (HU-07, exclusivo Admin).
export async function crearProducto(
  db: SQLiteDatabase,
  datos: ProductoInput
): Promise<Producto> {
  validarProducto(datos);

  const resultado = await db.runAsync(
    `INSERT INTO producto (nombre, descripcion, valorUnitario, stock) VALUES (?, ?, ?, ?)`,
    datos.nombre.trim(),
    datos.descripcion?.trim() || null,
    datos.valorUnitario,
    datos.stock
  );

  const nuevo = await obtenerProducto(db, resultado.lastInsertRowId);
  if (!nuevo) throw new Error("No se pudo crear el producto.");
  return nuevo;
}

export async function actualizarProducto(
  db: SQLiteDatabase,
  id: number,
  datos: ProductoInput
): Promise<Producto> {
  validarProducto(datos);

  await db.runAsync(
    `UPDATE producto SET nombre = ?, descripcion = ?, valorUnitario = ?, stock = ? WHERE id = ?`,
    datos.nombre.trim(),
    datos.descripcion?.trim() || null,
    datos.valorUnitario,
    datos.stock,
    id
  );

  const actualizado = await obtenerProducto(db, id);
  if (!actualizado) throw new Error("Producto no encontrado.");
  return actualizado;
}

export async function eliminarProducto(db: SQLiteDatabase, id: number): Promise<void> {
  const enCompras = await db.getFirstAsync<{ total: number }>(
    "SELECT COUNT(*) as total FROM detalle WHERE idProducto = ?",
    id
  );
  if (enCompras && enCompras.total > 0) {
    throw new Error("No se puede eliminar: el producto ya tiene compras asociadas.");
  }
  await db.runAsync("DELETE FROM producto WHERE id = ?", id);
}
