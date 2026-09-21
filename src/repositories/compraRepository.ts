import type { SQLiteDatabase } from "expo-sqlite";
import {
  CartItem,
  DetalleConProducto,
  EncabezadoConCliente,
  EncabezadoConDetalle,
} from "../types/models";

export interface ResultadoCompra {
  idEncabezado: number;
  total: number;
}

/**
 * HU-06: confirma la compra dentro de una transacción atómica:
 *  - valida existencias (HU-05: no se puede pedir más de lo que hay en stock)
 *  - crea el encabezado (idCliente, fecha, total)
 *  - crea un detalle por cada producto (idEncabezado, idProducto, cantidad, subtotal)
 *  - descuenta el stock de cada producto
 * Si algo falla se lanza un Error y no se modifica nada (rollback automático).
 */
export async function realizarCompra(
  db: SQLiteDatabase,
  idCliente: number,
  items: CartItem[]
): Promise<ResultadoCompra> {
  if (items.length === 0) {
    throw new Error("Debes seleccionar al menos un producto.");
  }

  let resultado: ResultadoCompra | null = null;

  await db.withTransactionAsync(async () => {
    for (const item of items) {
      const producto = await db.getFirstAsync<{ stock: number; nombre: string }>(
        "SELECT stock, nombre FROM producto WHERE id = ?",
        item.producto.id
      );
      if (!producto) {
        throw new Error(`El producto "${item.producto.nombre}" ya no existe.`);
      }
      if (item.cantidad <= 0) {
        throw new Error(`La cantidad de "${producto.nombre}" debe ser mayor a 0.`);
      }
      if (producto.stock < item.cantidad) {
        throw new Error(
          producto.stock === 0
            ? `"${producto.nombre}" no tiene existencias disponibles.`
            : `Solo quedan ${producto.stock} unidades de "${producto.nombre}".`
        );
      }
    }

    const total = items.reduce(
      (acc, item) => acc + item.cantidad * item.producto.valorUnitario,
      0
    );

    const fecha = new Date().toISOString();
    const encabezado = await db.runAsync(
      "INSERT INTO encabezado (idCliente, fecha, total) VALUES (?, ?, ?)",
      idCliente,
      fecha,
      total
    );
    const idEncabezado = encabezado.lastInsertRowId;

    for (const item of items) {
      const subtotal = item.cantidad * item.producto.valorUnitario;
      await db.runAsync(
        `INSERT INTO detalle (idEncabezado, idProducto, cantidad, valorUnitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        idEncabezado,
        item.producto.id,
        item.cantidad,
        item.producto.valorUnitario,
        subtotal
      );

      await db.runAsync("UPDATE producto SET stock = stock - ? WHERE id = ?", item.cantidad, item.producto.id);
    }

    resultado = { idEncabezado, total };
  });

  if (!resultado) {
    throw new Error("No se pudo procesar la compra.");
  }
  return resultado;
}

async function adjuntarDetalles(
  db: SQLiteDatabase,
  encabezados: Array<{ id: number; idCliente: number; fecha: string; total: number }>
): Promise<EncabezadoConDetalle[]> {
  const conDetalle: EncabezadoConDetalle[] = [];
  for (const encabezado of encabezados) {
    const detalles = await db.getAllAsync<DetalleConProducto>(
      `SELECT d.*, p.nombre as nombreProducto
       FROM detalle d
       JOIN producto p ON p.id = d.idProducto
       WHERE d.idEncabezado = ?`,
      encabezado.id
    );
    conDetalle.push({ ...encabezado, detalles });
  }
  return conDetalle;
}

// Historial de compras de un cliente (pantalla "Mi cuenta").
export async function listarComprasPorCliente(
  db: SQLiteDatabase,
  idCliente: number
): Promise<EncabezadoConDetalle[]> {
  const encabezados = await db.getAllAsync<{
    id: number;
    idCliente: number;
    fecha: string;
    total: number;
  }>("SELECT * FROM encabezado WHERE idCliente = ? ORDER BY fecha DESC", idCliente);

  return adjuntarDetalles(db, encabezados);
}

// HU-07/admin: listado global de compras (módulo Compras del administrador).
export async function listarTodasLasCompras(db: SQLiteDatabase): Promise<EncabezadoConCliente[]> {
  const encabezados = await db.getAllAsync<{
    id: number;
    idCliente: number;
    fecha: string;
    total: number;
    nombreCliente: string;
  }>(
    `SELECT e.*, (c.nombre || ' ' || c.apellido) as nombreCliente
     FROM encabezado e
     JOIN cliente c ON c.id = e.idCliente
     ORDER BY e.fecha DESC`
  );

  const conDetalle = await adjuntarDetalles(db, encabezados);
  return conDetalle.map((enc, i) => ({ ...enc, nombreCliente: encabezados[i].nombreCliente }));
}
