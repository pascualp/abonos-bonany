import type { ItemCatalogo } from './types';

export const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export interface Indexado {
  item: ItemCatalogo;
  texto: string;
}

export const indexar = (items: ItemCatalogo[]): Indexado[] =>
  items.map(item => ({ item, texto: normalizar(`${item.codigo} ${item.nombre} ${item.extra}`) }));

/** Todas las palabras escritas tienen que aparecer, en cualquier orden. */
export function buscar(indice: Indexado[], consulta: string, limite = 40): ItemCatalogo[] {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return [];
  const out: ItemCatalogo[] = [];
  for (const { item, texto } of indice) {
    if (palabras.every(p => texto.includes(p))) {
      out.push(item);
      if (out.length >= limite) break;
    }
  }
  return out;
}
