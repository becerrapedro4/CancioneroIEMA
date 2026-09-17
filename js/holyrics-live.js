// js/holyrics-live.js
// ── EL PUBLICADOR: MANTENER AL DÍA LO QUE HOLYRICS TIENE EN PANTALLA ──
//
// POR QUÉ EXISTE
//   El stage de una sala muestra lo que Holyrics tiene en pantalla, pero solo si alguien
//   publica `rooms/<sala>/holyrics/now`. Quien le pregunta a Holyrics puede ser el puente
//   (puente-holyrics.js, un proceso en la PC del programa) o una página abierta EN esa PC,
//   que sí llega al API: eso segundo es este módulo, y lo usa el admin.
//
// QUÉ HACE
//   Mientras la sala tenga una conexión activa y esta página alcance la PC, lee
//   `GetCurrentPresentation` cada `cada` ms y llama a `guardar(paquete)` con la forma que
//   arma js/holyrics-api.js (`paraPublicar`). De Firebase no sabe nada: se lo dan.
//   Se detiene solo si la sala no tiene conexión, si el navegador bloquea la conexión, o si
//   se lo pide `parar()`. Una lectura a la vez: si Holyrics tarda, la siguiente no se encima.
//
// POR QUÉ ADEMÁS SE PUEDE DESPERTAR (`ahora`)
//   Medido en Chrome: con la pestaña de fondo, un temporizador de 2 s pasa a latir una vez
//   por minuto (frenado intensivo de pestañas ocultas), y ni el WebSocket de Firebase ni un
//   Web Lock lo evitan — el stage de esa sala se quedaba con la letra vieja. Un EVENTO de red
//   en cambio llega al instante en la misma pestaña oculta (medido: 190 ms). Por eso, además
//   del reloj, quien esté publicando puede ser despertado: `ahora()` corre un ciclo cuando
//   alguien lo pide (el stage escribe `rooms/<sala>/holyrics/pedido`, ver stage.html), con un
//   mínimo entre ciclos para que dos stages no disparen de más.
//
// QUIÉN LO USA
//   admin.html — la pestaña del admin, que es la que suele estar abierta en la PC de
//   Holyrics. Con eso, el stage de la sala elegida ya no necesita el puente; el puente
//   queda para cuando no hay ningún admin abierto que alcance la PC.
(function () {
  'use strict';

  var DEF = 2000;         // cada cuánto se le pregunta a Holyrics
  var MINIMO = 800;       // hueco mínimo entre ciclos pedidos por evento (dos stages piden a la vez)

  var loop = null;                                  // el ciclo en curso
  var estado = { publicando: false, motivo: '' };   // por qué sí o por qué no

  function HAPI() { return (typeof window !== 'undefined' && window.HolyricsAPI) || null; }
  function copiado() { return { publicando: estado.publicando, motivo: estado.motivo }; }

  // El estado solo se informa cuando cambia: quien lo escucha repinta, no hace cuentas.
  function decirlo(nuevo, avisar) {
    if (nuevo.publicando === estado.publicando && nuevo.motivo === estado.motivo) return;
    estado = nuevo;
    if (typeof avisar === 'function') avisar(copiado());
  }

  function detener(motivo, avisar) {
    if (loop) { clearInterval(loop.timer); loop = null; }
    decirlo({ publicando: false, motivo: motivo || '' }, avisar);
  }

  function parar() { detener(''); }

  // Una vuelta del ciclo: una lectura a la vez, y las pedidas por evento no más seguidas que
  // `MINIMO` (dos stages en la misma sala piden a la vez). Devuelve si arrancó una vuelta.
  function disparar(porEvento) {
    var mio = loop;                       // el ciclo puede terminar mientras este corre
    if (!mio || mio.ocupado) return false;
    if (porEvento && (Date.now() - mio.ultimo) < mio.minimo) return false;
    mio.ocupado = true;
    mio.ultimo = Date.now();
    ciclo(mio.opciones).catch(function (e) {
      decirlo({ publicando: false, motivo: (e && e.message) || String(e) }, mio.opciones.alCambiar);
    }).then(function () { mio.ocupado = false; });
    return true;
  }

  // Un ciclo: una lectura y una publicación. Devuelve si publicó.
  async function ciclo(opciones) {
    var o = opciones || {};
    var H = HAPI();
    if (!H) { decirlo({ publicando: false, motivo: 'falta cargar js/holyrics-api.js' }, o.alCambiar); return false; }
    if (!o.cfg || !o.cfg.activo) { decirlo({ publicando: false, motivo: 'la sala no tiene conexión de Holyrics' }, o.alCambiar); return false; }

    var r = await H.enPantalla(o.cfg);
    if (!r.ok) {
      // Si el navegador bloquea la conexión (página https hacia el API http de la PC),
      // insistir no cambia nada: se dice una vez y se para. El resto de los fallos (la PC
      // apagada, el token vencido) sí ameritan seguir intentando.
      if (r.error.tipo === 'bloqueado') detener(r.error.mensaje, o.alCambiar);
      else decirlo({ publicando: false, motivo: r.error.mensaje }, o.alCambiar);
      return false;
    }

    await o.guardar(H.paraPublicar(r, o.por || 'admin'));
    decirlo({ publicando: true, motivo: '' }, o.alCambiar);
    return true;
  }

  // Arranca (o reemplaza) el publicador de una sala.
  //   { room, cfg, guardar, por, cada, alCambiar }
  function arrancar(opciones) {
    parar();
    var o = opciones || {};
    if (!HAPI()) {
      decirlo({ publicando: false, motivo: 'falta cargar js/holyrics-api.js' }, o.alCambiar);
      return copiado();
    }
    if (!o.room || typeof o.guardar !== 'function') {
      decirlo({ publicando: false, motivo: 'no hay a quién publicarle' }, o.alCambiar);
      return copiado();
    }
    if (!o.cfg || !o.cfg.activo) {
      decirlo({ publicando: false, motivo: 'la sala “' + o.room + '” no tiene conexión de Holyrics' }, o.alCambiar);
      return copiado();
    }
    // No se supone si esta página alcanza la PC: se prueba. Si el navegador la bloquea, el
    // error lo dice (`noLlego`) y el ciclo se detiene solo.
    loop = {
      opciones: o,
      ocupado: false,
      ultimo: 0,
      minimo: MINIMO,
      timer: null
    };
    var mio = loop;
    disparar(false);
    mio.timer = setInterval(function () { if (loop === mio) disparar(false); }, Math.max(600, o.cada || DEF));
    return copiado();
  }

  var MODULO = {
    CADA: DEF,
    arrancar: arrancar,
    parar: parar,
    detener: detener,
    ciclo: ciclo,
    estado: copiado,
    ahora: function () { return disparar(true); }   // un ciclo pedido por evento (el stage)
  };

  if (typeof module === 'object' && module.exports) module.exports = MODULO;   // pruebas en Node
  if (typeof window !== 'undefined') window.HolyricsLive = MODULO;
})();
