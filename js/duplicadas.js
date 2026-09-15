// js/duplicadas.js
// ── CANCIONES REPETIDAS ──
//
// El cancionero tiene canciones que son la misma dos veces porque el título se
// escribió distinto: tildes, mayúsculas, signos o espacios de más (PODEROSO DIOS
// dos veces, EN EL NOMBRE DE JESUS y En El Nombre de Jesús, ¿QUÉ NIÑO ES ESTE? y
// QUE NIÑO ES ESTE…). También hay canciones con la letra IDÉNTICA guardadas con
// dos títulos distintos (VENID FIELES TODOS y VENID Y ADOREMOS).
//
// Este módulo las encuentra usando el normalizador del proyecto (js/texto.js:
// `clave` compara sin tildes, mayúsculas, espacios ni signos) y arma los grupos
// que el admin revisa. NO escribe nada: devuelve la lista nueva de canciones y
// las listas globales reapuntadas, y el admin decide si las guarda con el mismo
// guardado y publicación que ya existen.
(function () {
  var T = window.Texto;

  function letraDe(song) {
    var l = (song && song.lyrics) || {};
    if (l.full_text) return l.full_text;
    return (l.paragraphs || []).map(function (p) { return (p && p.text) || ''; }).join('\n\n');
  }

  // Lo que el admin necesita saber de una canción para elegir: es lo que se
  // muestra en la tarjeta del grupo.
  function info(song) {
    var ps = (song && song.lyrics && song.lyrics.paragraphs) || [];
    return {
      id: song.id,
      title: (song && song.title) || 'Sin título',
      artist: (song && song.artist) || '',
      estrofas: ps.filter(function (p) { return String((p && p.text) || '').trim(); }).length,
      parrafos: ps.length,
      comentarios: ps.filter(function (p) { return p && p.text_with_comment; }).length,
      descripciones: ps.filter(function (p) { return p && String(p.description || '').trim(); }).length,
      largo: String(letraDe(song)).length
    };
  }

  // Qué canción conviene conservar, con los motivos escritos para mostrar.
  // Gana la que más información tiene; si empatan, la más antigua (id menor) para
  // que el resultado no dependa del orden en que llegaron.
  function elegir(canciones) {
    var infos = canciones.map(info);
    // Lo que importa es no perder contenido: manda la letra que hay guardada (en
    // caracteres), después las estrofas con texto y los datos que cuelgan de ellas
    // (comentarios, descripciones). Con puntajes iguales gana la más antigua.
    var punta = function (i) {
      return i.largo / 10 + i.estrofas * 2 + i.comentarios * 5 + i.descripciones * 3 + (i.artist ? 2 : 0);
    };
    var mejor = 0;
    infos.forEach(function (i, k) { if (punta(i) > punta(infos[mejor])) mejor = k; });
    var elegida = infos[mejor];
    var otros = infos.filter(function (_, k) { return k !== mejor; });
    var maxDe = function (f) { return Math.max.apply(null, otros.map(f).concat([0])); };

    var motivos = [];
    var masLargo = maxDe(function (i) { return i.largo; });
    if (elegida.largo > masLargo) motivos.push('tiene más letra (' + elegida.largo + ' contra ' + masLargo + ' caracteres)');
    var masEstr = maxDe(function (i) { return i.estrofas; });
    if (elegida.estrofas > masEstr) motivos.push('tiene más estrofas (' + elegida.estrofas + ' contra ' + masEstr + ')');
    var masCom = maxDe(function (i) { return i.comentarios; });
    if (elegida.comentarios > masCom) motivos.push(masCom ? 'tiene más texto con comentarios (' + elegida.comentarios + ' contra ' + masCom + ')' : 'tiene texto con comentarios');
    var masDesc = maxDe(function (i) { return i.descripciones; });
    if (elegida.descripciones > masDesc) motivos.push(masDesc ? 'tiene más descripciones (' + elegida.descripciones + ' contra ' + masDesc + ')' : 'tiene descripciones de estrofa');
    if (elegida.artist && !otros.some(function (i) { return i.artist; })) motivos.push('es la única con artista');
    if (!motivos.length) {
      // Ninguna copia tiene más que las otras: da igual cuál quede.
      var iguales = otros.every(function (i) {
        return i.estrofas === elegida.estrofas && i.comentarios === elegida.comentarios &&
          i.descripciones === elegida.descripciones && i.largo === elegida.largo;
      });
      motivos.push(iguales ? 'es igual a las otras copias: cualquiera sirve' : 'es la más antigua');
    }

    return { id: elegida.id, info: elegida, motivos: motivos };
  }

  function agrupar(lista, clave) {
    var m = new Map();
    (lista || []).forEach(function (s) {
      var k = clave(s);
      if (!k) return;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(s);
    });
    var out = [];
    m.forEach(function (v, k) { if (v.length > 1) out.push({ clave: k, canciones: v }); });
    return out;
  }

  // ── Letra muy parecida (no idéntica) ──
  // Dos copias de la misma canción casi nunca se guardan con la letra idéntica:
  // cambia un corte de estrofa, una coma, una palabra. Se comparan por las
  // palabras distintas de cada letra y se avisa cuando comparten el 90% o más.
  var CAP = 25;           // palabras que están en más de 25 canciones no distinguen
  var MIN_PALABRAS = 15;  // una letra con menos palabras propias no se compara
  var UMBRAL = 90;

  function palabrasUtiles(lista) {
    var sets = lista.map(function (s) {
      var set = new Set();
      String(letraDe(s)).split(/[^\p{L}\p{N}]+/u).forEach(function (w) {
        var k = T.clave(w);
        if (k.length >= 4) set.add(k);
      });
      return set;
    });
    var freq = new Map();
    sets.forEach(function (set) { set.forEach(function (w) { freq.set(w, (freq.get(w) || 0) + 1); }); });
    return sets.map(function (set) {
      var utiles = new Set();
      set.forEach(function (w) { if (freq.get(w) <= CAP) utiles.add(w); });
      return utiles;
    });
  }

  function paresParecidos(lista, sets) {
    var n = lista.length, index = new Map(), contador = new Int32Array(n * n), tocados = [];
    sets.forEach(function (set, i) { set.forEach(function (w) {
      if (!index.has(w)) index.set(w, []);
      index.get(w).push(i);
    }); });
    index.forEach(function (donde) {
      for (var a = 0; a < donde.length; a++) {
        for (var b = a + 1; b < donde.length; b++) {
          var k = donde[a] * n + donde[b];
          if (contador[k]++ === 0) tocados.push(k);
        }
      }
    });
    var out = [];
    tocados.forEach(function (k) {
      var a = Math.floor(k / n), b = k % n;
      var min = Math.min(sets[a].size, sets[b].size);
      if (min < MIN_PALABRAS) return;
      var pct = Math.round(100 * contador[k] / min);
      if (pct >= UMBRAL) out.push({ a: a, b: b, pct: pct });
    });
    return out;
  }

  function armar(tipo, g) {
    var e = elegir(g.canciones);
    // La elegida primero: es la que viene marcada en la tarjeta del admin.
    var canciones = g.canciones.slice().sort(function (a, b) {
      if (a.id === e.id) return -1;
      if (b.id === e.id) return 1;
      return info(b).estrofas - info(a).estrofas;
    });
    var letras = new Set(canciones.map(function (s) { return T.clave(letraDe(s)); }));
    return {
      tipo: tipo,               // 'titulo' | 'letra'
      clave: g.clave,
      canciones: canciones,
      mismaLetra: letras.size === 1,
      elegida: e
    };
  }

  // Los grupos que el admin tiene que revisar. Dos formas de repetirse:
  //   'titulo' — el mismo título escrito distinto.
  //   'letra'  — la misma letra con otro título (no se muestra si ya se ve como
  //              un solo grupo de título).
  function grupos(songs) {
    var lista = songs || [], out = [], juntos = {};
    var marcar = function (canciones) {
      for (var i = 0; i < canciones.length; i++) {
        for (var j = i + 1; j < canciones.length; j++) juntos[canciones[i].id + '|' + canciones[j].id] = true;
      }
    };
    agrupar(lista, function (s) { return T.clave(s.title); }).forEach(function (g) {
      var grupo = armar('titulo', g);
      out.push(grupo);
      marcar(grupo.canciones);
    });
    agrupar(lista, function (s) { return T.clave(letraDe(s)); }).forEach(function (g) {
      var titulos = {};
      g.canciones.forEach(function (s) { titulos[T.clave(s.title)] = true; });
      if (Object.keys(titulos).length < 2) return;
      var grupo = armar('letra', g);
      out.push(grupo);
      marcar(grupo.canciones);
    });

    // Letra casi igual con otro título: se juntan los pares parecidos que no sean
    // ya el mismo grupo, y se unen en un solo grupo los que se encadenan.
    var sets = palabrasUtiles(lista);
    var pares = paresParecidos(lista, sets).filter(function (p) {
      return !juntos[lista[p.a].id + '|' + lista[p.b].id] && !juntos[lista[p.b].id + '|' + lista[p.a].id];
    });
    var raiz = {};
    var buscar = function (id) { while (raiz[id] !== undefined && raiz[id] !== id) { raiz[id] = raiz[raiz[id]]; id = raiz[id]; } return raiz[id] === undefined ? id : raiz[id]; };
    var unir = function (x, y) { var rx = buscar(x), ry = buscar(y); if (rx !== ry) raiz[ry] = rx; };
    pares.forEach(function (p) { unir(lista[p.a].id, lista[p.b].id); });
    var componentes = new Map();
    pares.forEach(function (p) {
      var r = buscar(lista[p.a].id);
      if (!componentes.has(r)) componentes.set(r, { canciones: [], pct: 100, ids: {} });
      var c = componentes.get(r);
      c.pct = Math.min(c.pct, p.pct);
      [lista[p.a], lista[p.b]].forEach(function (s) { if (!c.ids[s.id]) { c.ids[s.id] = true; c.canciones.push(s); } });
    });
    componentes.forEach(function (c) {
      if (c.canciones.length < 2) return;
      var grupo = armar('parecida', { clave: c.canciones.map(function (s) { return s.id; }).sort(function (x, y) { return x - y; }).join('+'), canciones: c.canciones });
      grupo.similitud = c.pct;
      out.push(grupo);
    });

    var orden = { titulo: 0, letra: 1, parecida: 2 };
    return out.sort(function (a, b) {
      if (a.tipo !== b.tipo) return orden[a.tipo] - orden[b.tipo];
      return b.canciones.length - a.canciones.length;
    });
  }

  // Firma del grupo para poder marcarlo como "dejar como está" (sobrevive a
  // recargar: se guarda en el navegador del admin).
  function firma(grupo) { return grupo.tipo + ':' + grupo.clave; }

  // La lista nueva: fuera las repetidas, la elegida tal cual estaba (no se toca
  // ninguna estrofa, descripción ni texto con comentarios de la que queda).
  function resolver(songs, borrar, conservarId) {
    var fuera = {};
    (borrar || []).forEach(function (id) { if (String(id) !== String(conservarId)) fuera[String(id)] = true; });
    return {
      canciones: (songs || []).filter(function (s) { return !fuera[String(s.id)]; }),
      borradas: Object.keys(fuera).map(Number)
    };
  }

  // Las listas globales que nombraban a las canciones borradas pasan a apuntar a
  // la que queda (sin repetirla), así ninguna lista queda con un hueco. Con
  // `conservarId` en null la canción se fue del cancionero y la lista deja de
  // nombrarla (es lo que usa el admin cuando aprueba un pedido de borrar).
  function remapearListas(listas, borrar, conservarId) {
    var fuera = {};
    (borrar || []).forEach(function (id) { if (String(id) !== String(conservarId)) fuera[String(id)] = true; });
    var cambios = [];
    var out = (listas || []).map(function (l) {
      var ids = l.songIds || [], nuevos = [], reemplazos = 0, puesta = false;
      ids.forEach(function (id) {
        var borrada = !!fuera[String(id)];
        var esLaQueQueda = String(id) === String(conservarId);
        if (borrada) reemplazos++;
        // Las referencias a las borradas pasan a la que queda; si ya estaba en la
        // lista, no se repite. Si no queda ninguna, la lista pierde esa posición.
        if (borrada || esLaQueQueda) {
          if (conservarId === null || conservarId === undefined) return;
          if (puesta) return;
          puesta = true;
          nuevos.push(conservarId);
          return;
        }
        nuevos.push(id);
      });
      // Una lista que no nombraba a ninguna borrada queda tal cual (ni siquiera se
      // le quitan los repetidos que pudiera tener): acá solo se reapunta.
      if (!reemplazos) return l;
      cambios.push({ id: l.id, name: l.name || 'Sin nombre', reemplazos: reemplazos, antes: ids.length, despues: nuevos.length });
      return Object.assign({}, l, { songIds: nuevos });
    });
    return { listas: out, cambios: cambios };
  }

  window.Duplicadas = {
    info: info,
    letraDe: letraDe,
    elegir: elegir,
    grupos: grupos,
    firma: firma,
    resolver: resolver,
    remapearListas: remapearListas
  };
})();
