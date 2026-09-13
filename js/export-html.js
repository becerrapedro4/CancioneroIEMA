/* ============================================================
   Generador del HTML exportado (canción / lista / cancionero).
   Lo usan index.html y admin.html: una sola plantilla, un solo lugar
   donde se define el diseño.

   Uso:
     ExportHTML.build({
       title:  "Lista del domingo",
       tag:    "#Iglesia · Rosario",
       footer: "IEMA · Rosario",
       style:  "minimal" | "aesthetic" | "glass" | "vintage" | "neon" | "nature",
       color:  "#E55A00",
       songs:  [{ title, artist, letra, stanzas: [{ d, x }] }]
     })
   ============================================================ */
window.ExportHTML = (function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function build(o) {
    o = o || {};
    const songs = o.songs || [];
    const style = o.style || "minimal";
    const hex = o.color || "#E55A00";
    const title = o.title || "Cancionero";
    const tag = o.tag || "#Iglesia · Rosario";
    const footer = o.footer || "IEMA · Rosario";
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);

    const songsData = JSON.stringify(songs);

    const acScript = `<script>
    const songs = ${songsData};
    document.addEventListener('DOMContentLoaded', () => {
      const list = document.getElementById('song-list');
      songs.forEach((s, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'ac-item';
        const stanzasHTML = s.stanzas && s.stanzas.length
          ? s.stanzas.map(p => \`<div class="stanza">\${p.d ? \`<div class="stanza-label">\${p.d}</div>\` : ''}
            <div class="stanza-text">\${p.x}</div></div>\`).join('')
          : \`<div class="stanza"><div class="stanza-text">\${s.letra}</div></div>\`;
        wrap.innerHTML = \`<div class="ac-hdr">
          <span class="ac-num">\${String(i+1).padStart(2,'0')}</span>
          <span class="ac-title">\${s.title}</span>
          <span class="ac-icon">+</span>
        </div>
        <div class="ac-body"><div class="ac-inner">\${stanzasHTML}</div></div>\`;
        wrap.querySelector('.ac-hdr').addEventListener('click', () => {
          const open = wrap.classList.contains('open');
          document.querySelectorAll('.ac-item.open').forEach(x => x.classList.remove('open'));
          if (!open) wrap.classList.add('open');
        });
        list.appendChild(wrap);
      });
    });
  <\/script>`;

    // Estilo minimalista
    if (style === "minimal") return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--a:${hex};--bg:#080808;--tx:#DEDAD4;--mu:#444;--br:#1C1C1C}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--tx);font-family:system-ui,-apple-system,sans-serif;min-height:100vh}
header{padding:72px 28px 56px;max-width:680px;margin:0 auto}
.hl{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--a);margin-bottom:18px}
h1{font-size:clamp(36px,9vw,72px);font-weight:700;line-height:1.0;letter-spacing:-1px}
h1 span{color:var(--a)}
.hc{margin-top:14px;font-size:13px;color:var(--mu)}
main{max-width:680px;margin:0 auto;padding:0 28px 100px}
.ac-item{border-top:1px solid var(--br)}
.ac-item:last-child{border-bottom:1px solid var(--br)}
.ac-hdr{display:flex;align-items:center;gap:18px;padding:22px 0;cursor:pointer;user-select:none}
.ac-num{font-size:11px;color:var(--mu);min-width:22px;font-variant-numeric:tabular-nums}
.ac-title{flex:1;font-size:16px;font-weight:500;transition:color .2s;color:#DEDAD4}
.ac-item:hover .ac-title,.ac-item.open .ac-title{color:var(--a)}
.ac-icon{font-size:22px;color:var(--mu);transition:transform .3s,color .2s;line-height:1}
.ac-item.open .ac-icon{transform:rotate(45deg);color:var(--a)}
.ac-body{max-height:0;overflow:hidden;transition:max-height .4s cubic-bezier(.4,0,.2,1)}
.ac-item.open .ac-body{max-height:3000px}
.ac-inner{padding:0 0 32px 40px}
.stanza{margin-bottom:22px}
.stanza-label{font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--mu);margin-bottom:8px}
.stanza-text{font-size:14px;line-height:2.1;white-space:pre-wrap;text-transform:uppercase;color:rgba(222,218,212,0.9)}
footer{text-align:center;padding:32px;color:var(--mu);font-size:12px;letter-spacing:1px}
</style>
</head>
<body>
<header><div class="hl">${esc(tag)}</div>
<h1>${esc(title).toUpperCase().split(" ").map((w,i)=>i===0?`<span>${w}</span>`:w).join(" ")}</h1>
<div class="hc">${songs.length} canciones</div></header>
<main id="song-list"></main>
<footer>${esc(footer)}</footer>
${acScript}
</body></html>`;

    // Estilo aesthetic
    if (style === "aesthetic") return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--a:${hex};--bg:#0C0A08;--tx:#EDE8E0;--mu:#5C5650;--br:#231F1B;--sur:#141210}
body{background:var(--bg);color:var(--tx);font-family:'DM Sans',sans-serif;min-height:100vh}
.hero{min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;padding:40px 24px}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 80%,rgba(${r},${g},${b},0.6),transparent 70%)}
.hero-tag{font-size:11px;letter-spacing:5px;text-transform:uppercase;color:var(--a);margin-bottom:28px;opacity:.8}
.hero-title{font-family:'Cormorant Garamond',serif;font-size:clamp(48px,14vw,120px);font-weight:600;line-height:.95;text-align:center;letter-spacing:-2px}
.hero-title em{color:var(--a);font-style:italic}
.hero-sub{margin-top:32px;font-size:13px;color:var(--mu);letter-spacing:2px;text-transform:uppercase}
.hero-line{width:1px;height:64px;background:linear-gradient(var(--a),transparent);margin:40px auto 0;opacity:.5}
.wrap{max-width:720px;margin:0 auto;padding:80px 28px 100px}
.sec-label{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--mu);margin-bottom:40px;padding-bottom:16px;border-bottom:1px solid var(--br)}
.ac-item{border-bottom:1px solid var(--br)}
.ac-hdr{display:grid;grid-template-columns:36px 1fr 24px;align-items:center;gap:16px;padding:26px 0;cursor:pointer;user-select:none}
.ac-num{font-family:'Cormorant Garamond',serif;font-size:13px;color:var(--mu);font-style:italic}
.ac-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;transition:color .25s;color:#EDE8E0}
.ac-item.open .ac-title,.ac-item:hover .ac-title{color:var(--a)}
.ac-icon{width:24px;height:24px;border-radius:50%;border:1px solid var(--br);display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--mu);transition:all .3s;flex-shrink:0;justify-self:end}
.ac-item.open .ac-icon{background:var(--a);border-color:var(--a);color:#000;transform:rotate(45deg)}
.ac-body{max-height:0;overflow:hidden;transition:max-height .45s cubic-bezier(.4,0,.2,1)}
.ac-item.open .ac-body{max-height:3000px}
.ac-inner{padding:8px 0 36px 52px}
.stanza{margin-bottom:24px}
.stanza-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--a);opacity:.6;margin-bottom:10px}
.stanza-text{font-size:14px;line-height:2.2;white-space:pre-wrap;text-transform:uppercase;color:rgba(237,232,224,0.9)}
footer{text-align:center;padding:48px 24px;color:var(--mu);font-size:12px;letter-spacing:2px;text-transform:uppercase;border-top:1px solid var(--br)}
</style>
</head>
<body>
<div class="hero">
  <div class="hero-tag">${esc(tag)}</div>
  <div class="hero-title">${esc(title).split(" ").map((w,i)=>i%2===1?`<em>${w}</em>`:w).join(" ")}</div>
  <div class="hero-sub">${songs.length} canciones</div>
  <div class="hero-line"></div>
</div>
<div class="wrap"><div class="sec-label">Lista de canciones</div><div id="song-list"></div></div>
<footer>${esc(footer)}</footer>
${acScript}
</body></html>`;

    // Estilo glass
    if (style === "glass") return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--a:${hex};--r:${r};--g:${g};--b:${b}}
