import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Abono, EstadoAbono, LineaAbono, Repartidor } from './types';
import { diaISO, horaLocal } from './fechas';

export interface NuevoAbono {
  repartidor: Repartidor;
  clienteCodigo: string;
  clienteNombre: string;
  lineas: LineaAbono[];
  nota: string;
  fotos: string[];
}

/** Evento global cuando el servidor rechaza un abono que se guardó sin cobertura. */
export const EVENTO_ERROR = 'abono-error';

/**
 * Guarda el abono y sus fotos en un solo lote. No se espera a la respuesta del
 * servidor: sin cobertura Firestore lo deja en cola en el móvil y lo envía solo
 * cuando vuelve la señal.
 */
export function crearAbono(a: NuevoAbono, uid: string): string {
  const ref = doc(collection(db, 'abonos'));
  const ahora = new Date();
  const batch = writeBatch(db);
  batch.set(ref, {
    repartidorId: a.repartidor.id,
    repartidorNombre: a.repartidor.nombre,
    clienteCodigo: a.clienteCodigo,
    clienteNombre: a.clienteNombre,
    lineas: a.lineas,
    nota: a.nota.trim(),
    numFotos: a.fotos.length,
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    fechaDia: diaISO(ahora),
    hora: horaLocal(ahora),
    estado: 'pendiente',
  });
  a.fotos.forEach((data, i) =>
    batch.set(doc(db, 'abonos', ref.id, 'fotos', String(i)), { data }),
  );
  batch.commit().catch(err => {
    console.error(err);
    window.dispatchEvent(new CustomEvent(EVENTO_ERROR, { detail: a.clienteNombre }));
  });
  return ref.id;
}

const leer = (snap: QuerySnapshot): Abono[] =>
  snap.docs
    .map(d => ({
      ...(d.data({ serverTimestamps: 'estimate' }) as Omit<Abono, 'id'>),
      id: d.id,
      sinEnviar: d.metadata.hasPendingWrites,
    }))
    .sort((a, b) => (b.fechaDia + b.hora).localeCompare(a.fechaDia + a.hora));

/** Abonos hechos hoy desde este móvil. */
export function useMisAbonos(uid: string | null) {
  const [abonos, setAbonos] = useState<Abono[] | null>(null);
  const hoy = diaISO();
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(collection(db, 'abonos'), where('creadoPor', '==', uid), where('fechaDia', '==', hoy)),
      { includeMetadataChanges: true },
      snap => setAbonos(leer(snap)),
      () => setAbonos(a => a ?? []),
    );
  }, [uid, hoy]);
  return abonos;
}

/** Oficina: abonos entre dos fechas, ambas incluidas. */
export function useAbonosRango(desde: string, hasta: string) {
  const [estado, setEstado] = useState<{ abonos: Abono[] | null; error: string | null }>({
    abonos: null,
    error: null,
  });
  useEffect(() => {
    setEstado({ abonos: null, error: null });
    return onSnapshot(
      query(collection(db, 'abonos'), where('fechaDia', '>=', desde), where('fechaDia', '<=', hasta)),
      snap => setEstado({ abonos: leer(snap), error: null }),
      err => setEstado({ abonos: [], error: err.message }),
    );
  }, [desde, hasta]);
  return estado;
}

export async function cargarFotos(abonoId: string): Promise<string[]> {
  const snap = await getDocs(collection(db, 'abonos', abonoId, 'fotos'));
  return snap.docs
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map(d => d.data().data as string);
}

export const cambiarEstado = (id: string, estado: EstadoAbono, usuario: string) =>
  updateDoc(doc(db, 'abonos', id), {
    estado,
    tramitadoPor: estado === 'tramitado' ? usuario : '',
    tramitadoEn: estado === 'tramitado' ? serverTimestamp() : null,
  });

/** Borra el abono y sus fotos. Sin cobertura queda en cola como la creación. */
export function borrarAbono(a: Abono): Promise<void> {
  const batch = writeBatch(db);
  for (let i = 0; i < a.numFotos; i++) batch.delete(doc(db, 'abonos', a.id, 'fotos', String(i)));
  batch.delete(doc(db, 'abonos', a.id));
  return batch.commit();
}
