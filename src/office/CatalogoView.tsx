import { useMemo, useRef, useState, type FormEvent } from 'react';
import { FileSpreadsheet, Loader2, Plus, Upload, X } from 'lucide-react';
import { Modal } from '../components/Modal';
import { guardarCatalogo, guardarRepartidores, useCatalogo, useRepartidores, type TipoCatalogo } from '../lib/catalogo';
import { leerHoja } from '../lib/hojas';
import type { ItemCatalogo } from '../lib/types';

const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function CatalogoView({ usuario }: { usuario: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Repartidores />
      <TarjetaCatalogo tipo="clientes" usuario={usuario} />
      <TarjetaCatalogo tipo="productos" usuario={usuario} />
    </div>
  );
}

function Repartidores() {
  const { lista, error } = useRepartidores();
  const [nombre, setNombre] = useState('');
  const [fallo, setFallo] = useState<string | null>(null);

  const guardar = (nueva: NonNullable<typeof lista>) =>
    guardarRepartidores(nueva).catch(() => setFallo('No se pudo guardar. Comprueba la conexión.'));

  const anadir = (e: FormEvent) => {
    e.preventDefault();
    const n = nombre.trim();
    if (!n || !lista) return;
    if (lista.some(r => r.nombre.toLowerCase() === n.toLowerCase())) {
      setFallo(`${n} ya está en la lista.`);
      return;
    }
    setFallo(null);
    guardar([...lista, { id: nuevoId(), nombre: n }]);
    setNombre('');
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-bold text-lg">Repartidores</h2>
        <p className="text-sm text-slate-500">
          Los nombres que aparecen en el móvil para elegir «¿Quién eres?».
        </p>
      </div>
      <form onSubmit={anadir} className="flex gap-2">
        <input
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Nombre del repartidor"
          maxLength={60}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button type="submit" disabled={!nombre.trim() || !lista} className="flex items-center gap-1 bg-blue-600 text-white rounded-lg px-3 text-sm font-semibold disabled:opacity-40">
          <Plus className="w-4 h-4" /> Añadir
        </button>
      </form>
      {(fallo || error) && <p className="text-sm text-red-600">{fallo ?? error}</p>}
      {lista === null ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : lista.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no hay ninguno.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
          {lista.map(r => (
            <li key={r.id} className="flex items-center px-3 py-2 text-sm">
              <span className="flex-1">{r.nombre}</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Quitar a ${r.nombre} de la lista? Sus abonos se conservan.`))
                    guardar(lista.filter(x => x.id !== r.id));
                }}
                aria-label={`Quitar a ${r.nombre}`}
                className="p-1.5 text-slate-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const TEXTOS: Record<TipoCatalogo, { titulo: string; nombre: RegExp; extra: RegExp; etiquetaExtra: string; ayuda: string }> = {
  clientes: {
    titulo: 'Clientes',
    nombre: /(nombre|cliente|raz[oó]n|denominaci|comercial)/i,
    extra: /(poblaci|localidad|ciudad|municipio|direcci|zona)/i,
    etiquetaExtra: 'Población (opcional)',
    ayuda: 'Excel con una fila por cliente: código, nombre y, si quieres, población.',
  },
  productos: {
    titulo: 'Productos',
    nombre: /(descrip|nombre|art[ií]culo|producto)/i,
    extra: /(unidad|^uds?$|formato|medida)/i,
    etiquetaExtra: 'Unidad (opcional: uds, kg, cajas…)',
    ayuda: 'Excel con una fila por producto: código, descripción y, si quieres, unidad.',
  },
};

function TarjetaCatalogo({ tipo, usuario }: { tipo: TipoCatalogo; usuario: string }) {
  const { items, info, error } = useCatalogo(tipo);
  const input = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<string[][] | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const t = TEXTOS[tipo];

  const abrir = async (file: File | undefined) => {
    if (!file) return;
    setFallo(null);
    setLeyendo(true);
    try {
      const f = await leerHoja(file);
      if (f.length === 0) setFallo('El archivo está vacío.');
      else setFilas(f);
    } catch {
      setFallo('No se pudo leer el archivo. ¿Es un Excel o CSV?');
    } finally {
      setLeyendo(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-bold text-lg">{t.titulo}</h2>
        <p className="text-sm text-slate-500">{t.ayuda}</p>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 text-sm">
        {items === null ? (
          'Cargando…'
        ) : info ? (
          <>
            <strong className="text-2xl block">{info.total.toLocaleString('es-ES')}</strong>
            {t.titulo.toLowerCase()} · actualizado el {new Date(info.actualizado).toLocaleString('es-ES')} por {info.actualizadoPor}
          </>
        ) : (
          'Todavía no se ha cargado ninguna lista. Los repartidores tendrán que escribirlo a mano.'
        )}
      </div>
      {(fallo || error) && <p className="text-sm text-red-600">{fallo ?? error}</p>}
      <button
        type="button"
        disabled={leyendo}
        onClick={() => input.current?.click()}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-3 text-sm font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
      >
        {leyendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {info ? 'Sustituir con un Excel nuevo' : 'Subir Excel'}
      </button>
      <input ref={input} type="file" accept=".xlsx,.xls,.csv,.ods" className="hidden" onChange={e => abrir(e.target.files?.[0])} />
      {filas && <Importar tipo={tipo} filas={filas} usuario={usuario} onCerrar={() => setFilas(null)} />}
    </section>
  );
}

function adivinar(cabecera: string[], re: RegExp, evitar: number[] = []) {
  return cabecera.findIndex((c, i) => !evitar.includes(i) && re.test(c.trim()));
}

function Importar({
  tipo,
  filas,
  usuario,
  onCerrar,
}: {
  tipo: TipoCatalogo;
  filas: string[][];
  usuario: string;
  onCerrar: () => void;
}) {
  const t = TEXTOS[tipo];
  const columnas = Math.max(...filas.map(f => f.length));
  const cabecera = filas[0];

  const [conCabecera, setConCabecera] = useState(true);
  const [colCodigo, setColCodigo] = useState(() => {
    const i = adivinar(cabecera, /^(c[oó]d|codigo|ref|n[ºo°]?\s*cliente|id$)/i);
    return i >= 0 ? i : 0;
  });
  const [colNombre, setColNombre] = useState(() => {
    const i = adivinar(cabecera, t.nombre, [colCodigo]);
    return i >= 0 ? i : Math.min(1, columnas - 1);
  });
  const [colExtra, setColExtra] = useState(() => adivinar(cabecera, t.extra, [colCodigo, colNombre]));
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  const nombreCol = (i: number) => {
    const letra = String.fromCharCode(65 + (i % 26));
    return conCabecera && cabecera[i] ? `${letra} · ${cabecera[i]}` : `Columna ${letra}`;
  };

  const items = useMemo(() => {
    const vistos = new Set<string>();
    const out: ItemCatalogo[] = [];
    for (const f of conCabecera ? filas.slice(1) : filas) {
      const nombre = (f[colNombre] ?? '').trim();
      if (!nombre) continue;
      const codigo = colCodigo >= 0 ? (f[colCodigo] ?? '').trim() : '';
      const clave = `${codigo}|${nombre}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      out.push({ codigo, nombre, extra: colExtra >= 0 ? (f[colExtra] ?? '').trim() : '' });
    }
    return out.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [filas, conCabecera, colCodigo, colNombre, colExtra]);

  const importar = async () => {
    setGuardando(true);
    setFallo(null);
    try {
      await guardarCatalogo(tipo, items, usuario);
      onCerrar();
    } catch {
      setFallo('No se pudo guardar. Comprueba la conexión y vuelve a intentarlo.');
      setGuardando(false);
    }
  };

  const selector = (etiqueta: string, valor: number, cambiar: (n: number) => void, opcional = false) => (
    <label className="text-xs font-bold text-slate-500 uppercase block">
      {etiqueta}
      <select
        value={valor}
        onChange={e => cambiar(Number(e.target.value))}
        className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm font-normal normal-case text-slate-900"
      >
        {opcional && <option value={-1}>— Ninguna —</option>}
        {Array.from({ length: columnas }, (_, i) => (
          <option key={i} value={i}>
            {nombreCol(i)}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <Modal onClose={guardando ? () => {} : onCerrar} labelledBy="importar-titulo" className="max-w-2xl">
      <div className="space-y-4">
        <h2 id="importar-titulo" className="text-lg font-bold flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Importar {t.titulo.toLowerCase()}
        </h2>
        <p className="text-sm text-slate-600">Dime qué columna es cada cosa:</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {selector('Código', colCodigo, setColCodigo, true)}
          {selector('Nombre', colNombre, setColNombre)}
          {selector(t.etiquetaExtra, colExtra, setColExtra, true)}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={conCabecera} onChange={e => setConCabecera(e.target.checked)} />
          La primera fila son los títulos de las columnas
        </label>

        <div>
          <p className="text-xs font-bold uppercase text-slate-500 mb-1">Así quedará (primeros 8)</p>
          <table className="w-full text-sm border border-slate-200">
            <tbody className="divide-y divide-slate-100">
              {items.slice(0, 8).map((it, i) => (
                <tr key={i}>
                  <td className="px-2 py-1 text-slate-500 w-24">{it.codigo}</td>
                  <td className="px-2 py-1">{it.nombre}</td>
                  <td className="px-2 py-1 text-slate-500">{it.extra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm bg-amber-50 border border-amber-100 rounded-xl p-3">
          Se sustituirá la lista actual por estos <strong>{items.length.toLocaleString('es-ES')}</strong>{' '}
          {t.titulo.toLowerCase()}. Los abonos ya hechos no cambian.
        </p>
        {fallo && <p className="text-sm text-red-600">{fallo}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" disabled={guardando} onClick={onCerrar} className="px-4 py-2.5 text-sm rounded-xl border border-slate-200">
            Cancelar
          </button>
          <button
            type="button"
            disabled={guardando || items.length === 0}
            onClick={importar}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-blue-600 text-white disabled:opacity-40"
          >
            {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
            {guardando ? 'Guardando…' : `Importar ${items.length.toLocaleString('es-ES')}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