body{background:#030308;color:#fff;font-family:'Inter',system-ui,sans-serif;min-height:100vh;overflow-x:hidden}
.orbs{position:fixed;inset:0;pointer-events:none;z-index:0}
.orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:.18}
.orb1{width:600px;height:600px;background:${hex};top:-200px;left:-100px}
.orb2{width:400px;height:400px;background:rgba(${r},${g},${b},.8);bottom:-150px;right:-100px;opacity:.12}
.orb3{width:300px;height:300px;background:#6366f1;top:40%;left:60%;opacity:.08}
.hero{position:relative;z-index:1;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center}
.glass-tag{background:rgba(${r},${g},${b},.15);border:1px solid rgba(${r},${g},${b},.3);backdrop-filter:blur(12px);border-radius:999px;padding:7px 18px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--a);margin-bottom:32px;display:inline-block}
h1{font-size:clamp(44px,12vw,110px);font-weight:700;line-height:1;letter-spacing:-2px;background:linear-gradient(135deg,#fff 30%,var(--a));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-count{margin-top:20px;font-size:13px;color:rgba(255,255,255,.35);letter-spacing:1px}
.hero-arrow{margin-top:48px;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.3);font-size:18px;animation:bob 2s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
.content{position:relative;z-index:1;max-width:740px;margin:0 auto;padding:80px 20px 100px}
.ac-item{margin-bottom:8px}
.ac-hdr{display:flex;align-items:center;gap:14px;padding:18px 20px;cursor:pointer;user-select:none;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);transition:background .2s,border-color .2s}
.ac-item:hover .ac-hdr,.ac-item.open .ac-hdr{background:rgba(${r},${g},${b},.1);border-color:rgba(${r},${g},${b},.35)}
.ac-num{font-size:12px;color:var(--a);font-weight:600;min-width:24px;font-variant-numeric:tabular-nums}
.ac-title{flex:1;font-size:15px;font-weight:500;letter-spacing:.2px;color:#fff}
.ac-icon{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:14px;color:rgba(255,255,255,.4);transition:all .3s;flex-shrink:0}
.ac-item.open .ac-icon{background:var(--a);border-color:var(--a);color:#000;transform:rotate(45deg);box-shadow:0 0 14px rgba(${r},${g},${b},.5)}
.ac-body{max-height:0;overflow:hidden;transition:max-height .45s cubic-bezier(.4,0,.2,1)}
.ac-item.open .ac-body{max-height:3000px}
.ac-inner{background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.05);border-top:none;border-radius:0 0 14px 14px;padding:24px 24px 28px;backdrop-filter:blur(8px)}
.stanza{margin-bottom:20px}
.stanza:last-child{margin-bottom:0}
.stanza-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(${r},${g},${b},.7);margin-bottom:8px}
.stanza-text{font-size:13px;line-height:2.1;white-space:pre-wrap;text-transform:uppercase;color:rgba(255,255,255,0.9)}
footer{position:relative;z-index:1;text-align:center;padding:40px 24px;color:rgba(255,255,255,.15);font-size:12px;letter-spacing:1px}
</style>
</head>
<body>
<div class="orbs"><div class="orb orb1"></div><div class="orb orb2"></div><div class="orb orb3"></div></div>
<div class="hero">
  <span class="glass-tag">${esc(tag)}</span>
  <h1>${esc(title).toUpperCase()}</h1>
  <div class="hero-count">${songs.length} canciones</div>
  <div class="hero-arrow">↓</div>
</div>
<div class="content" id="song-list"></div>
<footer>${esc(footer)}</footer>
${acScript}
</body></html>`;

    // Estilo vintage
    if (style === "vintage") return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#F5F0E8;color:#3C2E22;font-family:'DM Serif Display',serif;min-height:100vh}
.hero{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;text-align:center;background:linear-gradient(135deg,#E8DCC8 0%,#D4C4B0 100%);position:relative}
.hero::after{content:'';position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b8a08a' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")}
.hero > *{position:relative;z-index:1}
.hero-tag{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#8B7355;margin-bottom:20px}
.hero-title{font-family:'Playfair Display',serif;font-size:clamp(40px,12vw,96px);font-weight:700;line-height:1;color:#2C1F16}
.hero-title em{font-style:italic;color:#8B7355}
.hero-sub{margin-top:20px;font-size:14px;color:#8B7355;letter-spacing:2px}
.v-line{width:60px;height:2px;background:#8B7355;margin:28px auto 0;opacity:.4}
.wrap{max-width:720px;margin:0 auto;padding:60px 28px 80px}
.sec-label{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#8B7355;margin-bottom:40px;padding-bottom:16px;border-bottom:2px solid #E8DCC8}
.ac-item{border-bottom:1px solid #E8DCC8}
.ac-hdr{display:grid;grid-template-columns:36px 1fr 24px;align-items:center;gap:16px;padding:22px 0;cursor:pointer;user-select:none}
.ac-num{font-family:'Playfair Display',serif;font-size:14px;color:#8B7355;font-style:italic}
.ac-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;transition:color .3s;color:#2C1F16}
.ac-item.open .ac-title,.ac-item:hover .ac-title{color:#8B7355}
.ac-icon{font-size:20px;color:#C4B5A0;transition:transform .3s}
.ac-item.open .ac-icon{transform:rotate(45deg);color:#8B7355}
.ac-body{max-height:0;overflow:hidden;transition:max-height .4s cubic-bezier(.4,0,.2,1)}
.ac-item.open .ac-body{max-height:3000px}
.ac-inner{padding:0 0 32px 52px}
.stanza{margin-bottom:20px}
.stanza-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8B7355;margin-bottom:8px;font-family:'DM Serif Display',serif;font-style:italic}
.stanza-text{font-size:14px;line-height:2.1;white-space:pre-wrap;text-transform:uppercase;color:#4D3F32}
footer{text-align:center;padding:40px 24px;color:#8B7355;font-size:12px;letter-spacing:2px;border-top:2px solid #E8DCC8}
</style>
</head>
<body>
<div class="hero">
  <div class="hero-tag">${esc(tag)}</div>
  <div class="hero-title">${esc(title).toUpperCase().split(" ").map((w,i)=>i%2===1?`<em>${w}</em>`:w).join(" ")}</div>
  <div class="hero-sub">${songs.length} canciones</div>
  <div class="v-line"></div>
</div>
<div class="wrap"><div class="sec-label">Lista de canciones</div><div id="song-list"></div></div>
<footer>${esc(footer)}</footer>
${acScript}
</body></html>`;

    // Estilo neon
    if (style === "neon") return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#0A0A12;color:#fff;font-family:'Orbitron',monospace;min-height:100vh}
.hero{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;text-align:center;background:radial-gradient(ellipse at center, rgba(${r},${g},${b},0.15) 0%, transparent 70%)}
.hero-tag{font-size:10px;letter-spacing:6px;text-transform:uppercase;color:rgba(${r},${g},${b},0.7);text-shadow:0 0 20px rgba(${r},${g},${b},0.3);margin-bottom:24px}
.hero-title{font-size:clamp(36px,10vw,88px);font-weight:900;line-height:1;background:linear-gradient(135deg,#fff 20%,#${hex.slice(1)});-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-shadow:0 0 40px rgba(${r},${g},${b},0.3)}
.hero-sub{margin-top:20px;font-size:12px;color:rgba(255,255,255,.3);letter-spacing:4px}
.neon-line{width:80px;height:2px;background:linear-gradient(90deg,transparent,rgba(${r},${g},${b},0.5),transparent);margin:30px auto 0}
.wrap{max-width:720px;margin:0 auto;padding:60px 28px 80px}
.sec-label{font-size:9px;letter-spacing:6px;text-transform:uppercase;color:rgba(255,255,255,.15);margin-bottom:40px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.05)}
.ac-item{border-bottom:1px solid rgba(255,255,255,.05)}
.ac-hdr{display:grid;grid-template-columns:36px 1fr 24px;align-items:center;gap:16px;padding:20px 0;cursor:pointer;user-select:none}
.ac-num{font-size:11px;color:rgba(${r},${g},${b},0.5);font-variant-numeric:tabular-nums}
.ac-title{font-size:16px;font-weight:700;letter-spacing:1px;transition:color .3s;text-transform:uppercase;color:#fff}
.ac-item.open .ac-title,.ac-item:hover .ac-title{color:rgb(${r},${g},${b});text-shadow:0 0 20px rgba(${r},${g},${b},0.3)}
.ac-icon{font-size:18px;color:rgba(255,255,255,.2);transition:transform .3s}
.ac-item.open .ac-icon{transform:rotate(45deg);color:rgb(${r},${g},${b})}
.ac-body{max-height:0;overflow:hidden;transition:max-height .4s cubic-bezier(.4,0,.2,1)}
.ac-item.open .ac-body{max-height:3000px}
.ac-inner{padding:0 0 32px 52px}
.stanza{margin-bottom:20px}
.stanza-label{font-size:9px;letter-spacing:4px;text-transform:uppercase;color:rgba(${r},${g},${b},0.5);margin-bottom:8px}
.stanza-text{font-size:12px;line-height:2.1;white-space:pre-wrap;text-transform:uppercase;color:rgba(255,255,255,0.9)}
footer{text-align:center;padding:40px 24px;color:rgba(255,255,255,.1);font-size:10px;letter-spacing:4px;border-top:1px solid rgba(255,255,255,.05)}
</style>
</head>
<body>
<div class="hero">
  <div class="hero-tag">${esc(tag)}</div>
  <div class="hero-title">${esc(title)}</div>
  <div class="hero-sub">${songs.length} canciones</div>
  <div class="neon-line"></div>
</div>
<div class="wrap"><div class="sec-label">Lista de canciones</div><div id="song-list"></div></div>
<footer>${esc(footer)}</footer>
${acScript}
</body></html>`;

    // Estilo nature
    if (style === "nature") return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#1A241E;color:#D4C9B8;font-family:'Lora',serif;min-height:100vh}
.hero{min-height:50vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;text-align:center;background:linear-gradient(180deg,#1A241E 0%,#2A3A30 100%);position:relative}
.hero::before{content:'🌿';position:absolute;top:20px;right:30px;font-size:36px;opacity:.1}
.hero-tag{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#7A9A7E;margin-bottom:20px}
.hero-title{font-family:'Lora',serif;font-size:clamp(36px,10vw,80px);font-weight:600;line-height:1;color:#E8E0D4}
.hero-title em{color:#7A9A7E;font-style:italic}
.hero-sub{margin-top:20px;font-size:13px;color:#7A9A7E;letter-spacing:2px}
.nature-leaf{font-size:28px;margin-top:24px;opacity:.3}
.wrap{max-width:720px;margin:0 auto;padding:60px 28px 80px}
.sec-label{font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#7A9A7E;margin-bottom:40px;padding-bottom:16px;border-bottom:1px solid #2A3A30}
.ac-item{border-bottom:1px solid #2A3A30}
.ac-hdr{display:grid;grid-template-columns:36px 1fr 24px;align-items:center;gap:16px;padding:20px 0;cursor:pointer;user-select:none}
.ac-num{font-family:'Inter',sans-serif;font-size:11px;color:#7A9A7E;font-variant-numeric:tabular-nums}
.ac-title{font-size:18px;font-weight:600;transition:color .3s;color:#D4C9B8}
.ac-item.open .ac-title,.ac-item:hover .ac-title{color:#7A9A7E}
.ac-icon{font-size:18px;color:#3A4A3E;transition:transform .3s}
.ac-item.open .ac-icon{transform:rotate(45deg);color:#7A9A7E}
.ac-body{max-height:0;overflow:hidden;transition:max-height .4s cubic-bezier(.4,0,.2,1)}
.ac-item.open .ac-body{max-height:3000px}
.ac-inner{padding:0 0 32px 52px}
.stanza{margin-bottom:20px}
.stanza-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#7A9A7E;margin-bottom:8px}
.stanza-text{font-size:14px;line-height:2.1;white-space:pre-wrap;text-transform:uppercase;color:rgba(212,201,184,0.9)}
footer{text-align:center;padding:40px 24px;color:#3A4A3E;font-size:11px;letter-spacing:2px;border-top:1px solid #2A3A30}
</style>
</head>
<body>
<div class="hero">
  <div class="hero-tag">${esc(tag)}</div>
  <div class="hero-title">${esc(title).split(" ").map((w,i)=>i%2===1?`<em>${w}</em>`:w).join(" ")}</div>
  <div class="hero-sub">${songs.length} canciones</div>
  <div class="nature-leaf">🌿</div>
</div>
<div class="wrap"><div class="sec-label">Lista de canciones</div><div id="song-list"></div></div>
<footer>${esc(footer)}</footer>
${acScript}
</body></html>`;

    // Fallback minimal
    return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{font-family:system-ui;background:#080808;color:#DEDAD4;padding:20px}</style>
</head><body><h1>${esc(title)}</h1><p>Error: estilo no encontrado</p></body></html>`;
  }

  return { build: build };
})();
