import Papa from 'papaparse';
import type { Abono } from './types';
import { formatoDia } from './fechas';

/** Lee la primera hoja de un Excel (.xlsx/.xls) o un CSV como filas de texto. */
export async function leerHoja(file: File): Promise<string[][]> {
  const XLSX = await import('xlsx'); // solo se descarga al importar
  const libro = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  if (!hoja) return [];
  const filas = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: false, defval: '' });
  return filas
    .map(f => f.map(c => String(c ?? '').trim()))
    .filter(f => f.some(c => c !== ''));
}

/**
 * Exporta una fila por producto devuelto. Separador `;` y BOM UTF-8 para que
 * el Excel en español lo abra en columnas y con los acentos bien.
 */
export function exportarAbonos(abonos: Abono[], nombre: string) {
  const filas = abonos.flatMap(a =>
    a.lineas.map(l => ({
      Fecha: formatoDia(a.fechaDia),
      Hora: a.hora,
      Repartidor: a.repartidorNombre,
      'Cód. cliente': a.clienteCodigo,
      Cliente: a.clienteNombre,
      'Cód. producto': l.productoCodigo,
      Producto: l.productoNombre,
      Cantidad: String(l.cantidad).replace('.', ','),
      Unidad: l.unidad,
      Motivo: l.motivo,
      Nota: a.nota,
      Fotos: a.numFotos,
      Estado: a.estado === 'tramitado' ? 'Tramitado' : 'Pendiente',
      'Tramitado por': a.tramitadoPor ?? '',
    })),
  );
  const csv = Papa.unparse(filas, { delimiter: ';' });
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nombre}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
