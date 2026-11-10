import { useEffect, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useCatalogo, useRepartidores } from '../lib/catalogo';
import { borrarAbono, crearAbono, EVENTO_ERROR, useMisAbonos } from '../lib/abonos';
import type { ItemCatalogo, LineaAbono, Repartidor } from '../lib/types';
import { useNav } from './useNav';
import { Cargando, Pantalla } from './ui';
import { BuscadorLista } from './BuscadorLista';
import { CantidadSheet } from './CantidadSheet';
import { DetalleMio, ElegirRepartidor, Inicio, PasoFinal, PasoLineas } from './Pantallas';

type Vista =
  | { v: 'inicio' }
  | { v: 'cliente' }
  | { v: 'lineas' }
  | { v: 'producto' }
  | { v: 'final' }
  | { v: 'detalle'; id: string };

interface Borrador {
  cliente: { codigo: string; nombre: string } | null;
  lineas: LineaAbono[];
  nota: string;
}

const VACIO: Borrador = { cliente: null, lineas: [], nota: '' };
const INICIO: Vista = { v: 'inicio' };

// Lo que se recuerda en el propio móvil.
const K_REPARTIDOR = 'abonos.repartidor';
const K_BORRADOR = 'abonos.borrador';
const K_REC_CLIENTES = 'abonos.recientes.clientes';
const K_REC_PRODUCTOS = 'abonos.recientes.productos';
const K_MOTIVO = 'abonos.ultimoMotivo';

function leer<T>(clave: string, defecto: T): T {
  try {
    const s = localStorage.getItem(clave);
    return s ? (JSON.parse(s) as T) : defecto;
  } catch {
    return defecto;
  }
}

function guardar(clave: string, valor: unknown) {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* modo privado o almacenamiento lleno: no es imprescindible */
  }
}

const conReciente = (lista: ItemCatalogo[], item: ItemCatalogo) =>
  [item, ...lista.filter(x => !(x.codigo === item.codigo && x.nombre === item.nombre))].slice(0, 12);

const errorAcceso = (e: unknown) => {
  const code = e instanceof FirebaseError ? e.code : '';
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation')
    return 'Falta activar el acceso anónimo en Firebase (Authentication → Sign-in method → Anónimo).';
  if (code === 'auth/network-request-failed')
    return 'Sin cobertura. La primera vez que abres la página necesitas conexión.';
  return `No se pudo entrar (${code || 'error desconocido'}). Vuelve a abrir la página.`;
};

export default function DriverApp() {
  const [user, setUser] = useState<User | null>(null);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

  // Los repartidores no tienen contraseña: cada móvil entra con una sesión anónima.
  useEffect(
    () =>
      onAuthStateChanged(auth, u => {
        if (u) setUser(u);
        else signInAnonymously(auth).catch(e => setErrorAuth(errorAcceso(e)));
      }),
    [],
  );

  if (errorAuth)
    return (
      <Pantalla titulo="Abonos Bonany">
        <p className="text-lg text-red-700 text-center py-10">{errorAuth}</p>
      </Pantalla>
    );
  if (!user) return <Cargando />;
  return <AppRepartidor uid={user.uid} />;
}

