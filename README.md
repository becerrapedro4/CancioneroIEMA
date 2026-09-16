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

- **Canciones**: buscador por título o letra (y artista), listado paginado, selección múltiple, detalle de canción. La barra de búsqueda queda pegada arriba mientras se scrollea, así se puede cambiar la búsqueda sin volver al principio; en pantalla chica la ruedita de configuración baja un poco mientras la barra está pegada, para no taparle el botón de seleccionar.
- **Mis Listas**: listas propias del dispositivo, listas globales de la iglesia, creación, edición local, presentar lista, exportar.
- **📖 Biblia**: enlace a `biblia.html`.

#### Accesos rápidos

- **⚙️ Configuración** (click normal en la rueda): cambiar nombre de sala, ver y copiar link del viewer, abrir QR para escanear, abrir lista en vista dividida (`lista.html`), exportar PDF.
- **Admin** (5 taps rápidos en el título “Buscador de Canciones”): panel de administración dentro del mismo index, con las pestañas de nueva canción, eliminar canciones, mensajes, sala y **⬇ Exportar `Holyrics_Backup.json`**, que baja la base en el formato de Holyrics.

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
- **⬇ Exportar base**: baja el cancionero cargado como `Holyrics_Backup.json`, en el
  formato de Holyrics. Incluye los cambios que todavía no publicaste.
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

Lee `rooms/<sala>/currentSong`. Si esa sala tiene una **conexión de Holyrics**
(ver más abajo) y hay una lectura fresca de lo que Holyrics tiene en pantalla, muestra
**eso**: la presentación en curso, la diapositiva siguiente y la numeración, con los
mismos tres presets. Un `blank` / `stop` del presentador manda siempre: apaga la pantalla
igual. Cuando la lectura se pone vieja (se cortó el puente), vuelve sola a lo que manda el
presentador.

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

### Forma del texto y búsquedas

- **Mayúsculas siempre**: sin importar de dónde venga la canción (repo, JSON
  importado, `localStorage` o tecleada a mano), el título, el artista, el autor y
  la letra se guardan y se muestran en mayúsculas. Se aplica al cargar y al
  guardar, en el buscador, en el admin y en las páginas que leen el cancionero
  (`share.html`), así que una canción escrita en minúsculas no se distingue de
  las demás.
- **Búsquedas sin tildes ni signos**: todos los buscadores (el del buscador de
  canciones, el panel de borrado, la lista del admin, el selector de canciones de
  las listas globales y la búsqueda en la Biblia) comparan sin distinguir tildes,
  mayúsculas, espacios ni signos de puntuación: “me gozare asi como david” y
  “me gozaré, así como David” encuentran lo mismo, y el texto resaltado sigue
  siendo el original.
- Las dos reglas viven en un solo módulo, `js/texto.js` (ver estructura del repo).

### El formato Holyrics del cancionero

`canciones.json` **es un backup de Holyrics**: así lo exporta y así lo importa el
programa. La app lo edita (admin, sugerencias) y lo exporta, pero el archivo tiene
que seguir siendo el mismo formato, o Holyrics deja de poder leerlo. De esa forma
se ocupa `js/holyrics.js` (ver estructura del repo), que garantiza:

- **Todos los campos de Holyrics en cada canción**, en su orden: `id, title,
  artist, author, note, copyright, language, key, bpm, time_sig, midi, order,
  arrangements, lyrics, streaming, extras`. Lo que la canción ya traía va tal cual
  (`midi`, `bpm`, `key`, los links de `streaming`, `extras`…); lo que le faltaba se
  completa con el valor vacío de Holyrics, así una canción creada en la app no
  entra con otra forma.
- **Nada se pierde al editar**: los comentarios de estrofa (`text_with_comment`),
  las descripciones, `full_text_with_comment` y los campos extra siguen ahí. Lo
  único que se canoniza es el texto (mayúsculas, ver arriba); `key`, `time_sig`,
  `language` y `bpm` no se tocan.

Todos los caminos que escriben el cancionero pasan por ahí: el guardado del admin,
las canciones que se agregan desde el buscador o desde el admin, y los dos botones
de exportar:

- **⬇ Exportar base** (en admin.html) baja el cancionero cargado, con los cambios
  sin publicar incluidos.
- **⬇ Exportar Holyrics_Backup.json** (en el panel escondido de index, 5 taps en el
  título) baja el archivo del repo tal como está —sin reconstruirlo desde la copia
  liviana que usa el buscador, que perdía `streaming`, `extras`, `midi` y los
  comentarios— y le agrega las canciones propias del dispositivo; las borradas en
  ese dispositivo no salen.

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

### Sugerencias de cambio en el cancionero

