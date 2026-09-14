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
//   La LETRA COMPLETA de la canción, no una estrofa suelta: el usuario edita la
//   letra y manda cómo quedaría entera. Así el admin ve el antes y el después
//   completos y no hay que adivinar a qué estrofa se refería.
//
// FORMA DE LOS DATOS
//   rooms/_sugerencias/{key} = {
//     songId, title, artist,     // a qué canción se refiere
//     antes,                     // letra actual completa (para comparar)
//     propuesta,                 // letra nueva completa
//     nota, autor, ts,
//     estado,                    // 'pendiente' | 'aplicada' | 'rechazada'
//     resueltoTs, resueltoPor
//   }
(function () {
  var BASE = 'rooms/_sugerencias';
  var MAX = 20000;   // largo máximo de una letra propuesta
  var ESTADOS = ['pendiente', 'aplicada', 'rechazada'];

  // Saltos de línea como los usa el resto del proyecto (LF).
  function normalizarSaltos(texto) {
    return String(texto || '').replace(/\r\n?/g, '\n');
  }

  // Para comparar dos letras: espacios y saltos de línea de más no cuentan.
  function normalizarLetra(texto) {
    return normalizarSaltos(texto)
      .split('\n')
      .map(function (l) { return l.replace(/\s+/g, ' ').trim(); })
      .filter(Boolean)
      .join('\n');
  }

  // De un texto con estrofas separadas por líneas en blanco arma la forma que
  // usa canciones.json (lyrics.paragraphs + lyrics.full_text).
  function buildLyrics(texto) {
    var paragraphs = normalizarSaltos(texto)
      .split(/\n{2,}/)
      .map(function (b) { return b.trim(); })
      .filter(Boolean)
      .map(function (text, i) {
        return { number: i + 1, description: '', text: text, text_with_comment: null, translations: null };
      });
    return { paragraphs: paragraphs, full_text: paragraphs.map(function (p) { return p.text; }).join('\n\n') };
  }

  // Copia de la canción con la letra reemplazada entera. Devuelve null si la
  // letra propuesta no tiene ni una estrofa (así el admin nunca borra la letra
  // por accidente).
  function aplicarLetra(song, texto) {
    var lyrics = buildLyrics(texto);
    if (!lyrics.paragraphs.length) return null;
    return Object.assign({}, song, { lyrics: Object.assign({}, song && song.lyrics, lyrics) });
  }

  // La letra que la canción del repo tiene ahora, en texto plano.
  function letraDe(song) {
    var l = (song && song.lyrics) || {};
    if (l.full_text) return l.full_text;
    return (l.paragraphs || []).map(function (p) { return (p && p.text) || ''; }).join('\n\n');
  }

  // La letra "prolija": estrofas recortadas, CRLF normalizado y sin líneas
  // en blanco de más. Es la forma que se guarda y la que se aplica, así lo que
  // el admin ve en la propuesta es exactamente lo que va a quedar en la canción.
  function limpiarLetra(texto) {
    return buildLyrics(texto).full_text;
  }

  // Devuelve el motivo del rechazo, o null si la sugerencia es válida.
  function validar(sug) {
    if (!sug || sug.songId === undefined || sug.songId === null || sug.songId === '') return 'Falta la canción';
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
    return window.db.ref(BASE).push({
      songId: sug.songId,
      title: String(sug.title || '').slice(0, 200),
      artist: String(sug.artist || '').slice(0, 200),
      antes: limpiarLetra(sug.antes),
      propuesta: limpiarLetra(sug.propuesta),
      nota: String(sug.nota || '').trim().slice(0, 300),
      autor: String(sug.autor || '').trim().slice(0, 60) || 'anónimo',
      ts: Date.now(),
      estado: 'pendiente'
    }).then(function (ref) { return ref.key; });
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
    BASE: BASE,
    MAX: MAX,
    letraDe: letraDe,
    normalizarSaltos: normalizarSaltos,
    normalizarLetra: normalizarLetra,
    limpiarLetra: limpiarLetra,
    buildLyrics: buildLyrics,
    aplicarLetra: aplicarLetra,
    validar: validar,
    enviar: enviar,
    escuchar: escuchar,
    setEstado: setEstado,
    eliminar: eliminar,
    pendientes: pendientes
  };
})();
