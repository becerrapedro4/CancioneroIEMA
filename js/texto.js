// js/texto.js
// ── LA FORMA DEL TEXTO DEL CANCIONERO ──
//
// 1) MAYÚSCULAS SIEMPRE. No importa de dónde venga la canción —el repo
//    (canciones.json), un JSON importado, localStorage o tecleada a mano—: el
//    proyecto la guarda y la muestra en mayúsculas. `titulo` (título, artista,
//    autor) y `cancion` / `estrofas` son el único lugar donde se decide eso, así
//    que todos los caminos que cargan o guardan pasan por acá y ninguno tiene su
//    propia idea de cómo se ve el texto.
//
// 2) BÚSQUEDAS SIN TILDES NI SIGNOS. `clave` es la forma con la que se compara
//    (mayúsculas, sin tildes, sin signos de puntuación, sin espacios) y `buscar`
//    / `recorte` / `resaltar` devuelven el hallazgo en coordenadas del texto
//    ORIGINAL, para poder recortarlo y resaltarlo sin inventar índices.
(function () {
  var LETRA = /[\p{L}\p{N}]/u;   // lo que sobrevive a la clave: letras y números

  // Mayúsculas, con acentos y ñ incluidos (á → Á, ñ → Ñ). No toca los espacios:
  // la letra se guarda tal como la escribió el usuario, solo en mayúsculas.
  function mayus(v) { return String(v == null ? '' : v).toLocaleUpperCase('es'); }

  // Título, artista y autor: mayúsculas y los espacios de más vueltos uno solo.
  function titulo(v) { return mayus(v).replace(/\s+/g, ' ').trim(); }

  // El texto reducido a su clave, junto con la posición original de cada carácter
  // que quedó. Es la base de comparar y de volver a encontrar el hallazgo.
  function desglose(v) {
    var src = String(v == null ? '' : v), txt = '', mapa = [];
    for (var i = 0; i < src.length; i++) {
      var c = mayus(src.charAt(i).normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      if (c && LETRA.test(c)) { txt += c; mapa.push(i); }
    }
    return { txt: txt, mapa: mapa, src: src };
  }

  // Clave de comparación de un texto. El memo evita repetir el trabajo entre
  // pulsaciones (la Biblia completa se compara entera en cada búsqueda).
  var memo = new Map();
  function clave(v) {
    var s = String(v == null ? '' : v);
    var hit = memo.get(s);
    if (hit !== undefined) return hit;
    var k = desglose(s).txt;
    if (memo.size > 80000) memo.clear();
    memo.set(s, k);
    return k;
  }

  // Primera coincidencia de `q` dentro de `texto`, en coordenadas del original.
  function buscar(texto, q) {
    var c = clave(q);
    if (!c) return null;
    var d = desglose(texto);
    var i = d.txt.indexOf(c);
    if (i < 0) return null;
    return { ini: d.mapa[i], fin: d.mapa[i + c.length - 1] + 1 };
  }

  // Trozo de texto alrededor de la primera coincidencia (null si no hay).
  function recorte(texto, q, antes, despues) {
    if (texto == null) return null;
    var m = buscar(String(texto), q);
    if (!m) return null;
    var t = String(texto);
    var a = antes == null ? 25 : antes, b = despues == null ? 45 : despues;
    var s = Math.max(0, m.ini - a), e = Math.min(t.length, m.fin + b);
    return (s > 0 ? '…' : '') + t.slice(s, e) + (e < t.length ? '…' : '');
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // El texto escapado, con TODAS las coincidencias marcadas con <mark>. La
  // comparación ignora tildes y signos; el resaltado respeta el texto real.
  function resaltar(texto, q) {
    var src = String(texto == null ? '' : texto), c = clave(q);
    if (!c) return esc(src);
    var d = desglose(src), out = '', desde = 0, i = 0;
    while ((i = d.txt.indexOf(c, i)) >= 0) {
      var a = d.mapa[i], b = d.mapa[i + c.length - 1] + 1;
      out += esc(src.slice(desde, a)) + '<mark>' + esc(src.slice(a, b)) + '</mark>';
      desde = b; i += c.length;
    }
    return out + esc(src.slice(desde));
  }

  // Campos de texto de una canción del repo. `key`, `bpm`, `time_sig` y demás
  // datos técnicos quedan como están: no son texto para leer.
  var CAMPOS = ['title', 'artist', 'author', 'note', 'copyright'];

  function parrafo(p) {
    if (!p || typeof p !== 'object') return p;
    var q = Object.assign({}, p);
    if (typeof q.text === 'string') q.text = mayus(q.text);
    if (typeof q.description === 'string') q.description = titulo(q.description);
    if (typeof q.text_with_comment === 'string') q.text_with_comment = mayus(q.text_with_comment);
    return q;
  }

  // Los párrafos del repo ({number, description, text, text_with_comment, …}).
  function parrafos(lista) {
    return (lista || []).map(parrafo);
  }

  // La canción del repo en su forma canónica (título, artista y letra en
  // mayúsculas). Devuelve una copia: lo que llega no se toca.
  function cancion(song) {
    if (!song || typeof song !== 'object') return song;
    var out = Object.assign({}, song);
    CAMPOS.forEach(function (f) {
      if (typeof out[f] === 'string' && out[f]) out[f] = titulo(out[f]);
    });
    var l = song.lyrics;
    if (l && typeof l === 'object') {
      var lyrics = Object.assign({}, l);
      if (Array.isArray(l.paragraphs)) lyrics.paragraphs = parrafos(l.paragraphs);
      if (typeof l.full_text === 'string') lyrics.full_text = mayus(l.full_text);
      if (typeof l.full_text_with_comment === 'string') lyrics.full_text_with_comment = mayus(l.full_text_with_comment);
      out.lyrics = lyrics;
    }
    return out;
  }

  // Las estrofas livianas del buscador ({d, x}).
  function estrofas(parrafos) {
    return (parrafos || []).map(function (p) {
      if (!p || typeof p !== 'object') return p;
      var q = Object.assign({}, p);
      if (typeof q.d === 'string') q.d = titulo(q.d);
      if (typeof q.x === 'string') q.x = mayus(q.x);
      return q;
    });
  }

  window.Texto = {
    mayus: mayus,
    titulo: titulo,
    clave: clave,
    buscar: buscar,
    recorte: recorte,
    resaltar: resaltar,
    cancion: cancion,
    parrafos: parrafos,
    estrofas: estrofas
  };
})();
