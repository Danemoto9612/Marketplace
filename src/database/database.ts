import type { SQLiteDatabase } from "expo-sqlite";
import { hashPassword } from "../utils/crypto";

// Nueva base de datos (distinta a la del proyecto anterior) para partir de
// un esquema limpio acorde al parcial: login / cliente / producto /
// encabezado / detalle.
export const DATABASE_NAME = "appforms.db";

const ADMIN_CORREO = "admin@gmail.com";
const ADMIN_PASSWORD = "123456";

/**
 * Crea el esquema y siembra datos base: un admin ya activo (para poder
 * entrar la primera vez y aprobar el resto de cuentas) y un catálogo de
 * productos de ejemplo.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const DATABASE_VERSION = 1;

  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let currentDbVersion = row?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS login (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      correo TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Activo')),
      rol TEXT CHECK (rol IN ('Admin', 'Cliente'))
    );

    CREATE TABLE IF NOT EXISTS cliente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idLogin INTEGER NOT NULL UNIQUE,
      nombre TEXT NOT NULL DEFAULT '',
      apellido TEXT NOT NULL DEFAULT '',
      correo TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (idLogin) REFERENCES login(id)
    );

    CREATE TABLE IF NOT EXISTS producto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      valorUnitario REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS encabezado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idCliente INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (idCliente) REFERENCES cliente(id)
    );

    CREATE TABLE IF NOT EXISTS detalle (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idEncabezado INTEGER NOT NULL,
      idProducto INTEGER NOT NULL,
      cantidad INTEGER NOT NULL,
      valorUnitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (idEncabezado) REFERENCES encabezado(id),
      FOREIGN KEY (idProducto) REFERENCES producto(id)
    );

    -- Tabla de una sola fila para persistir la sesión activa entre
    -- reinicios de la app (no se usa AsyncStorage para evitar depender de
    -- un módulo nativo adicional; ya tenemos SQLite disponible y probado).
    CREATE TABLE IF NOT EXISTS sesion (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      idLogin INTEGER,
      FOREIGN KEY (idLogin) REFERENCES login(id)
    );
  `);

  const admin = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM login WHERE correo = ?",
    ADMIN_CORREO
  );
  if (!admin) {
    const passwordHasheado = await hashPassword(ADMIN_PASSWORD);
    await db.runAsync(
      `INSERT INTO login (correo, password, estado, rol) VALUES (?, ?, 'Activo', 'Admin')`,
      ADMIN_CORREO,
      passwordHasheado
    );
  }

  const { total } =
    (await db.getFirstAsync<{ total: number }>("SELECT COUNT(*) as total FROM producto")) ?? {
      total: 0,
    };

  if (!total) {
    const seed: Array<[string, string, number, number]> = [
      ["Teclado mecánico", "Teclado mecánico switches rojos, retroiluminado", 189000, 15],
      ["Mouse inalámbrico", "Mouse ergonómico inalámbrico 2.4GHz", 69000, 30],
      ['Monitor 24"', "Monitor Full HD 24 pulgadas 75Hz", 620000, 8],
      ["Audífonos Bluetooth", "Audífonos over-ear con cancelación de ruido", 145000, 20],
      ["Webcam Full HD", "Webcam 1080p con micrófono integrado", 98000, 12],
      ["Disco SSD 1TB", "Unidad de estado sólido NVMe 1TB", 310000, 0],
    ];

    for (const [nombre, descripcion, valorUnitario, stock] of seed) {
      await db.runAsync(
        `INSERT INTO producto (nombre, descripcion, valorUnitario, stock) VALUES (?, ?, ?, ?)`,
        nombre,
        descripcion,
        valorUnitario,
        stock
      );
    }
  }

  const sesionRow = await db.getFirstAsync<{ id: number }>("SELECT id FROM sesion WHERE id = 1");
  if (!sesionRow) {
    await db.runAsync("INSERT INTO sesion (id, idLogin) VALUES (1, NULL)");
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
