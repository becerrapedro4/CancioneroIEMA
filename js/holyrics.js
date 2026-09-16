// js/holyrics.js
// ── LA FORMA HOLYRICS DE UNA CANCIÓN ──
//
// canciones.json ES un backup de Holyrics: así lo exporta y así lo importa el
// programa. La app puede editarlo (admin.html, sugerencias) y exportarlo, pero el
// archivo tiene que seguir siendo el mismo formato, o Holyrics deja de poder leerlo.
// Este módulo es el ÚNICO lugar donde se decide esa forma, y garantiza dos cosas:
//
//   1) De cada canción salen TODOS los campos que Holyrics escribe, en su orden:
//      id, title, artist, author, note, copyright, language, key, bpm, time_sig,
//      midi, order, arrangements, lyrics, streaming, extras. Los que la canción ya
//      traía van tal cual (midi, bpm, key, streaming con sus links, extras…); los que
//      le faltaban se completan con el valor vacío que Holyrics usa, para que una
//      canción creada en la app no entre con otra forma.
//   2) Nada de lo que la canción ya tenía se pierde: los comentarios de estrofa
//      (`text_with_comment`), las descripciones, `full_text_with_comment` y cualquier
//      campo extra que traiga el objeto se conservan.
//
// Lo único que se canoniza es el TEXTO (mayúsculas; ver js/texto.js): título, artista,
// autor y letra. Los datos técnicos (key, time_sig, language, bpm…) no se tocan.
//
// Entra tanto una canción del repo (la forma completa) como una liviana del buscador
// ({id, t, a, l, p}), que es como viaja una canción nueva antes de llegar al repo.
(function () {
  var CAMPOS = ['id', 'title', 'artist', 'author', 'note', 'copyright', 'language', 'key',
                'bpm', 'time_sig', 'midi', 'order', 'arrangements', 'lyrics', 'streaming', 'extras'];

  // Lo que Holyrics escribe cuando no hay dato. Van como funciones porque son objetos:
  // cada canción necesita los suyos.
  var VACIOS = {
    id: function () { return null; },
    title: function () { return ''; },
    artist: function () { return ''; },
    author: function () { return ''; },
    note: function () { return ''; },
    copyright: function () { return ''; },
    language: function () { return ''; },
    key: function () { return ''; },
    bpm: function () { return 0; },
    time_sig: function () { return ''; },
    midi: function () { return null; },
    order: function () { return ''; },
    arrangements: function () { return []; },
    lyrics: function () { return null; },
    streaming: function () {
      return {
        audio: { spotify: '', youtube: '', deezer: '' },
        backing_track: { spotify: '', youtube: '', deezer: '' }
      };
    },
    extras: function () { return { extra: '' }; }
  };

  // Un párrafo de Holyrics: {number, description, text, text_with_comment,
  // translations}. Los que ya venían se copian enteros (campos y orden incluidos) y
  // solo se completan los que falten.
  function parrafo(p, i) {
    var q = (window.Texto ? window.Texto.parrafos([p])[0] : Object.assign({}, p)) || {};
    if (typeof q.number !== 'number') q.number = i + 1;
    if (typeof q.description !== 'string') q.description = '';
    if (typeof q.text !== 'string') q.text = '';
    if (q.text_with_comment === undefined) q.text_with_comment = null;
    if (q.translations === undefined) q.translations = null;
    return q;
  }

  // La canción liviana del buscador, pasada a la forma del repo.
  function deLiviana(s) {
    s = s || {};
    var paras = (s.p || []).map(function (p, i) {
      return parrafo({
        number: i + 1,
        description: (p && (p.d !== undefined ? p.d : p.description)) || '',
        text: (p && (p.x !== undefined ? p.x : p.text)) || '',
        text_with_comment: (p && p.text_with_comment) || null,
        translations: (p && p.translations) || null
      }, i);
    });
    var letra = s.l !== undefined ? s.l
      : paras.map(function (p) { return p.text; }).join('\n\n');
    return {
      id: s.id,
      title: s.title !== undefined ? s.title : s.t,
      artist: s.artist !== undefined ? s.artist : s.a,
      author: s.author,
      note: s.note,
      copyright: s.copyright,
      language: s.language,
      key: s.key,
      bpm: s.bpm,
      time_sig: s.time_sig,
      midi: s.midi,
      order: s.order,
      arrangements: s.arrangements,
      lyrics: {
        full_text: letra,
        full_text_with_comment: s.full_text_with_comment === undefined ? null : s.full_text_with_comment,
        paragraphs: paras
      },
      streaming: s.streaming,
      extras: s.extras
    };
  }

  // Una canción en la forma de Holyrics, con el texto ya canonizado.
  function cancion(song) {
    var base = song && song.lyrics ? song : deLiviana(song);
    var c = window.Texto ? window.Texto.cancion(base) : Object.assign({}, base);

    // lyrics: con sus tres claves y los párrafos completos. La letra completa es la
    // que ya traía; si no la trae (canción nueva), se arma con sus estrofas.
    var l = c.lyrics || {};
    var paras = (l.paragraphs || []).map(parrafo);
    var deEstrofas = paras.map(function (p) { return p.text; }).join('\n\n');
    c.lyrics = {
      full_text: typeof l.full_text === 'string' && l.full_text ? l.full_text : deEstrofas,
      full_text_with_comment: typeof l.full_text_with_comment === 'string' ? l.full_text_with_comment : null,
      paragraphs: paras
    };

    // El resto de los campos: los que faltan, con el valor vacío de Holyrics (al
    // final, que es donde van en su orden).
    CAMPOS.forEach(function (k) {
      if (k === 'lyrics' || k === 'id') return;
      if (c[k] === undefined) c[k] = VACIOS[k]();
      if (c[k] === null && k !== 'midi') c[k] = VACIOS[k]();
    });
    return c;
  }

  window.Holyrics = { cancion: cancion };
})();
