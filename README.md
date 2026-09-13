# CancioneroIEMA

Cancionero digital para presentación de letras en pantalla (stage), con presentador, viewer, lista por sala, editor de canciones y administración.

Sitio público: [https://becerrapedro4.github.io/CancioneroIEMA/](https://becerrapedro4.github.io/CancioneroIEMA/)

---

## 🎯 Qué es

Un sistema para un grupo, congregación o iglesia que necesita:

- Tener un biblioteca de canciones con título, artista y letra (estrofas separadas por línea en blanco).
- Presentar cancionesIndividuales o listas completas en una pantalla de stage.
- Ver la presentación en tiempo real desde otra pantalla/tablet/celu vía viewer.
- Organizar listas de canciones para el mismo evento (Mis Listas).
- Compartir listas con otros mediante link.
- Administrar canciones, listas globales y configuración desde una página protegida.

---

## 🧭 Páginas principales

### `index.html` — Buscador y usuaria

Es la página principal. Desde allí se hace todo lo que un usuario normal necesita.

#### Pestañas principales

- **Canciones**: buscador por título o letra, listado paginado, selección múltiple, detalle de canción.
- **Mis Listas**: listas propias del dispositivo, listas globales de la iglesia, creación, edición local, presentar lista, exportar.
- **📖 Biblia**: enlace a `biblia.html`.

#### Accesos rápidos

- **⚙️ Configuración** (click normal en la rueda): cambiar nombre de sala, ver y copiar link del viewer, abrir QR para escanear, abrir lista en vista dividida (`lista.html`), exportar PDF.
- **Admin** (5 taps rápidos en el título “Buscador de Canciones”): panel de administración dentro del mismo index.

#### Efectos de la configuración de sala

Al configurar la sala, el presente, el viewer, el stage y la lista en vivo se sincronizan por ese nombre de sala.

Sala → Firebase realtime (`rooms/<sala>/currentSong`) + mensajes del stage (`rooms/<sala>/messages`).

Mientras se presenta, el dispositivo suma su sala al índice de presencia (`rooms/_salas`), que es lo que después permite elegir esa sala desde el admin.

---

### `admin.html` — Administración protegida

Página separada, protegida con contraseña.

Sirve para:

- Editar canciones (título, artista, letra).
- Crear nuevas canciones.
- Eliminar canciones.
- Exportar la base actual como `Holyrics_Backup.json`.
- Mensajes del stage (ver, enviar, eliminar y elegir a qué sala se mandan).
- Cambios sugeridos en las letras: ver, aplicar al repo, rechazar o quitar.
- Configuración global: mostrar/ocultar botón HTML, estilo de portada, color de acento.
- Editor en vivo: título del evento, etiqueta, pie de página, logo, estilo, color, publicar.
- Listas globales: crear, editar, agregar canciones, reordenar, eliminar, guardar en el repo.

Solo quien tiene la contraseña puede entrar (`CoroIEMA`).

---

### `viewer.html` — Pantalla de presentación

Muestra la canción actual que está siendo presentada en la sala elegida.

Muestra:

- Título (si el presentador lo tiene activado).
- Estrofa actual en grande.
- Estrofa siguiente atenuada (si el presentador tiene “Ver siguiente” activado).

Lee `rooms/<sala>/currentSong`.

---

### `stage.html` — Stage (pantalla para proyectar)

La pantalla que se conecta a la sala y muestra la letra que va presentando el presentador.

Lee `rooms/<sala>/currentSong`.

---

### `lista.html` — Vista dividida de lista + letra

Muestra a la izquierda una lista de canciones y a la derecha la letra de la canción actual que se está presentando en la sala.

Es útil para:

- Tener una pantalla auxiliar con lista + letra simultáneamente.
- Ver el progreso de la lista (actual, pasada, pendiente).

Lee cola y canción actual vía Firebase.

---

### `share.html` — Mostrar lista compartida

Página pública que recibe una lista por URL y muestra sus canciones con letra.

Ejemplo:

```
https://becerrapedro4.github.io/CancioneroIEMA/share.html?name=Lista+Nombre#id1,id2,id3
```

Carga `canciones.json` del repo y muestra solo las canciones que figuran en el link.

---

### `control.html` y `login.html`

Redirigen a `index.html`. Se mantienen para no romper enlaces viejos.

---

## ✨ Funciones clave

### Biblioteca de canciones

- Carga el repo vía `canciones.json`.
- Persiste en `localStorage` cambios locales.
- El repo es la fuente de verdad para usuarios normales.
- Las canciones creadas por el admin se mantienen como “locales” porque tienen ID string propio.

### Presentación individual

Desde el detalle de una canción se puede:

- Presentar canciones completa.
- Poner pantalla en blanco.
- Activar/desactivar título.
- Activar/desactivar cita/referencia.
- Activar/desactivar vista previa de la siguiente estrofa.
- Terminar la presentación.

El presentador escribe en Firebase `rooms/<sala>/currentSong` con:

- id, titulo, estrofa, label, estrofas, idx, total, blank, showTitle, showRef, showNext, listId, queue, queueIdx, ts.

### Presentación de lista

Desde “Mis Listas” se puede presentar una lista completa.

El presentador de lista en `index.html` está en modo cola:

- Navegación entre canciones con botones ‹ › o Av/Re Pág.
- Flechas para avanzar estrofa.
- Al llegar al final de una canción, se pasa a la siguiente automáticamente.
- Indica “Lista · X de Y”.

### Vista dividida `lista.html`

Una pantalla auxiliar que muestra:

- Lista de canciones a la izquierda.
- Letra actual a la derecha.
- Indicador de progreso por color.
- Actualización en tiempo real.

### Mensajes del stage

El admin puede:

- Ver los mensajes del stage conectados a la sala.
- Enviar mensajes al stage.
- Eliminar mensajes individuales.
- **Elegir a qué sala se mandan**: un campo de texto más los accesos rápidos de las
  salas conocidas (las activas primero, con 🟢 y quién está conectado: stage,
  presentador o ambos), y un botón "📍 Este dispositivo" para volver a la sala
  propia. La sala elegida queda guardada y se muestra debajo del campo
  ("Los mensajes van a la sala …").

Las salas conocidas salen del índice de presencia (`rooms/_salas`, ver Firebase),
que publican el stage y los presentadores; las que no se usan hace un mes se
borran solas al entrar al admin.

### Sugerencias de cambio en las letras

Cualquier usuario puede proponer una corrección de letra desde el buscador: en el
detalle de una canción toca **“💡 Sugerir un cambio en la letra”** (o el
**“✏️ sugerir un cambio”** de una estrofa puntual), elige la estrofa, escribe cómo
quedaría, puede dejar su nombre y un comentario, y lo manda. **La canción no
cambia**: queda como propuesta pendiente.

El admin las ve en **Admin → 💡 Cambios sugeridos en las letras**, con el texto
actual y el propuesto lado a lado, quién la mandó y cuándo, y puede:

- **✔ Aplicar a la canción** — reemplaza solo esa estrofa en `canciones.json`
  (rama de trabajo del admin) y recalcula el texto completo. Después hay que
  publicarla con **🚀 Publicar en main** para que la vean todos.
- **✕ Rechazar** — la canción queda igual y la sugerencia se marca como rechazada.
- **🗑 Quitar de la lista** — la borra (para limpiar las ya resueltas).

Al aplicar, si dos personas sugirieron sobre la misma canción, el cambio se ubica
**por el texto original** y no por el número de estrofa, así no se aplica en el
lugar equivocado. Si ese texto ya cambió, el admin decide y puede cancelar sin
tocar nada. Una sugerencia nunca pisa el trabajo de un usuario local: si la
canción no está en la base del repo, el admin recibe el aviso.

---

## 🔐 Admin vs usuario

### Usuario normal

Puede:

- Buscar y ver canciones.
- Crear, editar y eliminar listas propias.
- Presentar canciones o listas.
- Exportar PDF y compartir listas.
- Ver QR y link de sala.
- Ver listas globales (solo lectura).
- Sugerir cambios en las letras (los revisa el admin).

No puede:

- Ver ni enviar mensajes del stage.
- Ver el panel admin.
- Tocar el repo.

### Admin

Además de todo lo de usuario, puede:

- Entrar a `admin.html` con contraseña.
- Editar canciones y guardar cambios en el repo.
- Crear y eliminar canciones.
- Configurar botón HTML, estilo, color de acento.
- Usar el editor en vivo.
- Crear y editar listas globales.
- Guardar listas globales en el repo.

---

## 🌐 Listas globales vs listas propias

### Listas propias

- Viven en `localStorage` de cada dispositivo.
- Las crea y edita el usuario desde index.
- Solo la persona que las crea las ve y edita.

### Listas globales

- Viven en `listas.json` del repo.
- Las crea y edita solo el admin desde `admin.html`.
- Aparecen en “Mis Listas” de todos los usuarios como **🌐 Global**.
- Los usuarios pueden presentarlas, verlas, exportarlas, compartirlas.
- Los usuarios NO pueden editarlas ni borrarlas ni agregar canciones.
- Quien las edita es el admin.

---

## 🔗 Compartir listas

Desde una lista expandida hay botón **📋 Compartir**.

Genera un link con formato:

```
https://becerrapedro4.github.io/CancioneroIEMA/share.html?name=Lista+Nombre#id1,id2,id3
```

Quien abre el link:

- Carga `canciones.json` del repo.
- Filtra por los IDs del link.
- Muestra la lista con sus letras.

---

## 📄 Exportar

### PDF

Desde el perfil de lista o desde configuración se puede exportar la lista en dos modos:

- **1 canción por hoja**
- **Varias canciones por hoja**

El estilo y color usan los ajustes configurados.

### HTML

Solo el admin puede ver el botón **⬇ HTML** en las listas.

El HTML se exporta según los ajustes configurados por el admin:

- Estilo de portada.
- Color de acento.
- Toggle de visibilidad.

---

## 🛠 Admin: sincronización con el repo

Para que los cambios del admin se reflejen en todos lados:

1. El admin ingresa a `admin.html` con contraseña.
2. Configura su GitHub Personal Access Token (PAT) con scope `repo`.
3. El admin carga canciones desde el repo vía `canciones.json`.
4. Cuando guarda, el admin hace commit directo a `mejoras` del repo con el contenido actualizado.
5. GitHub Pages reconstruye y los cambios aparecen en la próxima recarga.

El mismo mecanismo sirve para listas globales (`listas.json`).

---

## 🔑 Requisitos del admin

### Contraseña

Es fija (`CoroIEMA`) y en el código solo está su hash SHA-256. No se guarda por
dispositivo ni se puede cambiar desde la página. Es una barrera de navegador, no
seguridad real: el sitio es estático. La protección efectiva de la base es el PAT.

### GitHub PAT

Necesario para escribir en el repo y en las listas globales.

Crear en:

```
https://github.com/settings/tokens/new?scopes=repo&description=CancioneroIEMA
```

Scope requerido: `repo`.

El PAT se guarda en `localStorage` del navegador del admin.

---

## 🗃 Estructura del repo usado por la app

- `/canciones.json` — base de canciones.
- `/listas.json` — listas globales (admin solo).
- `/index.html` — buscador y usuaria.
- `/admin.html` — admin protegido.
- `/viewer.html` — viewer del stage.
- `/stage.html` — stage proyectado.
- `/lista.html` — vista dividida lista + letra.
- `/share.html` — visualizador de lista compartida.
- `/biblia.html` — biblia (puede tener su propia lógica).
- `/control.html`, `/login.html` — redirección a index.
- `/js/firebase-init.js` — configuración de Firebase única del proyecto.
- `/js/export-html.js` — generador del HTML exportable (lo usan index y admin).
- `/js/rooms-index.js` — índice de salas activas: publica presencia y la lee el admin.
- `/js/sugerencias.js` — sugerencias de cambio en las letras: las crea el usuario y las resuelve el admin.

---

## 🧩 Firebase

La app usa Firebase Realtime Database para sincronizar en vivo:

- `rooms/<sala>/currentSong` — canción actual del presentador.
- `rooms/<sala>/messages` — mensajes del stage.
- `rooms/_sugerencias/<id>` — sugerencias de cambio en las letras que mandan los
  usuarios (`{ songId, title, idx, antes, propuesta, nota, autor, ts, estado }`),
  con `estado` en `pendiente` / `aplicada` / `rechazada`. También dentro de
  `rooms/` por las mismas reglas.
- `rooms/_salas/<sala>` — índice de presencia (quién está activo y dónde). No es
  una sala real: es un "cuarto" reservado donde el `stage` y los presentadores
  publican un latido cada 25 s (`{ ts, online, mode, song }`) y se marcan offline
  al cerrar la pestaña o perder la conexión. Lo lee el admin para poder elegir a
  qué sala mandar los mensajes. Vive dentro de `rooms/` porque las reglas de la
  base solo permiten leer y escribir bajo ese nodo.

La sala se elige desde la configuración. Todos los participantes de la misma sala ven lo mismo.

---

## ⚠️ Notas importantes

- Las canciones de usuarios normales no se escriben en el repo. Solo las crea el admin desde `admin.html`.
- Para que un cambio del admin aparezca en todos los dispositivos, el admin debe guardar en el repo y luego los usuarios recargar la página.
- `canciones.json` pesa bastante; el admin carga el archivo raw del repo, no por la API de contenidos.

---

## 🧹 Limpieza de datos del usuario

Si un usuario se quedó con canciones viejas en `localStorage` que ya no están en el repo, la app las conserva solo si son creaciones locales. En caso de ambigüedad, el repo es la fuente de verdad.

---

## 📌 Buenas prácticas al compartir

- Para compartir una lista, abrirla expandida, tocar **📋 Compartir** y pegar el link.
- Para presentar en otra pantalla, abrir `viewer.html` o `lista.html` con `?room=<sala>`.
- Para escanear desde celular, usar el QR de la configuración de sala.

---

## 🧭 Flujo común

1. Admin crea/actualiza canciones desde `admin.html`.
2. Admin guarda en repo.
3. Usuarios recargan y ven las novedades.
4. Admin puede armar listas globales que ven todos.
5. Cada usuario puede armar sus listas propias.
6. Se acerca el momento de presentar: se configura la sala, se abre el presentador o la lista, se abre viewer/stage/lista en la pantalla correspondiente.
7. Si se quiere compartir con alguien que no está en el lugar, se usa **📋 Compartir**.

---

## 📌 Estado actual del proyecto

- Repo público: `becerrapedro4/CancioneroIEMA`.
- Branch público servido por GitHub Pages: `main`.
- Branch de desarrollo: `mejoras`.

---

## 📄 Nota final

Este README es referencia general del servicio. Algunos detalles técnicos pueden cambiar con el tiempo, pero la idea central se mantiene: biblioteca de canciones, presentación por sala, listas globales administradas por el admin, y compartición simple.
