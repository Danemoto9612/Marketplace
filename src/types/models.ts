// Roles y estados manejados por la tabla `login`.
export type Rol = "Admin" | "Cliente";
export type EstadoLogin = "Pendiente" | "Activo";

// Tabla `login`: credenciales + estado de aprobación + rol asignado por el
// administrador (HU-01, HU-02, HU-03). El password se guarda hasheado
// (ver src/utils/crypto.ts), nunca en texto plano.
export interface Login {
  id: number;
  correo: string;
  password: string;
  estado: EstadoLogin;
  rol: Rol | null; // null mientras está "Pendiente"
}

// Tabla `cliente`: datos personales del usuario con rol Cliente (HU-04).
// Se crea (vacía) en el momento en que el admin activa la cuenta con rol
// Cliente, y el propio usuario la completa en su primer ingreso.
export interface Cliente {
  id: number;
  idLogin: number;
  nombre: string;
  apellido: string;
  correo: string;
}

export interface DatosPerfilCliente {
  nombre: string;
  apellido: string;
  correo: string;
}

export function perfilClienteCompleto(cliente: Cliente | null): boolean {
  return !!cliente && cliente.nombre.trim().length > 0 && cliente.apellido.trim().length > 0;
}

// Tabla `producto` (HU-05, HU-07).
export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  valorUnitario: number;
  stock: number;
}

export type ProductoInput = Omit<Producto, "id">;

// Tabla `encabezado`: cabecera de la compra (HU-06).
export interface Encabezado {
  id: number;
  idCliente: number;
  fecha: string; // ISO datetime
  total: number;
}

// Tabla `detalle`: líneas de la compra (HU-06).
export interface Detalle {
  id: number;
  idEncabezado: number;
  idProducto: number;
  cantidad: number;
  valorUnitario: number; // valor unitario del producto al momento de comprar
  subtotal: number; // cantidad * valorUnitario
}

export interface DetalleConProducto extends Detalle {
  nombreProducto: string;
}

export interface EncabezadoConDetalle extends Encabezado {
  detalles: DetalleConProducto[];
}

export interface EncabezadoConCliente extends EncabezadoConDetalle {
  nombreCliente: string;
}

// Carrito de compra en memoria, todavía no persistido.
export interface CartItem {
  producto: Producto;
  cantidad: number;
}

// Sesión activa mantenida en memoria (AuthContext) y respaldada en la
// tabla `sesion` de SQLite para sobrevivir a un reinicio de la app.
export interface Sesion {
  idLogin: number;
  correo: string;
  rol: Rol;
  cliente: Cliente | null; // solo aplica cuando rol === "Cliente"
}
