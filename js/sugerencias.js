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
// FORMA DE LOS DATOS
//   rooms/_sugerencias/{key} = {
//     songId, title, artist,     // a qué canción se refiere
//     idx, antes, propuesta,     // nº de estrofa, texto original y texto nuevo
//     nota, autor, ts,
//     estado,                    // 'pendiente' | 'aplicada' | 'rechazada'
//     resueltoTs
//   }
(function () {
  var BASE = 'rooms/_sugerencias';
  var MAX = 6000;   // largo máximo de una propuesta
  var ESTADOS = ['pendiente', 'aplicada', 'rechazada'];

  // Los párrafos de una canción, sea la forma del repo (lyrics.paragraphs[].text)
  // o la del buscador (p:[{d,x}]).
  function paragraphs(song) {
    if (!song) return [];
    if (song.lyrics && Array.isArray(song.lyrics.paragraphs)) {
      return song.lyrics.paragraphs.map(function (p) { return (p && p.text) || ''; });
    }
    if (Array.isArray(song.p)) return song.p.map(function (p) { return (p && p.x) || ''; });
    return [];
  }

  // En qué estrofa cae una sugerencia. Primero busca por texto exacto (así
  // aguanta que se hayan agregado o borrado estrofas), y si ese texto ya no
  // está, cae a la posición que se sugirió.
  function matchParagraph(song, sug) {
    var ps = paragraphs(song);
    var antes = String((sug && sug.antes) || '').trim();
    if (antes) {
      for (var i = 0; i < ps.length; i++) {
        if (String(ps[i]).trim() === antes) return { idx: i, exacto: true };
      }
    }
    var idx = (sug && typeof sug.idx === 'number') ? sug.idx : -1;
    if (idx >= 0 && idx < ps.length) return { idx: idx, exacto: false };
    return { idx: -1, exacto: false };
  }

  // Devuelve el motivo del rechazo, o null si la sugerencia es válida.
  function validar(sug) {
    if (!sug || sug.songId === undefined || sug.songId === null || sug.songId === '') return 'Falta la canción';
    var prop = String(sug.propuesta || '').trim();
    if (!prop) return 'Escribí el texto que proponés';
    if (prop.length > MAX) return 'El texto propuesto es demasiado largo';
    if (prop === String(sug.antes || '').trim()) return 'El texto es igual al original: no hay ningún cambio';
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
      idx: typeof sug.idx === 'number' ? sug.idx : null,
      antes: String(sug.antes || ''),
      propuesta: String(sug.propuesta).trim(),
      nota: String(sug.nota || '').slice(0, 300),
      autor: String(sug.autor || '').trim().slice(0, 60) || 'anónimo',
      ts: Date.now(),
      estado: 'pendiente'
    }).then(function (ref) { return ref.key; });
  }

  function normalizar(val) {
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
    var handler = ref.on('value', function (s) { cb(normalizar(s.val())); });
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
    paragraphs: paragraphs,
    matchParagraph: matchParagraph,
    validar: validar,
    enviar: enviar,
    escuchar: escuchar,
    setEstado: setEstado,
    eliminar: eliminar,
    pendientes: pendientes
  };
})();
