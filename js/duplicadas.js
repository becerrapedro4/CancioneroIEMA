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
    // Lo que importa es no perder contenido: primero las estrofas con texto,
    // después los datos que cuelgan de ellas (comentarios, descripciones) y al
    // final el artista y el largo. Con puntajes iguales gana la más antigua.
    var punta = function (i) {
      return i.estrofas * 10 + i.comentarios * 5 + i.descripciones * 3 + (i.artist ? 2 : 0) + i.largo / 1000;
    };
    var mejor = 0;
    infos.forEach(function (i, k) { if (punta(i) > punta(infos[mejor])) mejor = k; });
    var elegida = infos[mejor];
    var otros = infos.filter(function (_, k) { return k !== mejor; });
    var maxDe = function (f) { return Math.max.apply(null, otros.map(f).concat([0])); };

    var motivos = [];
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
    var lista = songs || [], out = [];
    agrupar(lista, function (s) { return T.clave(s.title); }).forEach(function (g) {
      out.push(armar('titulo', g));
    });
    agrupar(lista, function (s) { return T.clave(letraDe(s)); }).forEach(function (g) {
      var titulos = {};
      g.canciones.forEach(function (s) { titulos[T.clave(s.title)] = true; });
      if (Object.keys(titulos).length < 2) return;
      out.push(armar('letra', g));
    });
    return out.sort(function (a, b) {
      if (a.tipo !== b.tipo) return a.tipo === 'titulo' ? -1 : 1;
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
  // la que queda (sin repetirla), así ninguna lista queda con un hueco.
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
        // lista, no se repite.
        if (borrada || esLaQueQueda) {
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
