import { useEffect, useState } from 'react';
import { Check, Loader2, RotateCcw, Trash2, X } from 'lucide-react';
import { Modal } from '../components/Modal';
import { borrarAbono, cargarFotos } from '../lib/abonos';
import { formatoDia } from '../lib/fechas';
import type { Abono } from '../lib/types';

export function DetalleAbono({
  abono,
  onCerrar,
  onCambiarEstado,
}: {
  abono: Abono;
  onCerrar: () => void;
  onCambiarEstado: () => void;
}) {
  const [fotos, setFotos] = useState<string[] | null>(abono.numFotos ? null : []);
  const [grande, setGrande] = useState<string | null>(null);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abono.numFotos) return;
    let vivo = true;
    cargarFotos(abono.id)
      .then(f => vivo && setFotos(f))
      .catch(() => vivo && (setFotos([]), setError('No se pudieron cargar las fotos.')));
    return () => {
      vivo = false;
    };
  }, [abono.id, abono.numFotos]);

  const borrar = async () => {
    try {
      await borrarAbono(abono);
      onCerrar();
    } catch {
      setError('No se pudo borrar el abono.');
    }
  };

  return (
    <Modal onClose={onCerrar} labelledBy="detalle-titulo" className="max-w-2xl">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h2 id="detalle-titulo" className="text-xl font-bold">
              {abono.clienteNombre}
            </h2>
            <p className="text-sm text-slate-500">
              {abono.clienteCodigo && `${abono.clienteCodigo} · `}
              {formatoDia(abono.fechaDia)} a las {abono.hora} · {abono.repartidorNombre}
            </p>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="p-2 -m-2 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Producto</th>
              <th className="px-3 py-2 text-right">Cantidad</th>
              <th className="px-3 py-2">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {abono.lineas.map((l, i) => (
              <tr key={i}>
                <td className="px-3 py-2">
                  {l.productoNombre}
                  {l.productoCodigo && <span className="block text-xs text-slate-500">{l.productoCodigo}</span>}
                </td>
                <td className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                  {String(l.cantidad).replace('.', ',')} {l.unidad}
                </td>
                <td className="px-3 py-2">{l.motivo}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {abono.nota && (
          <p className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm">
            <strong>Nota:</strong> {abono.nota}
          </p>
        )}

        {abono.numFotos > 0 && (
          <div>
            <p className="text-xs font-bold uppercase text-slate-500 mb-2">Fotos</p>
            {fotos === null ? (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando fotos…
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((f, i) => (
                  <button key={i} type="button" onClick={() => setGrande(f)} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                    <img src={f} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {abono.estado === 'tramitado' && abono.tramitadoPor && (
          <p className="text-sm text-emerald-700">
            Tramitado por {abono.tramitadoPor}
            {abono.tramitadoEn && ` el ${abono.tramitadoEn.toDate().toLocaleString('es-ES')}`}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCambiarEstado}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
              abono.estado === 'pendiente'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {abono.estado === 'pendiente' ? <Check className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
            {abono.estado === 'pendiente' ? 'Marcar como tramitado' : 'Volver a pendiente'}
          </button>
          <span className="flex-1" />
          {confirmarBorrar ? (
            <>
              <button type="button" onClick={borrar} className="rounded-xl px-4 py-2.5 text-sm font-bold bg-red-600 text-white hover:bg-red-700">
                Sí, borrar
              </button>
              <button type="button" onClick={() => setConfirmarBorrar(false)} className="rounded-xl px-4 py-2.5 text-sm border border-slate-200">
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmarBorrar(true)}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" /> Borrar
            </button>
          )}
        </div>
      </div>

      {grande && (
        <div className="fixed inset-0 z-[60] bg-black/90 grid place-items-center p-4" onClick={() => setGrande(null)}>
          <img src={grande} alt="Foto ampliada" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </Modal>
  );
}
