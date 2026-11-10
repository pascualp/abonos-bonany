import { useEffect, useState, type FormEvent } from 'react';
import { FirebaseError } from 'firebase/app';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { AlertCircle, ClipboardList, Database, Loader2, LogIn, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';
import { AbonosView } from './AbonosView';
import { CatalogoView } from './CatalogoView';

const ERRORES: Record<string, string> = {
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/wrong-password': 'Email o contraseña incorrectos.',
  'auth/user-not-found': 'Email o contraseña incorrectos.',
  'auth/invalid-email': 'El email no tiene un formato válido.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
  'auth/network-request-failed': 'Sin conexión.',
};

export default function OfficeApp() {
  const [user, setUser] = useState<User | null>(null);
  const [comprobando, setComprobando] = useState(true);
  useEffect(
    () =>
      onAuthStateChanged(auth, u => {
        setUser(u);
        setComprobando(false);
      }),
    [],
  );

  if (comprobando) return null;
  // Una sesión anónima es de repartidor: en oficina hay que entrar con cuenta.
  if (!user || user.isAnonymous) return <Login />;
  return <Oficina user={user} />;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      setError(ERRORES[code] ?? `No se pudo entrar (${code || 'error'}).`);
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 grid place-items-center p-4">
      <form onSubmit={entrar} className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-slate-800">Abonos Bonany · Oficina</h1>
          <p className="text-sm text-slate-500">Misma cuenta que Flotas Bonany</p>
        </div>
        <label className="block text-xs font-bold text-slate-500 uppercase">
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-lg p-2.5 text-sm font-normal normal-case text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </label>
        <label className="block text-xs font-bold text-slate-500 uppercase">
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-lg p-2.5 text-sm font-normal normal-case text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </label>
        {error && (
          <p role="alert" className="flex gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-blue-600 text-white font-bold rounded-xl p-3 text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60"
        >
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Entrar
        </button>
      </form>
    </div>
  );
}

type Pestana = 'abonos' | 'catalogo';

function Oficina({ user }: { user: User }) {
  const [pestana, setPestana] = useState<Pestana>('abonos');
  const usuario = user.email ?? user.uid;

  const boton = (p: Pestana, texto: string, Icono: typeof ClipboardList) => (
    <button
      type="button"
      onClick={() => setPestana(p)}
      aria-current={pestana === p ? 'page' : undefined}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
        pestana === p ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icono className="w-4 h-4" />
      {texto}
    </button>
  );

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <h1 className="font-bold text-lg mr-auto">Abonos Bonany · Oficina</h1>
          <nav className="flex gap-1">
            {boton('abonos', 'Abonos', ClipboardList)}
            {boton('catalogo', 'Clientes y productos', Database)}
          </nav>
          <span className="text-sm text-slate-500 hidden sm:inline">{usuario}</span>
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-red-600 px-2 py-2"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {pestana === 'abonos' ? <AbonosView usuario={usuario} /> : <CatalogoView usuario={usuario} />}
      </main>
    </div>
  );
}