function AppRepartidor({ uid }: { uid: string }) {
  const { lista: repartidores, error: errorRepartidores } = useRepartidores();
  const clientes = useCatalogo('clientes');
  const productos = useCatalogo('productos');
  const misAbonos = useMisAbonos(uid);
  const { vista, ir, atras, alInicio } = useNav<Vista>(INICIO);

  const [repartidor, setRepartidor] = useState<Repartidor | null>(() => leer(K_REPARTIDOR, null));
  const [borrador, setBorrador] = useState<Borrador>(() => leer(K_BORRADOR, VACIO));
  const [fotos, setFotos] = useState<string[]>([]);
  const [recClientes, setRecClientes] = useState<ItemCatalogo[]>(() => leer(K_REC_CLIENTES, []));
  const [recProductos, setRecProductos] = useState<ItemCatalogo[]>(() => leer(K_REC_PRODUCTOS, []));
  const [ultimoMotivo, setUltimoMotivo] = useState<string>(() => leer(K_MOTIVO, ''));
  const [productoElegido, setProductoElegido] = useState<ItemCatalogo | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => guardar(K_REPARTIDOR, repartidor), [repartidor]);
  useEffect(() => guardar(K_BORRADOR, borrador.cliente ? borrador : null), [borrador]);
  useEffect(() => guardar(K_REC_CLIENTES, recClientes), [recClientes]);
  useEffect(() => guardar(K_REC_PRODUCTOS, recProductos), [recProductos]);
  useEffect(() => guardar(K_MOTIVO, ultimoMotivo), [ultimoMotivo]);

  // Si la oficina quita a este repartidor de la lista, que vuelva a elegir.
  useEffect(() => {
    if (repartidor && repartidores && repartidores.length > 0 && !repartidores.some(r => r.id === repartidor.id))
      setRepartidor(null);
  }, [repartidor, repartidores]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(t);
  }, [aviso]);

  useEffect(() => {
    const onError = (e: Event) =>
      setError(
        `No se pudo guardar el abono de ${(e as CustomEvent<string>).detail}. Vuelve a hacerlo o avisa a la oficina.`,
      );
    window.addEventListener(EVENTO_ERROR, onError);
    return () => window.removeEventListener(EVENTO_ERROR, onError);
  }, []);

  if (!repartidor)
    return <ElegirRepartidor lista={repartidores} error={errorRepartidores} onElegir={setRepartidor} />;

  const cliente = borrador.cliente;
  // Tras recargar la página el historial puede apuntar a un paso sin abono en curso.
  const pantalla = !cliente && ['lineas', 'producto', 'final'].includes(vista.v) ? INICIO : vista;

  const guardarAbono = () => {
    if (!cliente) return;
    crearAbono(
      {
        repartidor,
        clienteCodigo: cliente.codigo,
        clienteNombre: cliente.nombre,
        lineas: borrador.lineas,
        nota: borrador.nota,
        fotos,
      },
      uid,
    );
    setAviso(
      navigator.onLine
        ? `Abono de ${cliente.nombre} guardado.`
        : `Abono de ${cliente.nombre} guardado en el móvil. Se enviará al tener cobertura.`,
    );
    setError(null);
    setBorrador(VACIO);
    setFotos([]);
    alInicio();
  };

  switch (pantalla.v) {
    case 'cliente':
      return (
        <Pantalla titulo="¿Qué cliente?" subtitulo="Paso 1 de 3" onAtras={atras}>
          <BuscadorLista
            items={clientes.items}
            recientes={recClientes}
            placeholder="Buscar cliente"
            textoManual="El cliente no está en la lista"
            onElegir={c => {
              setBorrador(b => ({ ...b, cliente: { codigo: c.codigo, nombre: c.nombre } }));
              if (c.codigo) setRecClientes(r => conReciente(r, c));
              ir({ v: 'lineas' });
              if (borrador.lineas.length === 0) ir({ v: 'producto' });
            }}
          />
        </Pantalla>
      );

    case 'producto':
      return (
        <Pantalla titulo="¿Qué producto?" subtitulo={cliente?.nombre} onAtras={atras}>
          <BuscadorLista
            items={productos.items}
            recientes={recProductos}
            placeholder="Buscar producto"
            textoManual="El producto no está en la lista"
            onElegir={setProductoElegido}
          />
          {productoElegido && (
            <CantidadSheet
              producto={productoElegido}
              motivoInicial={ultimoMotivo}
              onCerrar={() => setProductoElegido(null)}
              onAnadir={linea => {
                setBorrador(b => ({ ...b, lineas: [...b.lineas, linea] }));
                if (productoElegido.codigo) setRecProductos(r => conReciente(r, productoElegido));
                setUltimoMotivo(linea.motivo);
                setProductoElegido(null);
                atras();
              }}
            />
          )}
        </Pantalla>
      );

    case 'lineas':
      return (
        <PasoLineas
          cliente={cliente!.nombre}
          lineas={borrador.lineas}
          onAtras={atras}
          onAnadir={() => ir({ v: 'producto' })}
          onQuitar={i => setBorrador(b => ({ ...b, lineas: b.lineas.filter((_, j) => j !== i) }))}
          onSiguiente={() => ir({ v: 'final' })}
        />
      );

    case 'final':
      return (
        <PasoFinal
          cliente={cliente!.nombre}
          lineas={borrador.lineas}
          fotos={fotos}
          nota={borrador.nota}
          onAtras={atras}
          onFotos={setFotos}
          onNota={nota => setBorrador(b => ({ ...b, nota }))}
          onGuardar={guardarAbono}
        />
      );

    case 'detalle':
      return (
        <DetalleMio
          abono={misAbonos?.find(a => a.id === pantalla.id)}
          onAtras={atras}
          onBorrar={a => {
            borrarAbono(a).catch(() => setError('No se pudo borrar el abono.'));
            setAviso('Abono borrado.');
            atras();
          }}
        />
      );

    default:
      return (
        <Inicio
          repartidor={repartidor}
          abonos={misAbonos}
          borradorCliente={cliente?.nombre ?? null}
          aviso={aviso}
          error={error}
          onNuevo={() => {
            setBorrador(VACIO);
            setFotos([]);
            ir({ v: 'cliente' });
          }}
          onContinuar={() => ir({ v: 'lineas' })}
          onDescartar={() => {
            setBorrador(VACIO);
            setFotos([]);
          }}
          onVer={id => ir({ v: 'detalle', id })}
          onCambiarRepartidor={() => setRepartidor(null)}
        />
      );
  }
}
