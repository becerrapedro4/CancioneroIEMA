#!/usr/bin/env node
// puente-holyrics.js
// ── EL PUENTE ENTRE LA PÁGINA Y HOLYRICS ──
//
// POR QUÉ EXISTE
//   La app vive en GitHub Pages (HTTPS) y el API de Holyrics es HTTP en tu PC: un navegador
//   no puede cruzar esos dos mundos (el contenido mixto lo bloquea antes de intentarlo), y
//   el servicio de internet de Holyrics no manda cabeceras CORS, así que tampoco se puede
//   leer desde una página. Este script corre en la PC que tiene Holyrics abierto y hace de
//   puente por Firebase, que ya es el bus de la app.
//
// QUÉ HACE
//   · Lee la conexión que cargaste en el admin: `rooms/<sala>/holyrics`.
//   · Cada `--cada` ms le pregunta a Holyrics qué tiene en pantalla y lo publica en
//     `rooms/<sala>/holyrics/now`, que es lo que muestra el stage de esa sala.
//   No escribe nada más, y no necesita instalar nada: Node 18+ (fetch incluido).
//
// CUÁNDO HACE FALTA
//   El admin abierto en una PC que alcance a Holyrics publica lo mismo mientras la pestaña
//   esté abierta (ver js/holyrics-live.js). Este puente es para que ande SOLO, sin ninguna
//   página abierta, y es el único camino cuando el admin está abierto desde la página
//   publicada (https), que no puede llegar al API http de la PC.
//
// CÓMO SE USA
//   node puente-holyrics.js --sala NOMBRE_DE_LA_SALA
//
// OPCIONES
//   --sala   la sala del stage (obligatorio).
//   --db     la base de Firebase (por defecto, la del proyecto).
//   --host --puerto --token   para probar sin cargar nada en el admin; si hay token, mandan.
//   --cada   cada cuántos ms se lee a Holyrics (por defecto 1500).
//   --una    un solo ciclo y sale (para probar).
'use strict';

const H = require('./js/holyrics-api.js');

if (!global.fetch) {
  console.error('Este puente necesita Node 18 o más nuevo (usa fetch). Tu versión es ' + process.version + '.');
  process.exit(2);
}

const args = process.argv.slice(2);
function opt(nombre, def) {
  const i = args.indexOf('--' + nombre);
  return i >= 0 ? args[i + 1] : def;
}
function flag(nombre) { return args.includes('--' + nombre); }

const SALA = String(opt('sala', '') || '').trim();
if (!SALA) {
  console.error('Falta la sala.\n\n  node puente-holyrics.js --sala NOMBRE_DE_LA_SALA\n');
  process.exit(2);
}

const DB = String(opt('db', 'https://browser-songs-default-rtdb.firebaseio.com')).replace(/\/+$/, '');
const CADA = Math.max(300, parseInt(opt('cada', 1500), 10) || 1500);
const UNA = flag('una');
const RAIZ = DB + '/rooms/' + encodeURIComponent(SALA) + '/holyrics';
const porArgs = H.normalizar({ host: opt('host'), puerto: opt('puerto'), token: opt('token') });
const usaArgs = !!porArgs.token;

let cfg = null, cfgTs = 0, verificado = '', ultimoEstado = '';

function hora() { return new Date().toTimeString().slice(0, 8); }
function aviso(msg) { console.log(hora() + ' ' + msg); }

// La conexión sale de la sala (lo que cargaste en el admin); los argumentos la reemplazan.
// Se relee cada 15 s, así un cambio en el admin se aplica sin reiniciar el puente.
async function leerConexion() {
  if (usaArgs) return H.deSala(porArgs);
  if (cfg && (Date.now() - cfgTs) < 15000) return cfg;
  const r = await fetch(RAIZ + '.json', { cache: 'no-store' });
  if (!r.ok) throw new Error('la base respondió ' + r.status + ' al leer la conexión de la sala');
  cfgTs = Date.now();
  return H.deSala(await r.json());
}

async function publicar(lectura) {
  const r = await fetch(RAIZ + '/now.json', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(H.paraPublicar(lectura, 'puente'))
  });
  if (!r.ok) throw new Error('la base rechazó la publicación (' + r.status + ')');
}

async function ciclo() {
  cfg = await leerConexion();

  if (!cfg.activo) {
    ultimoEstado = '';
    if (!flag('quieto')) aviso('La sala "' + SALA + '" no tiene conexión de Holyrics cargada. Cargala en el admin (🎦 Holyrics).');
    return;
  }

  // Una vez por conexión: confirmar que Holyrics contesta, con su versión.
  const firma = cfg.host + ':' + cfg.puerto + ':' + cfg.token;
  if (verificado !== firma) {
    const p = await H.probar(cfg);
    if (!p.ok) { aviso('✗ ' + p.error.mensaje); return; }
    verificado = firma;
    aviso('✓ Holyrics ' + p.version + (p.sistema ? ' · ' + p.sistema : '') + ' en ' + cfg.host + ':' + cfg.puerto);
  }

  const r = await H.enPantalla(cfg);
  if (!r.ok) { aviso('✗ ' + r.error.mensaje); return; }

  await publicar(r);

  const que = r.vacio
    ? 'sin presentación'
    : (r.titulo ? '“' + r.titulo + '”' : 'presentación') + ' · ' + (r.indice + 1) + '/' + r.total;
  if (que !== ultimoEstado) { ultimoEstado = que; aviso('🎦 ' + que); }
}

(async () => {
  aviso('Puente de Holyrics · sala "' + SALA + '" · ' + (usaArgs ? 'conexión por argumentos' : 'conexión de la sala') + ' · cada ' + CADA + ' ms');
  do {
    try { await ciclo(); } catch (e) { aviso('✗ ' + e.message); }
    if (!UNA) await new Promise(res => setTimeout(res, CADA));
  } while (!UNA);
  process.exit(0);
})();