El usuario trabaja libre en su navegador: sus canciones y sus listas viven en el
`localStorage` y **no tocan el repo**. Lo que sí puede hacer es *avisarle al
admin*, y son tres cosas, todas con el mismo camino y el mismo canal:

- **Cambiar una letra** — abre la canción, toca **✏️ Editar**, corrige la letra y
  en el mismo editor toca **“💡 Sugerir cambio”**. Se abre un formulario con **la
  letra completa** como quedaría, donde puede dejar su nombre y un comentario.
  (El detalle de la canción no tiene botones por estrofa: la sugerencia se hace
  editando la letra.)
- **Agregar una canción** — la crea desde el buscador (**✏️ Nueva canción**) y se
  le manda al admin entera, tal como la escribió.
- **Borrar una canción** — la borra de su buscador y, si esa canción está en el
  cancionero del repo, le pide al admin que la saque del cancionero de todos.

En los tres casos **nada del repo cambia**: queda como propuesta pendiente hasta
que el admin la apruebe.

El admin las ve en **Admin → 💡 Cambios sugeridos**, cada tarjeta con su etiqueta
(✏️ cambio de letra / ➕ canción nueva / 🗑 borrar canción), quién la mandó y
cuándo, y puede:

- **✔ Aplicar a la canción** — cambia **solo las estrofas que la persona
  escribió distinto** en `canciones.json` (rama de trabajo del admin) y recalcula
  el texto completo. Las estrofas que no se tocaron quedan byte por byte iguales
  (número, descripción y texto con comentarios incluidos).
- **✔ Agregar al cancionero** — suma la canción nueva a la base. Si ya hay una
  del mismo título, avisa y pregunta antes de agregarla igual.
- **✔ Borrar del cancionero** — la saca de la base y, si estaba en alguna **lista
  global**, la quita de esa lista (así ninguna lista queda con un hueco).
- **✕ Rechazar** — todo queda igual y la sugerencia se marca como rechazada.
- **🗑 Quitar de la lista** — la borra (para limpiar las ya resueltas).

Después de aprobar hay que publicar con **🚀 Publicar en main** para que lo vean
todos.

Al aplicar se compara la letra actual del repo con la que la persona vio al
sugerir (sin contar espacios, saltos de más ni mayúsculas): si cambió, el admin recibe el
aviso y puede cancelar sin tocar nada. Si la canción **ya tiene** esa letra (dos
personas sugirieron lo mismo, o el admin ya la arregló a mano), no escribe nada al
repo: solo marca la sugerencia como aplicada. Un pedido de borrar de una canción
que ya no está marca la sugerencia como aplicada sin escribir. Lo que se escriba
en minúsculas se guarda en mayúsculas, igual que el resto del cancionero. Una
sugerencia nunca pisa el trabajo de un usuario local: si la canción no está en la
base del repo, el admin recibe el aviso igual.

El "antes" que revisa el admin es la letra de la base del repo, no la copia que
el usuario tenga editada en su navegador: por eso el resumen del admin muestra lo
que realmente hay guardado, y el aviso de “la letra cambió” solo aparece cuando
cambió de verdad.

---

### Canciones repetidas (depuración)

En **Admin → 🧹 Canciones repetidas** aparecen los grupos de canciones que son la
misma, en dos formas:

- **Mismo título, escrito distinto**: difieren solo en tildes, mayúsculas, signos
  o espacios (`PODEROSO DIOS` dos veces, `EN EL NOMBRE DE JESUS` y
  `En El Nombre de Jesús`, `¿QUÉ NIÑO ES ESTE?` y `QUE NIÑO ES ESTE`…).
- **Misma letra, otro título**: la letra es idéntica pero el título no
  (`VENID Y ADOREMOS` y `VENID FIELES TODOS`).
- **Letra muy parecida, otro título**: la letra coincide en el 90% o más de sus
  palabras distintas (`COMO DIJISTE` y `VEN SEÑOR` al 96%, `DING DONG LLEGÓ
  NAVIDAD` y `DING DIN DONG`, `POR SU GRACIA ( GOOD GRACE )` y `POR TU GRACIA`…).
  Esta última forma es orientativa: dos canciones distintas que comparten el
  estribillo pueden aparecer juntas, y por eso el admin decide (o elige **dejar el
  grupo como está**).

Cada grupo muestra las canciones que lo forman con lo que las diferencia (artista,
cantidad de estrofas, comentarios, descripciones, largo de la letra), cuál
conviene conservar (la más completa; si empatan, la más antigua) y **por qué**. El
admin elige una y resuelve:

- **✔ Quedarme con la elegida y borrar las demás** — guarda en `mejoras` la base
  sin las repetidas y reapunta a la que queda las listas globales que nombraban a
  las borradas. La canción que queda se guarda tal cual está: no se le toca
  ninguna estrofa, descripción ni texto con comentarios. Después hay que publicar
  con **🚀 Publicar en main**.
