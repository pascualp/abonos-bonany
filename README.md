# Abonos Bonany

Los repartidores apuntan las devoluciones **desde el móvil, en el momento**, y
la oficina las ve al instante para hacer el abono.

React 19 + Vite + Tailwind CSS 4 + Firebase. Usa **el mismo proyecto y la
misma base de datos que Flotas Bonany**.

| Quién | Dirección | Cómo entra |
|---|---|---|
| Repartidor | `https://<dominio>/` | Elige su nombre de una lista (sin contraseña) |
| Oficina | `https://<dominio>/oficina` | Email y contraseña (las mismas cuentas que Flotas) |

## Cómo funciona

**Repartidor** (pensado para escribir lo mínimo):

1. La primera vez elige quién es. El móvil lo recuerda.
2. *Nuevo abono* → elige el cliente. Arriba salen los últimos que ha usado.
3. Toca el producto, pone la cantidad con + / − y toca el motivo.
4. Si quiere, hace hasta 3 fotos y escribe una nota. *Guardar abono*.

**Sin cobertura** también funciona: el abono se guarda en el móvil y se envía
solo cuando vuelve la señal (en la lista sale «Sin enviar» hasta entonces). El
repartidor puede borrar un abono suyo mientras siga pendiente.

**Oficina**:

- *Abonos*: filtros por fechas, estado, repartidor y texto. Al pulsar uno se
  ven sus fotos. *Tramitar* lo marca como hecho. *Excel* descarga un CSV con
  una fila por producto.
- *Clientes y productos*: subir el Excel de clientes y el de productos
  (`.xlsx`, `.xls` o `.csv`) y elegir qué columna es el código, el nombre y la
  población o la unidad. Cada subida **sustituye** la lista anterior. Aquí
  también se añaden y se quitan repartidores.

Los motivos de devolución están en `src/lib/types.ts` (`MOTIVOS`).

## Puesta en marcha (una sola vez)

1. **Activar el acceso anónimo** en Firebase Console → *Authentication* →
   *Sign-in method* → **Anónimo** → Habilitar. Sin esto los repartidores no
   pueden entrar.
2. **Desplegar las reglas de seguridad**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules
   ```
   ⚠️ Las reglas son **comunes a Flotas y Abonos** (comparten base de datos y
   cada despliegue sustituye las anteriores). `firestore.rules` tiene que ser
   idéntico en `flota/` y en `abonos/`; si cambias uno, copia al otro.
3. **Publicar en Vercel**: proyecto nuevo apuntando a esta carpeta (o a su
   repositorio). Framework *Vite*, sin variables de entorno.
4. Entrar en `/oficina`, añadir los repartidores y subir los Excel.
5. Pasar el enlace a los repartidores. En el móvil: menú del navegador →
   **Añadir a pantalla de inicio**, y queda como una app.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3001  (oficina: /oficina)
npm run lint     # comprobación de tipos
npm run build
```

`preview.html` (solo en local, no se sube) enseña las pantallas del móvil con
datos de ejemplo: `http://localhost:3001/preview.html?p=inicio` (también
`cliente`, `cantidad`, `lineas` y `final`).

## Datos (Firestore)

- `catalogo/repartidores`: `{ lista: [{ id, nombre }] }`.
- `catalogo/clientes-<versión>-<n>` y `catalogo/productos-<versión>-<n>`: la
  lista empaquetada en pocos documentos (`"código\tnombre\textra"`), para que
  cada móvil lea 1-2 documentos y no miles.
- `abonos/{id}`: repartidor, cliente, `lineas[]` (producto, cantidad, unidad,
  motivo), nota, fecha y hora del móvil, estado `pendiente` / `tramitado`.
- `abonos/{id}/fotos/{0..2}`: fotos en JPEG reducido (~150 KB), aparte para que
  la lista de la oficina cargue rápido.

## Seguridad

- Los repartidores tienen sesión anónima: solo pueden **leer el catálogo** y
  **crear y ver sus propios abonos**. No ven los de otros ni nada de Flotas.
- La oficina (cuenta con contraseña) lo ve y lo gestiona todo.
- Ojo: cualquiera que tenga el enlace puede abrir la parte del repartidor y ver
  la lista de clientes y productos, y podría meter abonos falsos (quedan
  pendientes hasta que la oficina los revisa). Si hace falta cerrarlo más, se
  puede añadir un PIN por repartidor.
