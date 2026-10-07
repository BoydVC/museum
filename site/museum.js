/* Build Night Museum: walkable three.js gallery. Data: window.MUSEUM (built by build.py from hub/scan.py). */
(() => {
const D = window.MUSEUM, T = THREE;
const Q = new URLSearchParams(location.search);
const W = 14, H = 4.6, LOBBY = 20, SPACING = 6.2, DOOR = 3.4, EYE = 1.65;
const canvas = document.getElementById('c');
const renderer = new T.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new T.Scene(); scene.background = new T.Color(0x0d0b09); scene.fog = new T.Fog(0x0d0b09, 18, 60);
const cam = new T.PerspectiveCamera(70, 1, 0.05, 200); cam.rotation.order = 'YXZ';
scene.add(new T.HemisphereLight(0xfff4e0, 0x504030, 2.2));
const sun = new T.DirectionalLight(0xffffff, 0.6); sun.position.set(3, 10, 4); scene.add(sun);

// ---------- layout ----------
const rooms = D.rooms.map((r, i) => ({...r, i, items: D.paintings.filter(p => p.roomIndex === i)}));
let z = -LOBBY; const bounds = [{title: 'Lobby', z0: 0, z1: -LOBBY}];
rooms.forEach(r => { const len = Math.max(13, Math.ceil(r.items.length / 2) * SPACING + 5); r.z0 = z; r.z1 = z - len; z = r.z1; bounds.push({title: r.title, z0: r.z0, z1: r.z1}); });
const ZEND = z;
const loader = new T.TextureLoader(); let pending = 0, loaded = 0;
function tex(src) { pending++; const t = loader.load(src, () => { loaded++; checkReady(); }, undefined, () => { loaded++; checkReady(); }); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
function checkReady() { if (loaded >= pending) setTimeout(() => { document.title = 'ready · ' + document.title; window.__museumReady = true; }, 150); }
const M = (c, o = {}) => new T.MeshLambertMaterial({color: c, ...o});
function box(w, h, d, mat, x, y, zz) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, zz); scene.add(m); return m; }
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
function plane(w, h, map, x, y, zz, ry) { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({map, toneMapped: false})); m.position.set(x, y, zz); m.rotation.y = ry || 0; scene.add(m); return m; }
function wrap(ctx, text, x, y, maxW, lh, maxLines) {
  const words = String(text).split(/\s+/); let line = '', n = 0;
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y + n * lh); n++; line = w; if (n >= maxLines - 1) { /* last line */ } } else line = t; if (n >= maxLines) return; }
  if (line && n < maxLines) ctx.fillText(n === maxLines - 1 && words.length ? line : line, x, y + n * lh);
}
// floor / ceiling / walls
const roomColors = [0x6d5b4a, 0x34495e, 0x2f4a3a, 0x6b4e5e, 0x4a4a56, 0x23304a];
const floorTex = canvasTex(256, 256, (g) => { g.fillStyle = '#5a4128'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#654a2e' : '#4f3922'; g.fillRect(0, i * 32, 256, 30); } });
floorTex.wrapS = floorTex.wrapT = T.RepeatWrapping; floorTex.repeat.set(W / 3, -ZEND / 3);
const floor = new T.Mesh(new T.PlaneGeometry(W, -ZEND), new T.MeshLambertMaterial({map: floorTex})); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, ZEND / 2); scene.add(floor); floor.userData.floor = true;
box(W, 0.1, -ZEND, M(0x4a4036), 0, H + 0.05, ZEND / 2);
bounds.forEach((b, i) => {
  const len = b.z0 - b.z1, mid = (b.z0 + b.z1) / 2, col = M(roomColors[i % roomColors.length]);
  box(0.2, H, len, col, -W / 2 - 0.1, H / 2, mid); box(0.2, H, len, col, W / 2 + 0.1, H / 2, mid);
  box(0.06, 0.25, len, M(0x222), -W / 2 + 0.03, 0.12, mid); box(0.06, 0.25, len, M(0x222), W / 2 - 0.03, 0.12, mid);
  const l = new T.PointLight(0xfff0d0, 22, 30, 1.6); l.position.set(0, H - 0.4, mid); scene.add(l);
});
box(W + 0.4, H, 0.2, M(0x3a3026), 0, H / 2, 0.1); box(W + 0.4, H, 0.2, M(0x3a3026), 0, H / 2, ZEND - 0.1);
function sign(text, sub, w, h) { return canvasTex(1024, Math.round(1024 * h / w), (g, cw, ch) => {
  g.fillStyle = '#16120d'; g.fillRect(0, 0, cw, ch); g.strokeStyle = '#c9a24e'; g.lineWidth = 10; g.strokeRect(8, 8, cw - 16, ch - 16);
  g.fillStyle = '#e8c77a'; g.textAlign = 'center'; g.font = `bold ${Math.round(ch * 0.42)}px Georgia`; g.fillText(text, cw / 2, ch * (sub ? 0.52 : 0.64));
  if (sub) { g.fillStyle = '#d8cdb5'; g.font = `${Math.round(ch * 0.2)}px Georgia`; g.fillText(sub, cw / 2, ch * 0.84); } }); }
// partitions with doorways + room signs
bounds.slice(1).forEach((b, i) => {
  const zb = b.z0, side = (W - DOOR) / 2, col = M(0x3a3026);
  box(side, H, 0.3, col, -(DOOR / 2 + side / 2), H / 2, zb); box(side, H, 0.3, col, DOOR / 2 + side / 2, H / 2, zb);
  box(DOOR, H - 3, 0.3, col, 0, 3 + (H - 3) / 2, zb);
  const r = rooms[i];
  plane(4.2, 0.9, sign(r.title, `${r.count} paintings · ${r.subtitle}`, 4.2, 0.9), 0, 3.55, zb + 0.16, 0);
  plane(3.4, 0.7, sign('← ' + bounds[i].title, null, 3.4, 0.7), 0, 3.55, zb - 0.16, Math.PI);
});
// ---------- paintings ----------
const clickables = [], stops = [];
function placardTex(p) { return canvasTex(768, 460, (g, w, h) => {
  g.fillStyle = '#f3ede0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#9a8a6a'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = '#1b1712'; g.textAlign = 'left'; g.font = 'bold 40px Georgia'; wrap(g, p.title, 28, 62, w - 56, 44, 2);
  g.font = 'italic 24px Georgia'; g.fillStyle = '#5a4d38'; g.fillText(p.name + ' · ' + p.room + ' room', 28, 160);
  g.font = '25px Georgia'; g.fillStyle = '#2a241b'; wrap(g, p.desc, 28, 205, w - 56, 32, 5);
  g.fillStyle = '#1b1712'; g.fillRect(28, h - 78, w - 56, 2); g.font = 'bold 25px system-ui,sans-serif';
  const s = p.stats; g.fillText(`${s.files} files · ${s.loc.toLocaleString()} lines · ${s.tests} tests · ${s.screenshots} screenshots`, 28, h - 38); }); }
function noImageTex(p) { return canvasTex(800, 520, (g, w, h) => { g.fillStyle = '#2a2620'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9a24e'; g.textAlign = 'center';
  g.font = 'bold 46px Georgia'; wrap(g, p.title, w / 2, 170, w - 80, 52, 2); g.fillStyle = '#d8cdb5'; g.font = 'italic 28px Georgia';
  g.fillText(p.imageNote.startsWith('placard-only: private') ? 'Picture withheld: ' + p.imageNote.replace('placard-only: ', '') : 'No screenshot on file', w / 2, 330); g.font = '24px Georgia'; g.fillText('(placard only)', w / 2, 375); }); }
function hang(p, x, zc, facing) { // facing: +1 => wall at -x facing +x
  const ry = facing > 0 ? Math.PI / 2 : -Math.PI / 2, wx = x + facing * 0.06;
  let pw = 3.4, ph = 1.9;
  if (p.image) { const a = p.image.w / p.image.h; if (a > pw / ph) ph = pw / a; else pw = ph * a; }
  const frame = new T.Mesh(new T.BoxGeometry(0.08, ph + 0.24, pw + 0.24), M(0x6b4f22)); frame.position.set(x + facing * 0.04, 2.45, zc); scene.add(frame);
  const pic = plane(pw, ph, p.image ? tex(p.image.file) : noImageTex(p), wx + facing * 0.03, 2.45, zc, ry);
  const pl = plane(1.55, 0.93, placardTex(p), wx + facing * 0.02, 0.84, zc, ry);
  [pic, pl, frame].forEach(m => { m.userData.painting = p; clickables.push(m); });
  const spot = new T.SpotLight(0xfff2d8, 18, 7, 0.5, 0.6, 1.2); spot.position.set(x + facing * 2.2, H - 0.2, zc); spot.target = pic; scene.add(spot);
  stops.push({p, pos: new T.Vector3(x + facing * 3.4, EYE, zc), yaw: facing > 0 ? Math.PI / 2 : -Math.PI / 2, pitch: 0.06, label: `<b>${esc(p.title)}</b> · ${esc(p.room)} room<br>${esc(p.desc)}`});
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
// lobby first (tour starts here)
const lobbyStops = [];
(function lobby() {
  const L = D.lobby, u = L.usage || {};
  if (L.strip) {
    const a = L.strip.w / L.strip.h, sh = 3.3, sw = sh * a;
    box(sw + 0.5, 0.4, 0.8, M(0x2b2219), 0, 0.2, -10);
    box(sw + 0.3, sh + 0.3, 0.12, M(0x6b4f22), 0, 0.4 + sh / 2 + 0.15, -10);
    const t = tex(L.strip.file);
    const f = plane(sw, sh, t, 0, 0.55 + sh / 2, -9.93, 0); f.userData.painting = {title: 'Fleet Funnies: Build Night Special', name: 'fleet-funnies', room: 'Lobby', desc: 'Tonight\'s comic strip: the fleet races the usage reset.', stats: null, image: L.strip, imageNote: 'lobby centerpiece'}; clickables.push(f);
    const b = plane(sw, sh, t, 0, 0.55 + sh / 2, -10.07, Math.PI); b.userData.painting = f.userData.painting; clickables.push(b);
    const sp = new T.SpotLight(0xffffff, 30, 10, 0.6, 0.5, 1.2); sp.position.set(0, H - 0.2, -6.5); sp.target = f; scene.add(sp);
    lobbyStops.push({pos: new T.Vector3(0, EYE, -4.6), yaw: 0, pitch: 0.12, label: '<b>Lobby centerpiece</b> · Fleet Funnies "Build Night Special"'});
  }
  const pct = Number(u.used_pct), checked = u.checked_at ? new Date(u.checked_at) : null;
  const when = checked && !isNaN(checked) ? checked.toLocaleString('en-US', {timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}) + ' ET' : 'unknown time';
  const ut = canvasTex(1024, 640, (g, w, h) => {
    g.fillStyle = '#121a24'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a24e'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#e8c77a'; g.font = 'bold 54px Georgia'; g.textAlign = 'center'; g.fillText('Fuel Gauge', w / 2, 90);
    g.fillStyle = '#d8cdb5'; g.font = '30px Georgia'; g.fillText(u.label || 'Grok Bot weekly usage', w / 2, 140);
    g.fillStyle = '#2a3442'; g.fillRect(80, 200, w - 160, 90); if (!isNaN(pct)) { g.fillStyle = pct > 85 ? '#ef4444' : '#e8c77a'; g.fillRect(80, 200, (w - 160) * pct / 100, 90); }
    g.fillStyle = '#fff'; g.font = 'bold 64px system-ui'; g.fillText(isNaN(pct) ? 'no reading' : pct + '% used', w / 2, 268);
    g.fillStyle = '#d8cdb5'; g.font = '32px Georgia'; g.fillText('Reading taken ' + when, w / 2, 370);
    g.fillText('Resets ' + (u.reset_date || '?') + (u.reset_at ? ' at ' + u.reset_at : ' (time not shown on dashboard)'), w / 2, 420);
    g.font = 'italic 24px Georgia'; g.fillStyle = '#a99d85'; g.fillText('Source: ' + (u.source || 'usage.json'), w / 2, 480);
    g.fillText('read from /workspace/tokenmax/usage.json at build time', w / 2, 515);
    g.fillText('Built from leftover tokens before the reset.', w / 2, 580); });
  plane(3.6, 2.25, ut, -W / 2 + 0.05, 2.3, -11, Math.PI / 2);
  lobbyStops.push({pos: new T.Vector3(-W / 2 + 3.6, EYE, -11), yaw: Math.PI / 2, pitch: 0.05, label: `<b>Fuel Gauge</b> · ${isNaN(pct) ? '' : pct + '% of Grok Bot weekly usage used as of ' + esc(when)}`});
  const t = D.totals, gen = new Date(D.generatedAt);
  const wt = canvasTex(1024, 640, (g, w, h) => {
    g.fillStyle = '#16120d'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a24e'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#e8c77a'; g.textAlign = 'center'; g.font = 'bold 60px Georgia'; g.fillText('Build Night Museum', w / 2, 100);
    g.fillStyle = '#d8cdb5'; g.font = 'italic 32px Georgia'; g.fillText('TokenMax · Wednesday, October 7, 2026', w / 2, 150);
    g.font = '36px Georgia'; g.fillText(`${D.paintings.length} paintings in ${D.rooms.length} rooms`, w / 2, 240);
    g.fillText(`${t.files.toLocaleString()} files · ${t.loc.toLocaleString()} lines of code`, w / 2, 300);
    g.fillText(`${t.tests} test files · ${t.screenshots} screenshots`, w / 2, 360);
    g.font = '28px Georgia'; g.fillText(D.rooms.map(r => r.title).join('  ·  '), w / 2, 440);
    g.font = 'italic 22px Georgia'; g.fillStyle = '#a99d85'; g.fillText('Counts measured by hub/scan.py at ' + gen.toLocaleString('en-US', {timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit'}) + ' ET', w / 2, 540); });
  plane(3.6, 2.25, wt, W / 2 - 0.05, 2.3, -11, -Math.PI / 2);
  lobbyStops.push({pos: new T.Vector3(W / 2 - 3.6, EYE, -11), yaw: -Math.PI / 2, pitch: 0.05, label: '<b>Welcome</b> · counts measured by hub/scan.py'});
  plane(5, 1.1, sign('Build Night Museum', 'TokenMax · Oct 7, 2026', 5, 1.1), 0, 3.7, -0.02 + -0.01, 0).rotation.y = 0;
})();
rooms.forEach(r => r.items.forEach((p, k) => { const left = k % 2 === 0, zc = r.z0 - 4 - Math.floor(k / 2) * SPACING; hang(p, left ? -W / 2 : W / 2, zc, left ? 1 : -1); }));
const tourStops = [...lobbyStops, ...stops];
checkReady();

// ---------- controls ----------
const st = {pos: new T.Vector3(0, EYE, -2.2), yaw: 0, pitch: 0.02, target: null, keys: {}, tour: null};
function setView(pos, yaw, pitch) { st.pos.copy(pos); st.yaw = yaw; st.pitch = pitch; }
function collide(np) {
  np.x = Math.max(-W / 2 + 0.5, Math.min(W / 2 - 0.5, np.x)); np.z = Math.max(ZEND + 0.5, Math.min(-0.5, np.z));
  for (const b of bounds.slice(1)) { const zb = b.z0; if (Math.abs(np.z - zb) < 0.45 && Math.abs(np.x) > DOOR / 2 - 0.35) { np.z = st.pos.z > zb ? zb + 0.45 : zb - 0.45; if (Math.abs(st.pos.z - zb) < 0.45) np.x = Math.sign(np.x) * (DOOR / 2 - 0.36); } }
  if (D.lobby.strip) { const hw = 2.6; if (Math.abs(np.x) < hw && Math.abs(np.z + 10) < 0.7) { if (Math.abs(st.pos.x) >= hw) np.x = Math.sign(np.x || 1) * hw; else np.z = st.pos.z > -10 ? -9.3 : -10.7; } }
  return np;
}
addEventListener('keydown', e => { if (e.target.tagName === 'SELECT') return; st.keys[e.code] = true; if (e.code === 'KeyT') toggleTour(); if (e.code === 'Escape') closeOv(); if (!['KeyT', 'Escape'].includes(e.code)) stopTour(); });
addEventListener('keyup', e => { st.keys[e.code] = false; });
let drag = null; const ray = new T.Raycaster();
canvas.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), touch: e.pointerType !== 'mouse'}; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
  if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) { stopTour(); st.target = null; }
  st.yaw -= dx * (drag.touch ? 0.006 : 0.004);
  if (drag.touch) { const f = new T.Vector3(-Math.sin(st.yaw), 0, -Math.cos(st.yaw)); collide(st.pos.clone().addScaledVector(f, -dy * 0.03)) && st.pos.copy(collide(st.pos.clone().addScaledVector(f, -dy * 0.03))); }
  else st.pitch = Math.max(-1.2, Math.min(1.2, st.pitch - dy * 0.004)); });
canvas.addEventListener('pointerup', e => { if (!drag) return; const moved = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy); const d = drag; drag = null;
  if (moved < 9 && performance.now() - d.t < 600) pick(e.clientX, e.clientY); });
canvas.addEventListener('wheel', e => { e.preventDefault(); stopTour(); const f = new T.Vector3(-Math.sin(st.yaw), 0, -Math.cos(st.yaw)); st.pos.copy(collide(st.pos.clone().addScaledVector(f, -e.deltaY * 0.01))); }, {passive: false});
function pick(x, y) {
  const r = canvas.getBoundingClientRect(); ray.setFromCamera(new T.Vector2((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1), cam);
  const hits = ray.intersectObjects([...clickables, floor], false); if (!hits.length) return; const h = hits[0];
  stopTour();
  if (h.object.userData.painting && h.distance < 14) openOv(h.object.userData.painting);
  else if (h.object === floor || h.object.userData.painting) st.target = new T.Vector3(h.point.x, EYE, h.point.z);
}
// ---------- overlay ----------
const $ = id => document.getElementById(id);
function openOv(p) { $('overlay').hidden = false; $('ovTitle').textContent = p.title; $('ovDesc').textContent = p.desc || '';
  $('ovStats').textContent = p.stats ? `${p.stats.files} files · ${p.stats.loc.toLocaleString()} lines of code · ${p.stats.tests} tests · ${p.stats.screenshots} screenshots` : '';
  $('ovSrc').textContent = p.image ? `${p.name}/${p.image.src} (${p.imageNote}; downscaled)` : `${p.name}: ${p.imageNote}`;
  if (p.image) { $('ovImg').hidden = false; $('ovNo').hidden = true; $('ovImg').src = p.image.file; } else { $('ovImg').hidden = true; $('ovNo').hidden = false; $('ovNo').textContent = p.imageNote.includes('private') ? 'Picture withheld (' + p.imageNote.replace('placard-only: ', '') + '). Placard only.' : 'No screenshot on file for this project.'; }
  window.__openPainting = p.name; }
function closeOv() { $('overlay').hidden = true; window.__openPainting = null; }
$('ovClose').onclick = closeOv; $('overlay').addEventListener('click', e => { if (e.target.id === 'overlay') closeOv(); });
$('helpBtn').onclick = () => { $('help').hidden = !$('help').hidden; }; $('helpClose').onclick = () => { $('help').hidden = true; };
// ---------- rooms menu + tour ----------
const sel = $('roomSel'); sel.innerHTML = '<option value="">Jump to room…</option>' + bounds.map((b, i) => `<option value="${i}">${esc(b.title)}${i ? ' (' + rooms[i - 1].count + ')' : ''}</option>`).join('');
sel.onchange = () => { if (sel.value === '') return; stopTour(); goRoom(+sel.value); sel.value = ''; sel.blur(); };
function goRoom(i, yawDeg) { const b = bounds[i]; setView(new T.Vector3(i ? 1.2 : 0, EYE, b.z0 - (i ? 1.0 : 2.2)), yawDeg != null ? yawDeg * Math.PI / 180 : 0, i ? -0.02 : 0.02); st.target = null; }
function toggleTour() { st.tour ? stopTour() : startTour(); }
function startTour(from = 0) { closeOv(); st.target = null; st.tour = {i: from, phase: 'move', t: 0, from: st.pos.clone(), fy: st.yaw, fp: st.pitch}; $('tourBtn').textContent = '■ Stop tour'; }
function stopTour() { if (!st.tour) return; st.tour = null; $('tourBtn').textContent = '▶ Auto-tour'; $('caption').hidden = true; }
$('tourBtn').onclick = toggleTour;
function angLerp(a, b, t) { let d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * t; }
function tickTour(dt) {
  const tr = st.tour, s = tourStops[tr.i]; if (!s) { stopTour(); return; }
  tr.t += dt;
  if (tr.phase === 'move') { const dist = tr.from.distanceTo(s.pos), dur = Math.max(1.2, dist / 5.5), k = Math.min(1, tr.t / dur), e = k * k * (3 - 2 * k);
    // route through the doorway when changing rooms (stay near the center line mid-flight)
    const p = tr.from.clone().lerp(s.pos, e); if (Math.abs(tr.from.z - s.pos.z) > 4) p.x *= Math.min(1, Math.abs(1 - 2 * e) + 0.15);
    st.pos.copy(p); st.yaw = angLerp(tr.fy, s.yaw, Math.min(1, e * 1.3)); st.pitch = tr.fp + (s.pitch - tr.fp) * e;
    if (k >= 1) { tr.phase = 'dwell'; tr.t = 0; $('caption').innerHTML = `<small>${tr.i + 1} / ${tourStops.length}</small><br>` + s.label; $('caption').hidden = false; } }
  else if (tr.t > (+Q.get('dwell') || 3.5)) { tr.i = (tr.i + 1) % tourStops.length; tr.phase = 'move'; tr.t = 0; tr.from = st.pos.clone(); tr.fy = st.yaw; tr.fp = st.pitch; $('caption').hidden = true; }
}
// ---------- loop ----------
function where() { const b = bounds.find(b => st.pos.z <= b.z0 && st.pos.z >= b.z1) || bounds[0]; return b.title; }
let last = performance.now(), lastWhere = '';
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (st.tour) tickTour(dt);
  else {
    const k = st.keys, sp = 4.2 * dt, f = new T.Vector3(-Math.sin(st.yaw), 0, -Math.cos(st.yaw)), rt = new T.Vector3(Math.cos(st.yaw), 0, -Math.sin(st.yaw));
    const mv = new T.Vector3();
    if (k.KeyW || k.ArrowUp) mv.add(f); if (k.KeyS || k.ArrowDown) mv.sub(f); if (k.KeyD) mv.add(rt); if (k.KeyA) mv.sub(rt);
    if (k.ArrowLeft) st.yaw += 1.8 * dt; if (k.ArrowRight) st.yaw -= 1.8 * dt;
    if (mv.lengthSq()) { st.target = null; st.pos.copy(collide(st.pos.clone().addScaledVector(mv.normalize(), sp))); }
    if (st.target) { const d = st.target.clone().sub(st.pos); d.y = 0; const L = d.length(); if (L < 0.25) st.target = null; else { st.yaw = angLerp(st.yaw, Math.atan2(-d.x, -d.z), Math.min(1, dt * 5)); const np = collide(st.pos.clone().addScaledVector(d.normalize(), Math.min(L, sp))); if (np.distanceTo(st.pos) < 1e-4) st.target = null; st.pos.copy(np); } }
  }
  cam.position.copy(st.pos); cam.rotation.set(st.pitch, st.yaw, 0);
  const w = where(); if (w !== lastWhere) { lastWhere = w; $('where').textContent = w; }
  renderer.render(scene, cam); requestAnimationFrame(frame);
}
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 82 : 70; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
// URL params for screenshots / deep links: ?room=Sports&yaw=20  ?p=chopsticks  ?open=chopsticks  ?tour=1  ?help=1
const rq = Q.get('room'); if (rq) { const i = bounds.findIndex(b => b.title.toLowerCase() === rq.toLowerCase()); if (i >= 0) goRoom(i, Q.get('yaw') != null ? +Q.get('yaw') : null); }
if (Q.get('x')) st.pos.x = +Q.get('x'); if (Q.get('dz')) st.pos.z += +Q.get('dz'); if (Q.get('pitch')) st.pitch = +Q.get('pitch');
const pq = Q.get('p'); if (pq) { const s = stops.find(s => s.p.name === pq); if (s) setView(s.pos, s.yaw, s.pitch); }
const oq = Q.get('open'); if (oq) { const p = D.paintings.find(p => p.name === oq); if (p) openOv(p); }
if (Q.get('tour')) startTour(+Q.get('tour') - 1 || 0);
if (Q.get('help')) $('help').hidden = false;
window.__museum = {stops: tourStops.length, paintings: D.paintings.length, bounds, st};
requestAnimationFrame(frame);
})();
