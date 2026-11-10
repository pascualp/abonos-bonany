import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Mismo proyecto y base de datos que Flotas Bonany. La configuración web no es
// secreta: el acceso lo controla firestore.rules.
const firebaseConfig = {
  apiKey: 'AIzaSyBYsL02Skr7gEfTM4rnImR8JVUtXCFEsZM',
  authDomain: 'gen-lang-client-0006222540.firebaseapp.com',
  projectId: 'gen-lang-client-0006222540',
  storageBucket: 'gen-lang-client-0006222540.firebasestorage.app',
  messagingSenderId: '1093488651129',
  appId: '1:1093488651129:web:f09bce253a4ad2190d5da8',
};

const DATABASE_ID = 'ai-studio-fleetflow-d05cc4cc-ab71-46f2-9a22-2419c0f125f8';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Caché persistente: el catálogo se lee sin cobertura y los abonos creados sin
// señal se guardan en el móvil y se envían solos al volver la conexión.
export const db = initializeFirestore(
  app,
  { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) },
  DATABASE_ID,
);
export const auth = getAuth(app);
