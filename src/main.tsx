import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import DriverApp from './driver/DriverApp';
import '../index.css';

// La oficina va en otro trozo para que el móvil del repartidor no lo descargue.
const OfficeApp = lazy(() => import('./office/OfficeApp'));

const esOficina = window.location.pathname.startsWith('/oficina');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {esOficina ? (
      <Suspense fallback={null}>
        <OfficeApp />
      </Suspense>
    ) : (
      <DriverApp />
    )}
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD && !esOficina) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}
