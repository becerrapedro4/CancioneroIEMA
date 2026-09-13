// js/rooms-index.js
// Índice de salas activas (para elegir a qué stage mandar los mensajes).
//
// QUIÉN PUBLICA
//   stage.html            → rol "stage"     (la pantalla que muestra la letra)
//   index.html            → rol "presenter" (el que arma/presenta la lista)
//   biblia.html           → rol "presenter" (presenta versículos)
// Cada cliente manda un latido cada 25 s y se marca offline al cerrar la pestaña
// o al perder la conexión, así que una sala "activa" es una sala que se usó hace
// menos de 90 s.
//
// QUIÉN LEE
//   admin.html, para saber a qué sala mandar los mensajes y para limpiar las salas
//   que ya nadie usa.
//
// DÓNDE VIVE
//   En `rooms/_salas/...`, no en un nodo nuevo de primer nivel. Las reglas de la
//   base solo permiten leer y escribir dentro de `rooms`, así que el índice viaja
//   como un "cuarto" reservado (`_salas`) que ninguna página real usa.
//
// FORMA DE LOS DATOS
//   rooms/_salas/{key} = {
//     name: "sala_pedro_ab12",                     // nombre real (la key va escapada)
//     updated: 1736000000000,
//     stage:     { ts, online, mode, song },
//     presenter: { ts, online, song, from }
//   }
// El nombre que escribe cada cliente es su canción actual (song, texto suelto) y,
// para el stage, el layout que está mostrando (mode).
(function () {
  var STALE_MS = 90000;   // sin latido por más de esto = ya no está
  var BEAT_MS = 25000;    // cada cuánto late
  var BASE = 'rooms/_salas';   // reservado: no es una sala real, es el índice
  var ROLES = { stage: 'Stage', presenter: 'Presentador', viewer: 'Pantalla' };

  // Firebase no admite . # $ [ ] / en una key: las escapamos y guardamos aparte
  // el nombre real, para que un nombre raro no rompa el índice.
  function key(room) {
    return String(room == null ? '' : room).trim()
      .replace(/[.#$\[\]/]/g, function (c) { return '%' + c.charCodeAt(0).toString(16); });
  }
  function roleRef(room, role) { return window.db.ref(BASE + '/' + key(room) + '/' + role); }
  function entryRef(room) { return window.db.ref(BASE + '/' + key(room)); }

  // Publica la presencia de este dispositivo en `room` con el rol dado.
  // getExtra() (opcional) devuelve datos que se refrescan en cada latido.
  function track(room, role, getExtra) {
    if (!room || !role || !window.db) return null;
    var node = roleRef(room, role);
    var stopped = false;

    function payload(online) {
      var extra = {};
      try { extra = (typeof getExtra === 'function' ? getExtra() : getExtra) || {}; }
      catch (e) { extra = {}; }
      var out = { online: online, ts: Date.now() };
      for (var k in extra) if (extra[k] !== undefined && extra[k] !== null) out[k] = extra[k];
      return out;
    }
    function beat() {
      if (stopped) return;
      var p = payload(true);
      // `update` mezcla: no pisa el latido del otro rol en la misma sala.
      node.update(p);
      entryRef(room).update({ name: String(room).trim(), updated: p.ts });
    }
    function bye() { if (!stopped) node.update({ online: false, ts: Date.now() }); }

    var conn = window.db.ref('.info/connected');
    conn.on('value', function (snap) {
      if (snap.val() === true) {
        node.onDisconnect().update({ online: false, ts: Date.now() });
        beat();
      } else {
        bye();
      }
    });

    var timer = setInterval(beat, BEAT_MS);
    window.addEventListener('pagehide', bye);
    window.addEventListener('beforeunload', bye);

    return { stop: function () { stopped = true; clearInterval(timer); bye(); } };
  }

  /* ── LECTURA (la usa el admin) ── */

  function roleLive(entry, role) {
    var v = entry && entry[role];
    if (!v || typeof v.ts !== 'number') return false;
    return v.online !== false && (Date.now() - v.ts) < STALE_MS;
  }
  function liveRoles(entry) {
    return Object.keys(ROLES).filter(function (r) { return roleLive(entry, r); });
  }
  function isLive(entry) { return liveRoles(entry).length > 0; }
  function lastSeen(entry) {
    if (!entry) return 0;
    var top = entry.updated || 0;
    Object.keys(ROLES).forEach(function (r) {
      var ts = entry[r] && entry[r].ts;
      if (typeof ts === 'number' && ts > top) top = ts;
    });
    return top;
  }
  function label(role) { return ROLES[role] || role; }
  // "Stage conectado" / "Stage + Presentador conectados" / null si no hay nadie
  function summary(entry) {
    var live = liveRoles(entry);
    if (!live.length) return null;
    var names = live.map(label);
    if (names.length === 1) return names[0] + ' conectado';
    return names.slice(0, -1).join(' + ') + ' + ' + names[names.length - 1] + ' conectados';
  }

  // Borra del índice las salas que no se usan hace `days` días (nunca la actual).
  function prune(days, keepRoom) {
    if (!window.db) return Promise.resolve(0);
    var cutoff = Date.now() - (days || 30) * 86400000;
    var keep = key(keepRoom);
    return window.db.ref(BASE).once('value').then(function (snap) {
      var all = snap.val() || {};
      var borradas = 0;
      Object.keys(all).forEach(function (k) {
        if (k === keep) return;
        var e = all[k] || {};
        if (isLive(e)) return;
        if (lastSeen(e) > cutoff) return;
        window.db.ref(BASE + '/' + k).remove();
        borradas++;
      });
      return borradas;
    }).catch(function () { return 0; });
  }

  window.RoomsIndex = {
    BASE: BASE,
    key: key,
    track: track,
    roleLive: roleLive,
    liveRoles: liveRoles,
    isLive: isLive,
    lastSeen: lastSeen,
    label: label,
    summary: summary,
    prune: prune,
    STALE_MS: STALE_MS
  };
})();
