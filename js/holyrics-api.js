// js/holyrics-api.js
// ── LA CONEXIÓN CON HOLYRICS ──
//
// (No confundir con js/holyrics.js: ese es la FORMA del archivo del cancionero; este es
// cómo se habla con el PROGRAMA.)
//
// Holyrics escucha en su API Server: `POST http://{ip}:{puerto}/api/{accion}` con el token
// de acceso en la URL. Devuelve la presentación en curso, y eso es todo lo que la app le
// pide hoy: el stage muestra lo que Holyrics tiene en pantalla.
//
// Su servicio de internet (`api.holyrics.com.br`) queda afuera a propósito: NO manda
// cabeceras CORS (verificado el 2026-09-16), así que un navegador no puede leer sus
// respuestas — solo funcionaría desde Node, y el puente corre en la misma PC que Holyrics,
// donde el API local ya está a mano.
//
// Este módulo es el ÚNICO lugar donde se decide:
//   · la dirección, el puerto y el token (uno solo: el del API Server local);
//   · qué significa cada error: no llegar, contenido mixto, token inválido, sin permiso;
//   · cómo se convierte la presentación en curso en los textos que muestra el stage;
//   · qué se guarda en `rooms/<sala>/holyrics` y qué se lee de ahí.
//
// Lo usan admin.html (probar la conexión y guardarla en una sala), js/holyrics-live.js (el
// admin publicando lo que Holyrics tiene en pantalla), stage.html (mostrarlo) y
// puente-holyrics.js (este mismo archivo en Node, para cuando ninguna página llega a la PC).
(function () {
  'use strict';

  var DEF = { host: '127.0.0.1', puerto: 8091 };
  var VIDA = 8000;   // una lectura más vieja que esto ya no se muestra

  // ── LA CONEXIÓN ──
  // Entra lo que hay en un formulario (texto suelto, con o sin http://) y sale siempre la
  // misma forma. Un puerto inválido no rompe nada: cae al de Holyrics.
  function normalizar(cfg) {
    cfg = cfg || {};
    var host = String(cfg.host == null ? '' : cfg.host).trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '');
    var puerto = parseInt(cfg.puerto, 10);
    return {
      host: host || DEF.host,
      puerto: (puerto > 0 && puerto < 65536) ? puerto : DEF.puerto,
      token: String(cfg.token == null ? '' : cfg.token).trim()
    };
  }

  function url(cfg, accion) {
    var c = normalizar(cfg);
    return 'http://' + c.host + ':' + c.puerto + '/api/' + accion +
           '?token=' + encodeURIComponent(c.token);
  }

  function esLoopback(host) {
    return /^(127\.0\.0\.1|localhost|\[::1\]|::1)$/i.test(host);
  }

  // ¿Tiene sentido intentar hablar con Holyrics desde ESTE navegador? Desde una página
  // HTTPS, el API HTTP de la PC queda bloqueado (contenido mixto) salvo que sea la propia
  // máquina; ahí el único camino es el puente, y no vale la pena intentarlo ni llenar la
  // consola de errores. El botón «Probar conexión» del admin igual intenta siempre: su
  // trabajo es decir por qué no se puede.
  function alcanzableDesdeAca(cfg) {
    var c = normalizar(cfg);
    var https = (typeof location !== 'undefined' && location.protocol === 'https:');
    return !https || esLoopback(c.host);
  }

  // ── LOS ERRORES, DICHOS COMO SON ──
  // El navegador no cuenta por qué falló, así que se deduce: si la página está en HTTPS y
  // el API es HTTP, la conexión ni se intenta (contenido mixto) y hay que decir eso.
  function noLlego(c, u) {
    var https = (typeof location !== 'undefined' && location.protocol === 'https:');
    if (https && !esLoopback(c.host)) {
      return {
        tipo: 'bloqueado',
        mensaje: 'La página está en HTTPS y el API de Holyrics es HTTP: el navegador bloquea esa conexión. ' +
                 'Abrí esta página desde la misma PC (http://127.0.0.1…) o dejá que el puente hable con Holyrics.'
      };
    }
    return {
      tipo: 'red',
      mensaje: 'No se pudo llegar a ' + c.host + ':' + c.puerto + '. Fijate que Holyrics esté abierto, ' +
               'que el API Server esté encendido y que estés en la misma red.'
    };
  }

  function errorDeHolyrics(cuerpo) {
    var e = cuerpo && cuerpo.error;
    var msg = (typeof e === 'string' ? e : (e && (e.message || e.key))) || 'Holyrics rechazó la petición';
    var tipo = /token/i.test(msg) ? 'token' : /permiss/i.test(msg) ? 'permiso' : 'holyrics';
    var ayuda = tipo === 'token'
      ? 'El token se crea en Holyrics → Configuración → API Server → administrar permisos.'
      : tipo === 'permiso'
        ? 'Ese token no tiene habilitada esta acción: marcala en Holyrics → API Server.'
        : '';
    return { tipo: tipo, mensaje: msg + (ayuda ? (/[.!?]$/.test(msg) ? ' ' : '. ') + ayuda : '') };
  }

  // ── UNA PETICIÓN ──
  // Devuelve {ok:true, datos} o {ok:false, error:{tipo, mensaje}}. Nunca tira excepción:
  // quien llama no tiene que saber de fetch, JSON ni códigos HTTP.
  async function pedir(cfg, accion, datos) {
    var c = normalizar(cfg);
    var resp;
    try {
      resp = await fetch(url(c, accion), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos || {})
      });
    } catch (e) {
      return { ok: false, error: noLlego(c, url(c, accion)) };
    }
    var cuerpo = null;
    try { cuerpo = await resp.json(); } catch (e) { cuerpo = null; }
    if (!cuerpo) {
      return { ok: false, error: { tipo: 'http', mensaje: 'Holyrics respondió ' + resp.status + ' y no devolvió JSON.' } };
    }
    if (cuerpo.status !== 'ok') return { ok: false, error: errorDeHolyrics(cuerpo) };
    return { ok: true, datos: cuerpo.data === undefined ? null : cuerpo.data };
  }

  // ── ¿SE PUEDE HABLAR CON HOLYRICS? ──
  // Lo que usa el botón «Probar conexión» del admin: la versión del programa cuando sí, y
  // el motivo concreto cuando no.
  async function probar(cfg) {
    var c = normalizar(cfg);
    if (!c.token) return { ok: false, error: { tipo: 'config', mensaje: 'Falta el token del API Server de Holyrics.' } };
    var r = await pedir(c, 'GetVersion');
    if (!r.ok) return r;
    var d = (r.datos && r.datos.data) ? r.datos.data : (r.datos || {});
    return { ok: true, version: String(d.version || ''), sistema: String(d.platformDescription || d.platform || '') };
  }

  // ── LO QUE HOLYRICS TIENE EN PANTALLA ──
  // `items` es el texto de cada diapositiva de la presentación en curso (una canción, un
  // texto, un versículo…), `indice` la que se está viendo. Lo que se publica en la sala es
  // `paraPublicar` de acá abajo.
  async function enPantalla(cfg) {
    var r = await pedir(cfg, 'GetCurrentPresentation', { include_slides: true, include_slide_comment: true });
    if (!r.ok) return r;
    var d = r.datos;
    if (!d || !d.type) return { ok: true, vacio: true, tipo: '', titulo: '', items: [], indice: 0, total: 0 };
    var items = (d.slides || []).map(function (s) { return String((s && s.text) || '').replace(/\s+$/, ''); });
    return {
      ok: true,
      vacio: items.length === 0,
      tipo: String(d.type || ''),
      titulo: String(d.name || '').trim(),
      items: items,
      indice: Math.max(0, (d.slide_number || 1) - 1),
      total: d.total_slides || items.length
    };
  }

  // ¿Esta lectura sirve todavía? La usan el stage (para decidir si muestra Holyrics o lo
  // que manda el presentador) y el admin.
  function viva(p, ahora) {
    return !!(p && p.ts && ((ahora || Date.now()) - p.ts) < VIDA);
  }

  // Los textos del stage a partir de una lectura. `conSiguiente` es el preset: los modos
  // "actual y siguiente" lo piden, el modo "solo actual" no.
  function textos(p, conSiguiente) {
    if (!p || !p.ok || p.vacio) return { titulo: '', actual: '', siguiente: '' };
    var items = p.items || [];
    var i = p.indice || 0;
    return {
      titulo: p.titulo || '',
      actual: items[i] || '',
      siguiente: conSiguiente ? (items[i + 1] || '') : ''
    };
  }

  // ── LO QUE SE PUBLICA EN LA SALA ──
  // `rooms/<sala>/holyrics/now` lo escriben dos: el puente (puente-holyrics.js, en la PC del
  // programa) o una página abierta en esa misma PC (el admin, ver js/holyrics-live.js). Los
  // dos publican con esta misma forma, y `por` dice quién lo hizo para poder verlo en la
  // pantalla del stage y en el admin.
  function paraPublicar(lectura, por) {
    var r = lectura || {};
    var items = r.items || [];
    var i = Math.max(0, Math.min(items.length ? items.length - 1 : 0, r.indice || 0));
    return {
      ts: Date.now(),
      por: String(por || ''),
      ok: true,
      vacio: !!r.vacio,
      tipo: String(r.tipo || ''),
      titulo: String(r.titulo || ''),
      actual: items[i] || '',
      siguiente: items[i + 1] || '',
      items: items,
      indice: i,
      total: r.total || items.length
    };
  }

  // ── LA CONEXIÓN DE UNA SALA ──
  // Lo que el admin escribe en `rooms/<sala>/holyrics` y lo que leen el stage y el puente.
  function deSala(o) {
    o = o || {};
    var c = normalizar(o);
    return {
      activo: o.activo !== false && !!c.token,
      host: c.host, puerto: c.puerto, token: c.token,
      actualizado: o.actualizado || 0
    };
  }

  function paraSala(cfg) {
    var c = normalizar(cfg);
    return { activo: true, host: c.host, puerto: c.puerto, token: c.token, actualizado: Date.now() };
  }

  var API = {
    VIDA: VIDA,
    normalizar: normalizar,
    url: url,
    pedir: pedir,
    probar: probar,
    enPantalla: enPantalla,
    alcanzableDesdeAca: alcanzableDesdeAca,
    viva: viva,
    textos: textos,
    paraPublicar: paraPublicar,
    deSala: deSala,
    paraSala: paraSala
  };

  if (typeof module === 'object' && module.exports) module.exports = API;   // puente-holyrics.js
  if (typeof window !== 'undefined') window.HolyricsAPI = API;
})();
