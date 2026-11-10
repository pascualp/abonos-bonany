import { useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CloudOff,
  Loader2,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type { Abono, LineaAbono, Repartidor } from '../lib/types';
import { comprimirFoto } from '../lib/imagen';
import { BotonGrande, Pantalla } from './ui';

export const MAX_FOTOS = 3;

const fmtCantidad = (l: LineaAbono) => `${String(l.cantidad).replace('.', ',')} ${l.unidad}`;

/* ───────────── ¿Quién eres? ───────────── */

export function ElegirRepartidor({
  lista,
  error,
  onElegir,
}: {
  lista: Repartidor[] | null;
  error: string | null;
  onElegir: (r: Repartidor) => void;
}) {
  return (
    <Pantalla titulo="¿Quién eres?" subtitulo="Abonos Bonany">
      {lista === null && <p className="text-center text-slate-500 py-10">Cargando…</p>}
      {lista && lista.length === 0 && (
        <p className="text-center text-slate-600 py-10 text-lg">
          {error
            ? 'No se pudo cargar la lista. Comprueba la cobertura y vuelve a abrir la página.'
            : 'Todavía no hay repartidores en la lista. Pide a la oficina que te añada.'}
        </p>
      )}
      <ul className="space-y-3">
        {lista?.map(r => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onElegir(r)}
              className="w-full min-h-18 bg-white rounded-2xl border-2 border-slate-200 px-5 flex items-center gap-4 text-left active:bg-blue-50 active:border-blue-400"
            >
              <span className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 grid place-items-center shrink-0">
                <User className="w-6 h-6" />
              </span>
              <span className="flex-1 text-xl font-bold">{r.nombre}</span>
              <ChevronRight className="w-6 h-6 text-slate-300" />
            </button>
          </li>
        ))}
      </ul>
    </Pantalla>
  );
}

/* ───────────── Inicio ───────────── */

export function Inicio({
  repartidor,
  abonos,
  borradorCliente,
  aviso,
  error,
  onNuevo,
  onContinuar,
  onDescartar,
  onVer,
  onCambiarRepartidor,
}: {
  repartidor: Repartidor;
  abonos: Abono[] | null;
  borradorCliente: string | null;
  aviso: string | null;
  error: string | null;
  onNuevo: () => void;
  onContinuar: () => void;
  onDescartar: () => void;
  onVer: (id: string) => void;
  onCambiarRepartidor: () => void;
}) {
  return (
    <Pantalla titulo={`Hola, ${repartidor.nombre}`} subtitulo="Abonos Bonany">
      <div className="space-y-5">
        {error && (
          <p role="alert" className="flex gap-2 bg-red-50 border-2 border-red-200 text-red-800 rounded-2xl p-4 font-semibold">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            {error}
          </p>
        )}
        {aviso && (
          <p role="status" className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-2xl p-4 text-lg font-bold">
            <CheckCircle2 className="w-7 h-7 shrink-0" />
            {aviso}
          </p>
        )}

        {borradorCliente ? (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3">
            <p className="text-lg">
              Tienes un abono a medias para <strong>{borradorCliente}</strong>.
            </p>
            <BotonGrande onClick={onContinuar}>Continuarlo</BotonGrande>
            <BotonGrande color="rojo" onClick={onDescartar}>
              Descartarlo
            </BotonGrande>
          </div>
        ) : (
          <button
            type="button"
            onClick={onNuevo}
            className="w-full h-36 rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-200 flex flex-col items-center justify-center gap-2 active:bg-blue-700"
          >
            <Plus className="w-12 h-12" strokeWidth={2.5} />
            <span className="text-2xl font-extrabold tracking-wide">NUEVO ABONO</span>
          </button>
        )}

        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 px-1">
            Tus abonos de hoy
          </h2>
          {abonos === null && <p className="text-slate-500 px-1">Cargando…</p>}
          {abonos?.length === 0 && (
            <p className="text-slate-500 bg-white border border-slate-200 rounded-2xl p-4">
              Hoy todavía no has hecho ninguno.
            </p>
          )}
          <ul className="space-y-2">
            {abonos?.map(a => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onVer(a.id)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 text-left active:bg-slate-50"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-lg truncate">{a.clienteNombre}</span>
                    <span className="block text-sm text-slate-500">
                      {a.hora} · {a.lineas.length} {a.lineas.length === 1 ? 'producto' : 'productos'}
                    </span>
                  </span>
                  <EstadoChip abono={a} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <button
          type="button"
          onClick={onCambiarRepartidor}
          className="w-full text-center text-sm text-slate-500 underline py-3"
        >
          No soy {repartidor.nombre}
        </button>
      </div>
    </Pantalla>
  );
}

export function EstadoChip({ abono }: { abono: Abono }) {
  if (abono.sinEnviar)
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 rounded-full px-2.5 py-1 shrink-0">
        <CloudOff className="w-3.5 h-3.5" /> Sin enviar
      </span>
    );
  if (abono.estado === 'tramitado')
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-full px-2.5 py-1 shrink-0">
        <Check className="w-3.5 h-3.5" /> Tramitado
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-bold text-blue-800 bg-blue-100 rounded-full px-2.5 py-1 shrink-0">
      <Check className="w-3.5 h-3.5" /> Enviado
    </span>
  );
}

