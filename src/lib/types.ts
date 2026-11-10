import type { Timestamp } from 'firebase/firestore';

/** Cliente o producto del catálogo. `extra` = población (clientes) o unidad (productos). */
export interface ItemCatalogo {
  codigo: string;
  nombre: string;
  extra: string;
}

export interface Repartidor {
  id: string;
  nombre: string;
}

export interface LineaAbono {
  productoCodigo: string;
  productoNombre: string;
  cantidad: number;
  unidad: string;
  motivo: string;
}

export type EstadoAbono = 'pendiente' | 'tramitado';

export interface Abono {
  id: string;
  repartidorId: string;
  repartidorNombre: string;
  clienteCodigo: string;
  clienteNombre: string;
  lineas: LineaAbono[];
  nota: string;
  numFotos: number;
  creadoPor: string;
  creadoEn: Timestamp | null;
  /** Fecha del móvil al crearlo, YYYY-MM-DD. */
  fechaDia: string;
  /** Hora del móvil al crearlo, HH:MM. */
  hora: string;
  estado: EstadoAbono;
  tramitadoPor?: string;
  tramitadoEn?: Timestamp | null;
  /** Solo en local: creado sin cobertura y todavía no ha llegado al servidor. */
  sinEnviar?: boolean;
}

/** Motivos de devolución. Para cambiarlos basta con editar esta lista. */
export const MOTIVOS = [
  'Caducado',
  'Roto / dañado',
  'Mal estado',
  'Error de pedido',
  'No lo quiere',
  'Otro',
] as const;