- **🗐 Dejar el grupo como está** — no cambia nada y el grupo queda anotado en ese
  navegador (↻ Revisar de nuevo lo trae de vuelta).

**No se cambia nada hasta que el admin resuelve.** La herramienta no fusiona
letras ni une títulos: solo detecta, recomienda y borra lo repetido cuando el
admin lo confirma.

---

## 🎦 Holyrics: que el stage muestre lo que Holyrics tiene en pantalla

Además de presentar con la app, la sala puede **seguir a Holyrics**: el stage muestra la
diapositiva que Holyrics está proyectando y la siguiente, con los tres presets de siempre
(lista + actual y siguiente, solo actual y siguiente, lista + actual). En ese modo la
lista del costado son las diapositivas de la presentación que Holyrics tiene cargada.

### Cómo se configura (admin → 🎦 Holyrics)

1. En Holyrics: **Configuración → API Server**. Ahí se ve la IP, el puerto (por defecto
   `8091`) y el **token** de acceso (opción «administrar permisos»).
2. En el admin se cargan la IP, el puerto y el token, y **🔌 Probar conexión** dice si
   Holyrics contesta y con qué versión (o el motivo exacto si no).
3. Se elige la **sala** y se toca **📤 Enviar conexión a esa sala**. Eso escribe
   `rooms/<sala>/holyrics`; desde ahí el stage de esa sala la usa y el puente la lee.
   **⏻ Quitar de esa sala** borra la conexión y el stage vuelve a lo del presentador.

### El puente (`puente-holyrics.js`)

```
node puente-holyrics.js --sala NOMBRE_DE_LA_SALA
```

Corre en la **misma PC que Holyrics**, sin instalar nada (Node 18+), y hace dos cosas cada
`--cada` ms (1500 por defecto): le pregunta a Holyrics qué tiene en pantalla y lo publica en
`rooms/<sala>/holyrics/now`. También acepta `--host`, `--puerto`, `--token` para probar sin
cargar nada en el admin, `--db` para apuntar a otra base y `--una` para un solo ciclo.

**Hace falta cuando el stage se abre desde la página publicada.** Una página servida por
HTTPS no puede pedirle nada al API HTTP de la PC (el navegador bloquea el contenido mixto
antes de intentarlo), y desde GitHub Pages esa es siempre la situación. Si el stage se abre
desde la misma PC en `http://`, además prueba leerlo directo, siempre que Holyrics permita
la conexión del navegador.

### Qué se ve cuando algo falta

- Sin conexión cargada: el stage funciona como siempre.
- Con conexión y sin puente: el stage avisa en el pie (`🎦 Holyrics (esperando al puente)`) y
  sigue mostrando lo que manda el presentador.
- Si el puente se corta: la última lectura queda vieja a los 8 s y el stage vuelve solo a lo
  del presentador.

### Dos cosas a tener en cuenta

- El **token** que se guarda en la sala es el del API Server local (no el `api_key` de
  internet) y queda en una base que se lee sin login: cualquiera que lea esa rama lo ve.
- El servicio de internet de Holyrics (`api.holyrics.com.br`) **no se usa**: no manda
  cabeceras CORS, así que un navegador no puede leer sus respuestas. Es la razón de que el
  puente corra en la PC.

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
- Editar canciones y guardar cambios en el repo. El editor guarda **solo las
  estrofas que se cambiaron**: las demás quedan byte por byte iguales (número,
  descripción, texto con comentarios y campos extra), aunque se reescriba la letra
  entera en el formulario. No deja guardar una canción con la letra vacía.
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
- Una lista guarda **ids** de canciones, así que puede quedar apuntando a una canción
  que ya no está: si el admin la borra del repo, acá se saca de la lista sola y se
  vuelve a guardar, apenas se recarga la página o se borra la canción a mano. Las
  listas que se resuelven enteras no se tocan. El contador de una lista cuenta las
  canciones que de verdad se van a ver.

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

El mismo mecanismo sirve para listas globales (`listas.json`) y para la
  depuración de canciones repetidas (que además reapunta las listas globales).

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
- `/js/duplicadas.js` — canciones repetidas: agrupa las que son la misma (el
  mismo título escrito distinto, la misma letra con otro título o la letra casi
  igual —90% o más de las palabras distintas—), dice cuál
  conviene conservar y por qué, y devuelve la lista nueva y las listas globales
  reapuntadas. No escribe nada: el admin decide desde su panel.
