import { useMemo, useState } from 'react';
import { Camera, Check, CloudOff, Download, RotateCcw, Search } from 'lucide-react';
import { cambiarEstado, useAbonosRango } from '../lib/abonos';
import { diaISO, formatoDia, sumarDias } from '../lib/fechas';
import { exportarAbonos } from '../lib/hojas';
import { normalizar } from '../lib/buscar';
import type { Abono } from '../lib/types';
import { DetalleAbono } from './DetalleAbono';

type FiltroEstado = 'pendiente' | 'tramitado' | 'todos';

const campo =
  'border border-slate-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none';

export function AbonosView({ usuario }: { usuario: string }) {
  const hoy = diaISO();
  const [desde, setDesde] = useState(sumarDias(hoy, -6));
  const [hasta, setHasta] = useState(hoy);
  const [estado, setEstado] = useState<FiltroEstado>('pendiente');
  const [repartidor, setRepartidor] = useState('');
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { abonos, error: errorCarga } = useAbonosRango(desde <= hasta ? desde : hasta, hasta);

  const repartidores = useMemo(
    () => [...new Set((abonos ?? []).map(a => a.repartidorNombre))].sort((a, b) => a.localeCompare(b, 'es')),
    [abonos],
  );

  const visibles = useMemo(() => {
    const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
    return (abonos ?? []).filter(a => {
      if (estado !== 'todos' && a.estado !== estado) return false;
      if (repartidor && a.repartidorNombre !== repartidor) return false;
      if (palabras.length) {
        const h = normalizar(
          [a.clienteNombre, a.clienteCodigo, a.nota, ...a.lineas.flatMap(l => [l.productoNombre, l.productoCodigo, l.motivo])].join(' '),
        );
        if (!palabras.every(p => h.includes(p))) return false;
      }
      return true;
    });
  }, [abonos, estado, repartidor, texto]);

  const pendientes = (abonos ?? []).filter(a => a.estado === 'pendiente').length;
  const seleccionado = abonos?.find(a => a.id === abierto);

  const cambiar = (a: Abono) =>
    cambiarEstado(a.id, a.estado === 'pendiente' ? 'tramitado' : 'pendiente', usuario).catch(() =>
      setError('No se pudo cambiar el estado. Comprueba la conexión.'),
    );

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-bold text-slate-500 uppercase">
          Desde
          <input type="date" value={desde} max={hasta} onChange={e => e.target.value && setDesde(e.target.value)} className={`${campo} block mt-1`} />
        </label>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Hasta
          <input type="date" value={hasta} min={desde} onChange={e => e.target.value && setHasta(e.target.value)} className={`${campo} block mt-1`} />
        </label>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Estado
          <select value={estado} onChange={e => setEstado(e.target.value as FiltroEstado)} className={`${campo} block mt-1`}>
            <option value="pendiente">Pendientes</option>
            <option value="tramitado">Tramitados</option>
            <option value="todos">Todos</option>
          </select>
        </label>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Repartidor
          <select value={repartidor} onChange={e => setRepartidor(e.target.value)} className={`${campo} block mt-1`}>
            <option value="">Todos</option>
            {repartidores.map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-500 uppercase flex-1 min-w-48">
          Buscar
          <span className="relative block mt-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Cliente, producto, motivo…"
              className={`${campo} w-full pl-8 font-normal normal-case`}
            />
          </span>
        </label>
        <button
          type="button"
          disabled={visibles.length === 0}
          onClick={() => exportarAbonos(visibles, `abonos-${desde}-a-${hasta}`)}
          className="flex items-center gap-2 bg-slate-800 text-white text-sm font-semibold rounded-lg px-3 py-2 hover:bg-slate-900 disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> Excel
        </button>
      </div>

      <p className="text-sm text-slate-500">
        {abonos === null
          ? 'Cargando…'
          : `${visibles.length} ${visibles.length === 1 ? 'abono' : 'abonos'} en pantalla · ${pendientes} pendientes en estas fechas`}
      </p>
      {(error || errorCarga) && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
          {error ?? `No se pudieron cargar los abonos: ${errorCarga}`}
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-bold">Fecha</th>
              <th className="px-4 py-3 font-bold">Repartidor</th>
              <th className="px-4 py-3 font-bold">Cliente</th>
              <th className="px-4 py-3 font-bold">Productos</th>
              <th className="px-4 py-3 font-bold">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibles.map(a => (
              <tr key={a.id} onClick={() => setAbierto(a.id)} className="cursor-pointer hover:bg-blue-50/50 align-top">
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatoDia(a.fechaDia)}
                  <span className="block text-slate-500">{a.hora}</span>
                </td>
                <td className="px-4 py-3">{a.repartidorNombre}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold">{a.clienteNombre}</span>
                  {a.clienteCodigo && <span className="block text-slate-500">{a.clienteCodigo}</span>}
                </td>
                <td className="px-4 py-3">
                  <ul>
                    {a.lineas.map((l, i) => (
                      <li key={i}>
                        <strong>{String(l.cantidad).replace('.', ',')} {l.unidad}</strong> {l.productoNombre}{' '}
                        <span className="text-slate-500">({l.motivo})</span>
                      </li>
                    ))}
                  </ul>
                  <span className="flex gap-3 mt-1 text-slate-400">
                    {a.numFotos > 0 && (
                      <span className="flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" /> {a.numFotos}
                      </span>
                    )}
                    {a.nota && <span className="italic truncate max-w-64">«{a.nota}»</span>}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {a.sinEnviar ? (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <CloudOff className="w-3.5 h-3.5" /> Enviando…
                    </span>
                  ) : a.estado === 'tramitado' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <Check className="w-3.5 h-3.5" /> Tramitado
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold">Pendiente</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      cambiar(a);
                    }}
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                      a.estado === 'pendiente'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {a.estado === 'pendiente' ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Tramitar
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" /> Deshacer
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {abonos !== null && visibles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No hay abonos con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {seleccionado && (
        <DetalleAbono
          abono={seleccionado}
          onCerrar={() => setAbierto(null)}
          onCambiarEstado={() => cambiar(seleccionado)}
        />
      )}
    </div>
  );
}
