import type { ReactNode } from 'react';
import { ArrowLeft, WifiOff } from 'lucide-react';
import { useOnline } from '../lib/online';

/** Pantalla del móvil: cabecera con "atrás", contenido y botonera fija abajo. */
export function Pantalla({
  titulo,
  subtitulo,
  onAtras,
  pie,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  onAtras?: () => void;
  pie?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 bg-blue-600 text-white shadow-md pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 px-2 h-16">
          {onAtras ? (
            <button
              type="button"
              onClick={onAtras}
              aria-label="Atrás"
              className="w-12 h-12 grid place-items-center rounded-full active:bg-blue-700"
            >
              <ArrowLeft className="w-7 h-7" />
            </button>
          ) : (
            <span className="w-3" />
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight truncate">{titulo}</h1>
            {subtitulo && <p className="text-sm text-blue-100 truncate">{subtitulo}</p>}
          </div>
        </div>
        <AvisoSinConexion />
      </header>
      <main className={`flex-1 w-full max-w-xl mx-auto px-4 py-4 ${pie ? 'pb-32' : ''}`}>
        {children}
      </main>
      {pie && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-xl mx-auto p-3">{pie}</div>
        </div>
      )}
    </div>
  );
}

export function AvisoSinConexion() {
  const online = useOnline();
  if (online) return null;
  return (
    <p className="flex items-center gap-2 bg-amber-400 text-amber-950 text-sm font-semibold px-4 py-2">
      <WifiOff className="w-4 h-4 shrink-0" />
      Sin cobertura. Puedes seguir: los abonos se envían solos al volver la señal.
    </p>
  );
}

export function BotonGrande({
  children,
  onClick,
  disabled,
  color = 'azul',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  color?: 'azul' | 'verde' | 'blanco' | 'rojo';
  type?: 'button' | 'submit';
}) {
  const colores = {
    azul: 'bg-blue-600 text-white active:bg-blue-700',
    verde: 'bg-emerald-600 text-white active:bg-emerald-700',
    blanco: 'bg-white text-slate-800 border-2 border-slate-300 active:bg-slate-100',
    rojo: 'bg-white text-red-600 border-2 border-red-200 active:bg-red-50',
  }[color];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full min-h-16 rounded-2xl px-4 text-lg font-bold flex items-center justify-center gap-3 transition-colors disabled:opacity-40 ${colores}`}
    >
      {children}
    </button>
  );
}

export const Cargando = ({ texto = 'Cargando…' }: { texto?: string }) => (
  <div className="min-h-dvh grid place-items-center bg-slate-50">
    <p className="text-slate-500 text-lg animate-pulse">{texto}</p>
  </div>
);