- `/puente-holyrics.js` — el puente entre la página y Holyrics (ver 🎦 Holyrics).
- `/js/holyrics-api.js` — la conexión con Holyrics: la dirección, el puerto y el token
  del API Server; qué significa cada error (no llegar, contenido mixto, token inválido,
  sin permiso); cómo se convierte lo que Holyrics tiene en pantalla en los textos del
  stage; y qué se guarda en `rooms/<sala>/holyrics`. Es el único lugar donde se decide
  eso: lo usan el admin, el stage y el puente.
- `/js/rooms-index.js` — índice de salas activas: publica presencia y la lee el admin.
- `/js/holyrics.js` — la forma Holyrics de una canción (la del archivo
  `canciones.json`): `cancion` deja cualquier canción —del repo o liviana del
  buscador— con los 16 campos de Holyrics en su orden, los párrafos con sus cinco
  claves y todo lo que la canción ya tenía intacto (`streaming`, `extras`, `midi`,
  comentarios de estrofa, descripciones, campos extra), completando lo que falte
  con el valor vacío de Holyrics. Es el único lugar donde se decide esa forma: lo
  usan el admin al cargar y guardar, la canción nueva del buscador y del admin, y
  el export `Holyrics_Backup.json`.
- `/js/texto.js` — la forma canónica del texto del cancionero: `titulo` / `mayus`
  (mayúsculas y espacios colapsados), `cancion` / `parrafos` / `estrofas` (dejan
  una canción o unas estrofas en esa forma) y las claves de búsqueda
  (`clave`, `buscar`, `recorte`, `resaltar`), que comparan sin tildes ni signos y
  devuelven el hallazgo en coordenadas del texto original para poder recortarlo y
  resaltarlo. Lo usan `index.html`, `admin.html`, `biblia.html` y `share.html`.
- `/js/sugerencias.js` — sugerencias del usuario al admin: las tres tienen el
  mismo formato y el mismo canal (`tipo` = `letra` / `agregar` / `eliminar`), las
  crea el usuario y las resuelve el admin. Es además el **único dueño de
  convertir una letra editada en los párrafos de la canción**: expone el armado
  de estrofas (`bloques`), la lectura de la letra guardada (`letraDe`) y la
  aplicación quirúrgica (`aplicarLetra` para los párrafos del repo,
  `aplicarParas` / `letraDeParas` para las estrofas livianas `{d, x}` del
  buscador). Los dos editores (el del buscador y el del admin) lo usan, así que
  ninguna edición borra lo que la canción ya tenía en las estrofas que nadie tocó.
  Todo lo que este módulo escribe pasa por `js/texto.js`, así que una letra
  tecleada en minúsculas se guarda en mayúsculas como las demás, y una sugerencia
  que solo cambia mayúsculas se rechaza por no ser un cambio.

---

## 🧩 Firebase

La app usa Firebase Realtime Database para sincronizar en vivo:

- `rooms/<sala>/currentSong` — canción actual del presentador.
- `rooms/<sala>/messages` — mensajes del stage.
- `rooms/_sugerencias/<id>` — sugerencias que mandan los usuarios
  (`{ tipo, songId, title, artist, antes, propuesta, cancion, nota, autor, ts, estado }`).
  `tipo` es `letra` (por defecto, incluidas las viejas que no lo traían),
  `agregar` (con la canción nueva entera en `cancion`, en la forma del repo) o
  `eliminar`; en `letra` y `eliminar`, `antes` es la **letra completa** y en
  `letra` y `agregar`, `propuesta` es la letra que quedaría. `estado` va de
  `pendiente` a `aplicada` / `rechazada`. También dentro de `rooms/` por las
  mismas reglas.
- `rooms/<sala>/holyrics` — la conexión con la PC que presenta en Holyrics
  (`{ activo, host, puerto, token, actualizado }`), la carga el admin y la usan el stage
  y el puente. Su hijo `now` es lo último que el puente publicó de lo que Holyrics tiene
  en pantalla (`{ ok, vacio, tipo, titulo, items, indice, total, ts }`).
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
- Las canciones del repo que estaban en minúsculas se ven y se guardan en
  mayúsculas al cargarlas; el archivo del repo se pone al día cuando el admin
  guarda o publica (nunca antes, y sin cambiar ninguna letra).

---

## 🧹 Limpieza de datos del usuario

En `localStorage` se guardan **solo las canciones propias del dispositivo**; las del
repo se leen del repo en cada carga. Así, una canción que el admin borre del repo no
vuelve a aparecer desde una copia vieja, y una canción que el usuario agregó desde el
buscador sigue estando cuando recarga. Si el repo ya la tiene (porque el admin aprobó
la sugerencia), la copia local se descarta y la canción viene del repo: no se duplica.
Si el repo no carga, no se borra nada de lo guardado.

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
