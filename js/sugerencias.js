// js/sugerencias.js
// Sugerencias de cambio en las letras: las manda cualquier usuario desde el
// buscador (index.html) y las revisa el admin (admin.html), que decide si se
// aplican a la canción del repo o se rechazan.
//
// DÓNDE VIVE
//   En `rooms/_sugerencias/...`, igual que el índice de salas: las reglas de la
//   base solo permiten leer y escribir dentro de `rooms`, así que las sugerencias
//   viajan en un "cuarto" reservado que ninguna página real usa.
//
// QUÉ SE SUGIERE
//   Tres cosas, todas con el mismo formato y el mismo camino:
//     'letra'    — la LETRA COMPLETA de la canción, no una estrofa suelta: el
//                  usuario edita la letra y manda cómo quedaría entera. Así el
//                  admin ve el antes y el después completos y no hay que adivinar
//                  a qué estrofa se refería.
//     'agregar'  — una canción NUEVA creada desde el buscador (viaja entera, en la
//                  forma del repo, en `cancion`).
//     'eliminar' — el pedido de borrar una canción del cancionero.
//   Nada de esto toca el repo: el admin aprueba o rechaza y recién ahí se guarda.
//
// CÓMO SE APLICA
//   `aplicarLetra` compara la letra nueva con la que la canción ya tiene y deja
//   intactas las estrofas que no cambiaron (mismo objeto: número, descripción,
//   texto con comentarios y cualquier campo extra). Solo se reemplazan las
//   estrofas que la persona escribió distinto.
//
//   Ese armado es el ÚNICO del proyecto: los dos caminos de edición lo usan —
//   el editor del buscador (estrofas livianas `{d, x}`, `aplicarParas` y
//   `letraDeParas`) y el editor del admin (párrafos del repo, `aplicarLetra`) —
//   así ninguna edición borra lo que la canción ya tenía en las estrofas que
//   nadie tocó.
//
// FORMA DE LOS DATOS
//   rooms/_sugerencias/{key} = {
//     tipo,                      // 'letra' | 'agregar' | 'eliminar'
//     songId, title, artist,     // a qué canción se refiere
//     antes,                     // letra actual completa (para comparar)
//     propuesta,                 // letra nueva completa
//     cancion,                   // solo en 'agregar': la canción nueva entera
//     nota, autor, ts,
//     estado,                    // 'pendiente' | 'aplicada' | 'rechazada'
//     resueltoTs, resueltoPor
//   }
(function () {
  var BASE = 'rooms/_sugerencias';
  var MAX = 20000;   // largo máximo de una letra propuesta
  var ESTADOS = ['pendiente', 'aplicada', 'rechazada'];
  var TIPOS = ['letra', 'agregar', 'eliminar'];

  // Qué pide la sugerencia. Las que se mandaron antes de que existieran los tipos
  // son cambios de letra.
  function tipoDe(sug) {
    var t = sug && sug.tipo;
    return TIPOS.indexOf(t) >= 0 ? t : 'letra';
  }

  // La canción nueva que propone el buscador, en la forma exacta del repo, así el
  // admin la agrega tal cual la escribió el usuario. La forma es la de Holyrics y la
  // arma js/holyrics.js: acá solo se le ponen los límites del formulario.
  function cancionNueva(song) {
    if (!window.Holyrics) return song;
    var c = window.Holyrics.cancion(song);
    c.title = String(c.title || '').slice(0, 200);
    c.artist = String(c.artist || '').slice(0, 200);
    return c;
  }

  // Mayúsculas: la forma canónica del texto del cancionero (ver js/texto.js).
  // Todo lo que este módulo escribe pasa por acá, así una letra tecleada en
  // minúsculas se guarda igual que las demás.
  function mayus(v) {
    return window.Texto ? window.Texto.mayus(v) : String(v == null ? '' : v).toLocaleUpperCase('es');
  }

  // Mayúsculas de los párrafos que ya tenía la canción, para comparar contra la
  // letra nueva sin depender de cómo vino guardada (ver js/texto.js).
  function canonParrafos(lista) {
    return window.Texto ? window.Texto.parrafos(lista) : (lista || []);
  }
  function canonEstrofas(lista) {
    return window.Texto ? window.Texto.estrofas(lista) : (lista || []);
  }

  // Saltos de línea como los usa el resto del proyecto (LF).
  function normalizarSaltos(texto) {
    return mayus(String(texto || '').replace(/\r\n?/g, '\n'));
  }

  // Para comparar dos letras: espacios y saltos de línea de más no cuentan.
  function normalizarLetra(texto) {
    return normalizarSaltos(texto)
      .split('\n')
      .map(function (l) { return l.replace(/\s+/g, ' ').trim(); })
      .filter(Boolean)
      .join('\n');
  }

  // Estrofas de un texto: separadas por líneas en blanco, ya recortadas.
  function bloques(texto) {
    return normalizarSaltos(texto)
      .split(/\n{2,}/)
      .map(function (b) { return b.trim(); })
      .filter(Boolean);
  }

  // La letra "prolija": estrofas recortadas, CRLF normalizado y sin líneas
  // en blanco de más. Es la forma en que se guarda una sugerencia, así lo que el
  // admin ve en la propuesta es exactamente lo que va a quedar en la canción.
  function limpiarLetra(texto) {
    return bloques(texto).join('\n\n');
  }

  // La letra que la canción del repo tiene ahora, en texto plano.
  function letraDe(song) {
    var l = (song && song.lyrics) || {};
    if (l.full_text) return l.full_text;
    return (l.paragraphs || []).map(function (p) { return (p && p.text) || ''; }).join('\n\n');
  }

  // Estrofas idénticas entre las dos letras (subsecuencia común más larga): son
  // las que se conservan tal cual. Devuelve pares [índice viejo, índice nuevo].
  function alineacion(viejos, nuevos) {
    var n = viejos.length, m = nuevos.length, i, j;
    var dp = [];
    for (i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(0));
    for (i = n - 1; i >= 0; i--) {
      for (j = m - 1; j >= 0; j--) {
        dp[i][j] = viejos[i] === nuevos[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    var pares = [];
    i = 0; j = 0;
    while (i < n && j < m) {
      if (viejos[i] === nuevos[j]) { pares.push([i, j]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
    return pares;
  }

  // Los números de estrofa se mantienen (así no se toca ninguna estrofa que la
  // persona no cambió); solo se renumeran 1..n si la mezcla los dejó repetidos o
  // desordenados, que es lo que pasa al insertar una estrofa en el medio.
  function numerar(parrafos) {
    var coherentes = parrafos.every(function (p, k) {
      return typeof p.number === 'number' && p.number > (k ? parrafos[k - 1].number : 0);
    });
    if (!coherentes) parrafos.forEach(function (p, k) { p.number = k + 1; });
  }

  // Cada formato de párrafo dice cómo leer su texto, cómo reemplazarlo y cómo
  // crear uno nuevo. Son los dos que hay en el proyecto: los párrafos del repo
  // (`{number, description, text, …}`) y las estrofas livianas del buscador
  // (`{d, x}`).
  var FORMATOS = {
    repo: {
      texto: function (p) { return p.text; },
      // estrofa corregida: se cambia el texto y se suelta el texto con comentarios
      reemplazar: function (viejo, texto) { return Object.assign({}, viejo, { text: texto, text_with_comment: null }); },
      crear: function (texto, anterior) {
        return { number: anterior ? anterior.number + 1 : 1, description: '', text: texto, text_with_comment: null, translations: null };
      },
      numerar: numerar
    },
    local: {
      texto: function (p) { return p.x; },
      reemplazar: function (viejo, texto) { return Object.assign({}, viejo, { x: texto }); },
      crear: function (texto) { return { d: '', x: texto }; },
      numerar: function () {}
    }
  };

  // Arma los párrafos de la letra nueva sobre los que ya tiene la canción: los
  // huecos entre estrofas idénticas se emparejan en orden, así una estrofa
  // corregida hereda el número, la descripción y el resto de los campos de la
  // estrofa que reemplaza, y una estrofa agregada nace vacía.
  function fusionar(viejos, nuevos, formato) {
    var textos = viejos.map(function (p) { return String(formato.texto(p) || '').trim(); });
    var corte = alineacion(textos, nuevos);
    corte.push([textos.length, nuevos.length]);   // cierra el último hueco
    var out = [], i = 0, j = 0;
    corte.forEach(function (a, idx) {
      var disponibles = a[0] - i;
      var propuestos = a[1] - j;
      for (var k = 0; k < propuestos; k++) {
        var viejo = k < disponibles ? viejos[i + k] : null;
        out.push(viejo ? formato.reemplazar(viejo, nuevos[j + k])
                       : formato.crear(nuevos[j + k], out[out.length - 1]));
      }
      // Las estrofas del hueco que se quedan sin reemplazo se borran (la persona las
      // sacó), salvo las que no tienen texto: esas no las tocó nadie y borrarlas
      // cambiaría la canción sin que nadie lo haya pedido.
      for (var s = propuestos; s < disponibles; s++) {
        var sobra = viejos[i + s];
        if (!String(formato.texto(sobra) || '').trim()) out.push(Object.assign({}, sobra));
      }
      i = a[0]; j = a[1];
      if (idx < corte.length - 1) { out.push(Object.assign({}, viejos[i])); i++; j++; }
    });
    formato.numerar(out);
    return out;
  }

  // Copia de la canción con la letra nueva aplicada. Solo cambian las estrofas
  // que la persona modificó: las demás quedan con sus bytes tal cual (número,
  // descripción, texto con comentarios y cualquier campo extra).
  //
  // Devuelve null cuando la propuesta no trae ninguna estrofa y la canción SÍ
  // tiene letra: así una letra nunca se borra por accidente. Una canción que ya
  // venía sin letra (en el repo hay cuatro con una estrofa " ") se puede seguir
  // editando y se queda igual.
  function aplicarLetra(song, texto) {
    var lyricsViejas = (song && song.lyrics) || {};
    var viejos = canonParrafos(lyricsViejas.paragraphs);
    var nuevos = bloques(texto);
    var tenia = viejos.some(function (p) { return String((p && p.text) || '').trim(); });
    if (!nuevos.length && tenia) return null;
    var paragraphs = fusionar(viejos, nuevos, FORMATOS.repo);
    var lyrics = Object.assign({}, lyricsViejas, {
      paragraphs: paragraphs,
      full_text: paragraphs.map(function (p) { return p.text; }).join('\n\n')
    });
    // El texto con comentarios se recalcula con la misma regla que usa el repo
    // (el comentario si lo hay, el texto si no) para que no quede desfasado.
    if (lyricsViejas.full_text_with_comment) {
      lyrics.full_text_with_comment = paragraphs.map(function (p) { return p.text_with_comment || p.text; }).join('\n\n');
    }
    return Object.assign({}, song, { lyrics: lyrics });
  }

  // Lo mismo para las estrofas livianas del buscador ({d, x}): al editar la letra,
  // las estrofas que nadie tocó conservan su descripción y su texto tal cual.
  function aplicarParas(parrafos, texto) {
    var nuevos = bloques(texto);
    if (!nuevos.length) return null;
    return fusionar(canonEstrofas(parrafos), nuevos, FORMATOS.local);
  }

  // La letra completa en texto plano a partir de esas estrofas.
  function letraDeParas(parrafos) {
    return (parrafos || []).map(function (p) { return (p && p.x) || ''; }).join('\n\n');
  }

  // Devuelve el motivo del rechazo, o null si la sugerencia es válida. Cada tipo
  // pide lo suyo: una letra nueva completa, una canción nueva con letra, o una
  // canción que exista para poder borrarla.
  function validar(sug) {
    if (!sug) return 'Falta la sugerencia';
    var tipo = tipoDe(sug);
    if (tipo === 'agregar') {
      var nueva = cancionNueva(sug.cancion || {});
      if (!nueva.title) return 'Falta el título de la canción nueva';
      if (!bloques(nueva.lyrics.full_text).length) return 'La canción nueva no tiene letra';
      if (nueva.lyrics.full_text.length > MAX) return 'La letra de la canción nueva es demasiado larga';
      return null;
    }
    if (sug.songId === undefined || sug.songId === null || sug.songId === '') return 'Falta la canción';
    if (tipo === 'eliminar') return null;
    var prop = String(sug.propuesta || '').trim();
    if (!prop) return 'La letra propuesta está vacía';
    if (prop.length > MAX) return 'La letra propuesta es demasiado larga';
    if (normalizarLetra(prop) === normalizarLetra(sug.antes)) return 'La letra es igual a la original: no hay ningún cambio';
    return null;
  }

  function enviar(sug) {
    var err = validar(sug);
    if (err) return Promise.reject(new Error(err));
    if (!window.db) return Promise.reject(new Error('Firebase no disponible'));
    var tipo = tipoDe(sug);
    var cancion = tipo === 'agregar' ? cancionNueva(sug.cancion) : null;
    var datos = {
      tipo: tipo,
      songId: cancion ? cancion.id : sug.songId,
      title: String((cancion ? cancion.title : sug.title) || '').slice(0, 200),
      artist: String((cancion ? cancion.artist : sug.artist) || '').slice(0, 200),
      antes: tipo === 'agregar' ? '' : limpiarLetra(sug.antes),
      propuesta: tipo === 'eliminar' ? '' : limpiarLetra(cancion ? cancion.lyrics.full_text : sug.propuesta),
      nota: String(sug.nota || '').trim().slice(0, 300),
      autor: String(sug.autor || '').trim().slice(0, 60) || 'anónimo',
      ts: Date.now(),
      estado: 'pendiente'
    };
    if (cancion) datos.cancion = cancion;
    return window.db.ref(BASE).push(datos).then(function (ref) { return ref.key; });
  }

  function normalizarLista(val) {
    var out = [];
    Object.keys(val || {}).forEach(function (k) {
      var s = val[k] || {};
      out.push(Object.assign({ key: k, estado: s.estado || 'pendiente' }, s));
    });
    return out.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  }

  // Escucha la lista completa (más nuevas primero). Devuelve la función para cortar.
  function escuchar(cb) {
    if (!window.db) return function () {};
    var ref = window.db.ref(BASE).limitToLast(200);
    var handler = ref.on('value', function (s) { cb(normalizarLista(s.val())); });
    return function () { ref.off('value', handler); };
  }

  function setEstado(key, estado, extra) {
    if (!window.db || ESTADOS.indexOf(estado) < 0) return Promise.resolve();
    var patch = { estado: estado, resueltoTs: Date.now() };
    if (extra) for (var k in extra) patch[k] = extra[k];
    return window.db.ref(BASE + '/' + key).update(patch);
  }

  function eliminar(key) {
    if (!window.db) return Promise.resolve();
    return window.db.ref(BASE + '/' + key).remove();
  }

  function pendientes(list) {
    return (list || []).filter(function (s) { return s.estado === 'pendiente'; });
  }

  window.Sugerencias = {
    tipoDe: tipoDe,
    cancionNueva: cancionNueva,
    bloques: bloques,
    letraDe: letraDe,
    normalizarLetra: normalizarLetra,
    aplicarLetra: aplicarLetra,
    aplicarParas: aplicarParas,
    letraDeParas: letraDeParas,
    validar: validar,
    enviar: enviar,
    escuchar: escuchar,
    setEstado: setEstado,
    eliminar: eliminar,
    pendientes: pendientes
  };
})();
