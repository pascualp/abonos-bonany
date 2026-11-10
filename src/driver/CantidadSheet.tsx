import { useEffect, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { MOTIVOS, type ItemCatalogo, type LineaAbono } from '../lib/types';

/** Ventana que sube desde abajo: cuántos y por qué. */
export function CantidadSheet({
  producto,
  motivoInicial,
  onAnadir,
  onCerrar,
}: {
  producto: ItemCatalogo;
  motivoInicial: string;
  onAnadir: (linea: LineaAbono) => void;
  onCerrar: () => void;
}) {
  const [texto, setTexto] = useState('1');
  const [motivo, setMotivo] = useState(motivoInicial);
  const unidad = producto.extra || 'uds';
  const cantidad = Number(texto.replace(',', '.'));
  const valida = Number.isFinite(cantidad) && cantidad > 0;

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  const sumar = (n: number) => {
    const base = Number.isFinite(cantidad) ? cantidad : 0;
    const nueva = Math.max(1, Math.round((base + n) * 100) / 100);
    setTexto(String(nueva).replace('.', ','));
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Cantidad de ${producto.nombre}`}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-5 max-h-[92dvh] overflow-y-auto"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold leading-snug">{producto.nombre}</p>
            {producto.codigo && <p className="text-sm text-slate-500">{producto.codigo}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="w-11 h-11 -m-1 grid place-items-center rounded-full text-slate-400 active:bg-slate-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-2">¿Cuántos?</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => sumar(-1)}
              aria-label="Uno menos"
              className="w-20 h-20 shrink-0 rounded-2xl bg-slate-100 grid place-items-center active:bg-slate-200"
            >
              <Minus className="w-9 h-9" />
            </button>
            <label className="flex-1 text-center">
              <input
                value={texto}
                onChange={e => setTexto(e.target.value.replace(/[^\d.,]/g, ''))}
                onFocus={e => e.target.select()}
                inputMode="decimal"
                aria-label="Cantidad"
                className="w-full h-20 text-center text-4xl font-bold rounded-2xl border-2 border-slate-200 outline-none focus:border-blue-500"
              />
              <span className="block text-sm text-slate-500 mt-1">{unidad}</span>
            </label>
            <button
              type="button"
              onClick={() => sumar(1)}
              aria-label="Uno más"
              className="w-20 h-20 shrink-0 rounded-2xl bg-slate-100 grid place-items-center active:bg-slate-200"
            >
              <Plus className="w-9 h-9" />
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-2">¿Por qué?</p>
          <div className="grid grid-cols-2 gap-2">
            {MOTIVOS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMotivo(m)}
                aria-pressed={motivo === m}
                className={`min-h-14 rounded-xl px-3 text-base font-semibold border-2 transition-colors ${
                  motivo === m
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 active:bg-slate-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!valida || !motivo}
          onClick={() =>
            onAnadir({
              productoCodigo: producto.codigo,
              productoNombre: producto.nombre,
              cantidad,
              unidad,
              motivo,
            })
          }
          className="w-full h-16 rounded-2xl bg-emerald-600 text-white text-lg font-bold active:bg-emerald-700 disabled:opacity-40"
        >
          {!motivo ? 'Elige el motivo' : 'Añadir'}
        </button>
      </div>
    </div>
  );
}
