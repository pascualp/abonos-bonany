import { useMemo, useState, type ReactNode } from 'react';
import { ChevronRight, Clock, Search, X } from 'lucide-react';
import { buscar, indexar } from '../lib/buscar';
import type { ItemCatalogo } from '../lib/types';

/** Si el catálogo es pequeño se enseña entero sin tener que escribir. */
const MOSTRAR_TODO_HASTA = 60;

export function BuscadorLista({
  items,
  recientes,
  placeholder,
  textoManual,
  onElegir,
}: {
  items: ItemCatalogo[] | null;
  recientes: ItemCatalogo[];
  placeholder: string;
  textoManual: string;
  onElegir: (item: ItemCatalogo) => void;
}) {
  const [q, setQ] = useState('');
  const [manual, setManual] = useState<string | null>(null);
  const indice = useMemo(() => indexar(items ?? []), [items]);
  const resultados = useMemo(() => buscar(indice, q), [indice, q]);

  const vacio = q.trim() === '';
  const todos = vacio && items && items.length <= MOSTRAR_TODO_HASTA ? items : null;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={placeholder}
          enterKeyHint="search"
          autoComplete="off"
          className="w-full h-16 rounded-2xl border-2 border-slate-300 bg-white pl-13 pr-12 text-lg outline-none focus:border-blue-500"
        />
        {!vacio && (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label="Borrar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {items === null && <p className="text-slate-500 text-center py-6">Cargando lista…</p>}

      {vacio && recientes.length > 0 && (
        <Seccion titulo="Últimos que has usado" icono={<Clock className="w-4 h-4" />}>
          {recientes.map(it => (
            <Fila key={`r-${it.codigo}-${it.nombre}`} item={it} onClick={() => onElegir(it)} />
          ))}
        </Seccion>
      )}

      {todos && todos.length > 0 && (
        <Seccion titulo="Todos">
          {todos.map(it => (
            <Fila key={`t-${it.codigo}-${it.nombre}`} item={it} onClick={() => onElegir(it)} />
          ))}
        </Seccion>
      )}

      {vacio && !todos && items && items.length > 0 && recientes.length === 0 && (
        <p className="text-slate-500 text-center py-4">
          Escribe unas letras del nombre o el código.
        </p>
      )}

      {!vacio && (
        <Seccion titulo={resultados.length ? 'Resultados' : undefined}>
          {resultados.map(it => (
            <Fila key={`b-${it.codigo}-${it.nombre}`} item={it} onClick={() => onElegir(it)} />
          ))}
          {resultados.length === 0 && (
            <p className="text-slate-500 text-center py-4">No hay nada con «{q}».</p>
          )}
        </Seccion>
      )}

      {items && items.length === 0 && (
        <p className="text-slate-500 text-center py-4">
          La oficina todavía no ha cargado la lista. Escríbelo a mano abajo.
        </p>
      )}

      <div className="pt-2">
        {manual === null ? (
          <button
            type="button"
            onClick={() => setManual(q.trim())}
            className="w-full min-h-14 rounded-2xl border-2 border-dashed border-slate-300 text-slate-600 font-semibold active:bg-slate-100"
          >
            {textoManual}
          </button>
        ) : (
          <form
            className="bg-white rounded-2xl border-2 border-slate-300 p-3 space-y-3"
            onSubmit={e => {
              e.preventDefault();
              const nombre = manual.trim();
              if (nombre) onElegir({ codigo: '', nombre, extra: '' });
            }}
          >
            <label className="block text-sm font-semibold text-slate-600">
              Escribe el nombre
              <input
                autoFocus
                value={manual}
                onChange={e => setManual(e.target.value)}
                maxLength={150}
                className="mt-1 w-full h-14 rounded-xl border-2 border-slate-300 px-3 text-lg outline-none focus:border-blue-500"
              />
            </label>
            <button
              type="submit"
              disabled={!manual.trim()}
              className="w-full h-14 rounded-xl bg-blue-600 text-white text-lg font-bold disabled:opacity-40"
            >
              Usar este nombre
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Seccion({
  titulo,
  icono,
  children,
}: {
  titulo?: string;
  icono?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      {titulo && (
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 px-1">
          {icono}
          {titulo}
        </h2>
      )}
      <ul className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {children}
      </ul>
    </section>
  );
}

function Fila({ item, onClick }: { item: ItemCatalogo; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full min-h-16 px-4 py-3 flex items-center gap-3 text-left active:bg-blue-50"
      >
        <span className="flex-1 min-w-0">
          <span className="block text-lg font-semibold leading-snug">{item.nombre}</span>
          {(item.codigo || item.extra) && (
            <span className="block text-sm text-slate-500 truncate">
              {[item.codigo, item.extra].filter(Boolean).join(' · ')}
            </span>
          )}
        </span>
        <ChevronRight className="w-6 h-6 text-slate-300 shrink-0" />
      </button>
    </li>
  );
}