/* ───────────── Paso 2: productos ───────────── */

export function PasoLineas({
  cliente,
  lineas,
  onAtras,
  onAnadir,
  onQuitar,
  onSiguiente,
}: {
  cliente: string;
  lineas: LineaAbono[];
  onAtras: () => void;
  onAnadir: () => void;
  onQuitar: (i: number) => void;
  onSiguiente: () => void;
}) {
  return (
    <Pantalla
      titulo="¿Qué te devuelven?"
      subtitulo={cliente}
      onAtras={onAtras}
      pie={
        <BotonGrande disabled={lineas.length === 0} onClick={onSiguiente}>
          Siguiente <ChevronRight className="w-6 h-6" />
        </BotonGrande>
      }
    >
      <div className="space-y-4">
        {lineas.length > 0 && (
          <ul className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {lineas.map((l, i) => (
              <li key={i} className="flex items-center gap-3 p-4">
                <span className="min-w-16 text-center text-xl font-extrabold text-blue-700">
                  {fmtCantidad(l)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-lg leading-snug">{l.productoNombre}</span>
                  <span className="block text-sm text-slate-500">{l.motivo}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onQuitar(i)}
                  aria-label={`Quitar ${l.productoNombre}`}
                  className="w-12 h-12 grid place-items-center rounded-full text-red-500 active:bg-red-50"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <BotonGrande color={lineas.length ? 'blanco' : 'azul'} onClick={onAnadir}>
          <Plus className="w-6 h-6" />
          {lineas.length ? 'Añadir otro producto' : 'Añadir producto'}
        </BotonGrande>
      </div>
    </Pantalla>
  );
}

/* ───────────── Paso 3: fotos, nota y guardar ───────────── */

export function PasoFinal({
  cliente,
  lineas,
  fotos,
  nota,
  onAtras,
  onFotos,
  onNota,
  onGuardar,
}: {
  cliente: string;
  lineas: LineaAbono[];
  fotos: string[];
  nota: string;
  onAtras: () => void;
  onFotos: (f: string[]) => void;
  onNota: (n: string) => void;
  onGuardar: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anadirFoto = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setProcesando(true);
    try {
      onFotos([...fotos, await comprimirFoto(file)].slice(0, MAX_FOTOS));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo usar la foto.');
    } finally {
      setProcesando(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <Pantalla
      titulo="Foto y guardar"
      subtitulo={cliente}
      onAtras={onAtras}
      pie={
        <BotonGrande color="verde" disabled={procesando} onClick={onGuardar}>
          <Check className="w-7 h-7" strokeWidth={3} /> GUARDAR ABONO
        </BotonGrande>
      }
    >
      <div className="space-y-5">
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">
            Fotos (opcional, hasta {MAX_FOTOS})
          </h2>
          {fotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {fotos.map((f, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-200">
                  <img src={f} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onFotos(fotos.filter((_, j) => j !== i))}
                    aria-label={`Quitar foto ${i + 1}`}
                    className="absolute top-1 right-1 w-9 h-9 rounded-full bg-black/60 text-white grid place-items-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {fotos.length < MAX_FOTOS && (
            <BotonGrande color="blanco" disabled={procesando} onClick={() => input.current?.click()}>
              {procesando ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
              {procesando ? 'Preparando foto…' : fotos.length ? 'Hacer otra foto' : 'Hacer foto'}
            </BotonGrande>
          )}
          <input
            ref={input}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => anadirFoto(e.target.files?.[0])}
          />
          {error && <p className="text-red-600 font-semibold">{error}</p>}
        </section>

        <label className="block">
          <span className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 px-1">
            Nota (opcional)
          </span>
          <textarea
            value={nota}
            onChange={e => onNota(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="Algo que deba saber la oficina"
            className="w-full rounded-2xl border-2 border-slate-300 bg-white p-3 text-lg outline-none focus:border-blue-500"
          />
        </label>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 px-1">Resumen</h2>
          <ul className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {lineas.map((l, i) => (
              <li key={i} className="flex gap-3 px-4 py-3">
                <span className="font-bold text-blue-700 shrink-0">{fmtCantidad(l)}</span>
                <span className="flex-1">
                  {l.productoNombre} <span className="text-slate-500">— {l.motivo}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Pantalla>
  );
}

/* ───────────── Ver un abono propio ───────────── */

export function DetalleMio({
  abono,
  onAtras,
  onBorrar,
}: {
  abono: Abono | undefined;
  onAtras: () => void;
  onBorrar: (a: Abono) => void;
}) {
  const [confirmar, setConfirmar] = useState(false);
  if (!abono)
    return (
      <Pantalla titulo="Abono" onAtras={onAtras}>
        <p className="text-slate-500 text-center py-10">Este abono ya no existe.</p>
      </Pantalla>
    );
  return (
    <Pantalla titulo={abono.clienteNombre} subtitulo={`Hoy a las ${abono.hora}`} onAtras={onAtras}>
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <EstadoChip abono={abono} />
          {abono.sinEnviar && (
            <span className="text-sm text-slate-500">Se enviará solo cuando haya cobertura.</span>
          )}
        </div>
        <ul className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {abono.lineas.map((l, i) => (
            <li key={i} className="flex gap-3 px-4 py-3">
              <span className="font-bold text-blue-700 shrink-0">{fmtCantidad(l)}</span>
              <span className="flex-1">
                {l.productoNombre} <span className="text-slate-500">— {l.motivo}</span>
              </span>
            </li>
          ))}
        </ul>
        {abono.nota && <p className="bg-white rounded-2xl border border-slate-200 p-4">{abono.nota}</p>}
        {abono.numFotos > 0 && (
          <p className="text-slate-500">
            {abono.numFotos} {abono.numFotos === 1 ? 'foto' : 'fotos'}
          </p>
        )}

        {abono.estado === 'pendiente' &&
          (confirmar ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 space-y-3">
              <p className="font-semibold text-red-800">¿Seguro que quieres borrar este abono?</p>
              <BotonGrande color="rojo" onClick={() => onBorrar(abono)}>
                <Trash2 className="w-6 h-6" /> Sí, borrarlo
              </BotonGrande>
              <BotonGrande color="blanco" onClick={() => setConfirmar(false)}>
                No
              </BotonGrande>
            </div>
          ) : (
            <BotonGrande color="rojo" onClick={() => setConfirmar(true)}>
              <Trash2 className="w-6 h-6" /> Borrar (me he equivocado)
            </BotonGrande>
          ))}
      </div>
    </Pantalla>
  );
}
