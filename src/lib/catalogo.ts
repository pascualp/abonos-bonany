import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ItemCatalogo, Repartidor } from './types';

/*
 * El catálogo se guarda empaquetado: cada documento de /catalogo lleva miles de
 * clientes o productos como líneas "código<TAB>nombre<TAB>extra". Así cada móvil
 * lee 1-2 documentos en vez de miles (Firestore cobra por documento leído).
 * Al importar se escribe una versión nueva entera y después se borra la
 * anterior; los móviles solo usan una versión cuando tienen todas sus partes.
 */

export type TipoCatalogo = 'clientes' | 'productos';

interface ParteDoc {
  tipo: TipoCatalogo;
  version: string;
  parte: number;
  partes: number;
  total: number;
  items: string[];
  actualizado: number;
  actualizadoPor: string;
}

export interface InfoCatalogo {
  total: number;
  actualizado: number;
  actualizadoPor: string;
}

const limpiar = (s: string) => s.replace(/[\t\r\n]+/g, ' ').trim();
const codificar = (i: ItemCatalogo) => [i.codigo, i.nombre, i.extra].map(limpiar).join('\t');
const decodificar = (s: string): ItemCatalogo => {
  const [codigo = '', nombre = '', extra = ''] = s.split('\t');
  return { codigo, nombre, extra };
};

export function useCatalogo(tipo: TipoCatalogo) {
  const [estado, setEstado] = useState<{
    items: ItemCatalogo[] | null;
    info: InfoCatalogo | null;
    error: string | null;
  }>({ items: null, info: null, error: null });

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'catalogo'), where('tipo', '==', tipo)),
        snap => {
          const versiones = new Map<string, ParteDoc[]>();
          snap.forEach(d => {
            const p = d.data() as ParteDoc;
            versiones.set(p.version, [...(versiones.get(p.version) ?? []), p]);
          });
          let mejor: ParteDoc[] | null = null;
          for (const partes of versiones.values()) {
            if (partes.length !== partes[0].partes) continue; // todavía subiéndose
            if (!mejor || partes[0].actualizado > mejor[0].actualizado) mejor = partes;
          }
          if (!mejor) {
            setEstado({ items: [], info: null, error: null });
            return;
          }
          mejor.sort((a, b) => a.parte - b.parte);
          setEstado({
            items: mejor.flatMap(p => p.items.map(decodificar)),
            info: {
              total: mejor[0].total,
              actualizado: mejor[0].actualizado,
              actualizadoPor: mejor[0].actualizadoPor,
            },
            error: null,
          });
        },
        err => setEstado(s => ({ ...s, items: s.items ?? [], error: err.message })),
      ),
    [tipo],
  );

  return estado;
}

/** Sustituye el catálogo entero de clientes o productos. */
export async function guardarCatalogo(tipo: TipoCatalogo, items: ItemCatalogo[], usuario: string) {
  const version = Date.now().toString(36);
  const actualizado = Date.now();

  // Partes de ~600 KB: el máximo de un documento es 1 MB.
  const partes: string[][] = [];
  let actual: string[] = [];
  let tam = 0;
  for (const linea of items.map(codificar)) {
    if (tam + linea.length > 600_000 && actual.length) {
      partes.push(actual);
      actual = [];
      tam = 0;
    }
    actual.push(linea);
    tam += linea.length * 2 + 4; // margen por acentos (UTF-8)
  }
  partes.push(actual);

  for (let i = 0; i < partes.length; i++) {
    const parte: ParteDoc = {
      tipo,
      version,
      parte: i,
      partes: partes.length,
      total: items.length,
      items: partes[i],
      actualizado,
      actualizadoPor: usuario,
    };
    await setDoc(doc(db, 'catalogo', `${tipo}-${version}-${i}`), parte);
  }

  const todas = await getDocs(query(collection(db, 'catalogo'), where('tipo', '==', tipo)));
  await Promise.all(
    todas.docs.filter(d => d.data().version !== version).map(d => deleteDoc(d.ref)),
  );
}

export function useRepartidores() {
  const [lista, setLista] = useState<Repartidor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(
    () =>
      onSnapshot(
        doc(db, 'catalogo', 'repartidores'),
        snap => {
          const datos = snap.data() as { lista?: Repartidor[] } | undefined;
          setLista(
            [...(datos?.lista ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
          );
          setError(null);
        },
        err => {
          setError(err.message);
          setLista(l => l ?? []);
        },
      ),
    [],
  );
  return { lista, error };
}

export const guardarRepartidores = (lista: Repartidor[]) =>
  setDoc(doc(db, 'catalogo', 'repartidores'), { tipo: 'repartidores', lista });
