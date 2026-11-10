import { useCallback, useEffect, useState } from 'react';

interface Entrada<T> {
  vista: T;
  d: number;
}

/**
 * Navegación entre pantallas apoyada en el historial del navegador, para que
 * el botón "atrás" del móvil vuelva a la pantalla anterior en vez de salir de
 * la app.
 */
export function useNav<T>(inicial: T) {
  const [vista, setVista] = useState<T>(inicial);

  useEffect(() => {
    history.replaceState({ vista: inicial, d: 0 } satisfies Entrada<T>, '');
    const onPop = (e: PopStateEvent) =>
      setVista((e.state as Entrada<T> | null)?.vista ?? inicial);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // `inicial` es fijo durante toda la vida de la app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profundidad = () => (history.state as Entrada<T> | null)?.d ?? 0;

  const ir = useCallback((v: T) => {
    history.pushState({ vista: v, d: profundidad() + 1 } satisfies Entrada<T>, '');
    setVista(v);
  }, []);

  const atras = useCallback(() => history.back(), []);

  /** Vuelve a la primera pantalla y deja el historial limpio. */
  const alInicio = useCallback(() => {
    const d = profundidad();
    if (d > 0) history.go(-d);
    else setVista(inicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { vista, ir, atras, alInicio };
}
