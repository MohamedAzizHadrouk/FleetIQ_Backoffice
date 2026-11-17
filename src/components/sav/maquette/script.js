/* eslint-disable */
// @ts-nocheck
/**
 * Script de la maquette validée SAV-v3.html (FleetAdmin-maquettes v3), généré par scripts/port-maquette.py.
 * Même données, mêmes calculs, mêmes fenêtres que la maquette ; monté par la page React du back-office.
 */
export function mount(__root, opts = {}) {
  const __listeners = [];
  // écouteurs et minuteries actifs seulement tant que la page est affichée, retirés quand on la quitte
  const __on = (type, fn, capture) => {
    const w = (e) => { if (__root.isConnected) fn(e); };
    document.addEventListener(type, w, capture);
    __listeners.push([type, w, capture]);
  };
  const __timers = [];
  const setTimeout = (fn, ms, ...a) => { const id = window.setTimeout(() => { if (__root.isConnected) fn(...a); }, ms); __timers.push(id); return id; };
  const setInterval = (fn, ms, ...a) => { const id = window.setInterval(() => { if (__root.isConnected) fn(...a); }, ms); __timers.push(id); return id; };
  const clearTimeout = (id) => window.clearTimeout(id);
  const clearInterval = (id) => window.clearInterval(id);
  // compte connecté (fa-view = revendeur, fa-role = profil SAV) fourni par le back-office ; rien n'est écrit dans le navigateur
  const localStorage = {
    getItem: (k) => (k === 'fa-view' ? opts.view || '' : k === 'fa-role' ? opts.role || '' : null),
    setItem: () => {},
    removeItem: () => {}
  };
  // liens vers les autres pages de la maquette → navigation du back-office
  const location = {
    get pathname() { return '/SAV-v3.html'; },
    get search() { return opts.search || ''; },
    get hash() { return ''; },
    set href(v) { if (opts.navigate) opts.navigate(v); },
    replace: (v) => { if (opts.navigate) opts.navigate(v); },
    reload: () => {}
  };

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pct = (a, b) => b ? Math.round(a * 100 / b) : 0;
const DAY = 864e5, REAL_TODAY = new Date(); REAL_TODAY.setHours(12, 0, 0, 0);
let TODAY = new Date(REAL_TODAY);
const dPlus = k => new Date(TODAY.getTime() + k * DAY);
const same = (a, b) => a && b && a.toDateString() === b.toDateString();
const fmtD = d => d ? d.toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'2-digit' }) : '—';
const daysBetween = (a, b) => Math.round((b - a) / DAY);

/* ============ Profil connecté (maquette) ============
   '' = Admin TUNAV (vue équipe) · RespSAV = Responsable SAV (vue équipe) · TechSAV = Technicien SAV terrain (ses interventions) */
let ROLE = ''; try { ROLE = localStorage.getItem('fa-role') || ''; } catch (e) {}
const TEAM = ROLE !== 'TechSAV';
$('#who').value = ROLE ? '@' + ROLE : '';
$('#who').onchange = e => { const v = e.target.value;
  try { if (v.charAt(0) === '@') { localStorage.setItem('fa-role', v.slice(1)); localStorage.setItem('fa-view', ''); location.reload(); }
        else { localStorage.removeItem('fa-role'); localStorage.setItem('fa-view', v); location.href = 'Main-v3.html'; } } catch (x) {} };
const RK = ROLE === 'RespSAV' ? 'resp' : ROLE === 'TechSAV' ? 'tech' : 'admin';
$$('#menu a').forEach(a => { if (!a.dataset.r.split(' ').includes(RK)) a.style.display = 'none'; });
if (!TEAM) $('#navSav').textContent = 'Mes interventions';
$('#docLink').href = 'Documentation-SAV-v3.html#' + (TEAM ? 'responsable' : 'technicien');
$('#todayTxt').textContent = TODAY.toLocaleDateString('fr-FR');

/* ============ Données de la maquette ============
   Interventions générées (graine fixe) à partir des alertes d'Équipements : dépannage = équipement installé non connecté,
   contrôle = déconnecté depuis plus de 1 j, installation = vendu non installé, remplacement = boîtier défectueux. */
const TECHS = [
  { id:'T1', nm:'Karim Ben Salah', zone:'Nord',   villes:['Tunis','Ariana','Bizerte','Nabeul','Ben Arous'] },
  { id:'T2', nm:'Amine Trabelsi',  zone:'Centre', villes:['Sousse','Monastir','Mahdia','Kairouan'] },
  { id:'T3', nm:'Sami Gharbi',     zone:'Sud',    villes:['Sfax','Gabès','Médenine','Gafsa'] } ];
const ME = TECHS[2];                                             // le technicien connecté dans la maquette
const TECH = id => TECHS.find(t => t.id === id);
const TYPES = { dep:'Dépannage', ctl:'Contrôle', ins:'Installation', rem:'Remplacement' };
const STS = { todo:'À planifier', plan:'Planifiée', run:'En cours', done:'Terminée', ko:'À revoir' };
const CLIENTS = { Tunis:['Transport Express','Fret International','Distribution Nord'], Ariana:['Express Ariana 2','BTP Ariana'], Bizerte:['Taxi Bizerte 2','Transport Bizerte'],
  Nabeul:['Cargo Nabeul','Express Nabeul'], 'Ben Arous':['Location Ben Arous 3','Citerne Ben Arous'], Sousse:['Agri Sousse 2','Bus Côtier'], Monastir:['Froid Monastir','Navette Monastir 2'],
  Mahdia:['Livraison Mahdia','Fret Mahdia 2'], Kairouan:['Express Kairouan 3','Taxi Kairouan 2'], Sfax:['Transport Sfax','Livraison Sfax','Cargo Sfax'], Gabès:['Froid Gabès 2','BTP Gabès'],
  Médenine:['Agri Médenine','Taxi Médenine'], Gafsa:['Transport Gafsa','Navette Gafsa 3'] };
const REVS = ['Tunav', 'MyCom', 'FleetPro Sfax', 'NavSud'];
const ADDR = ['Zone industrielle', 'Route de Tunis km 4', 'Avenue Habib Bourguiba', 'Route de Gabès km 7', 'Parc logistique', 'Rue de la République', 'Dépôt central'];
const MODELS = ['FMB920', 'FMC130', 'FMB140', 'FMC003'];
const RESULTS = ['Réparé (alimentation)', 'Antenne GPS repositionnée', 'Boîtier remplacé', 'Installé et testé', 'SIM remplacée'];
let seed = 20261104; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rnd() * a.length)];
const pad = (n, k) => String(n).padStart(k, '0');
const SLOTS = ['08:30', '10:00', '11:30', '14:00', '15:30', '17:00'];
const INTS = [];
function make(o){
  const t = TECH(o.tech) || pick(TECHS), ville = o.ville || pick(t.villes), type = o.type || pick(['dep', 'dep', 'dep', 'ctl', 'ins', 'ins', 'rem']);
  const x = { id:'INT-26-' + pad(INTS.length + 101, 4), type, st:o.st, tech:o.tech || null, date:o.date || null, time:o.time || (o.date ? pick(SLOTS) : null),
    created:o.created || dPlus(-(2 + Math.floor(rnd() * 18))), ville, client:pick(CLIENTS[ville]), addr:pick(ADDR) + ', ' + ville, rev:pick(REVS),
    veh:pad(100 + Math.floor(rnd() * 150), 3) + ' TU ' + pad(Math.floor(rnd() * 9999), 4), imei:'86371906' + pad(Math.floor(rnd() * 1e7), 7), model:pick(MODELS),
    ago: type === 'dep' ? 8 + Math.floor(rnd() * 50) : type === 'ctl' ? 2 + Math.floor(rnd() * 5) : null,
    wait: type === 'ins' ? 3 + Math.floor(rnd() * 45) : null, result:null, closed:null, first:true, note:'' };
  if (x.st === 'done') { x.closed = x.date; x.result = type === 'ins' ? 'Installé et testé' : pick(RESULTS); x.first = rnd() > .22; }
  if (x.st === 'ko') { x.result = 'Client absent'; x.first = false; }
  x.prio = (x.ago && x.ago > 30) || (x.wait && x.wait > 30) ? 'haute' : 'normale';
  x.typeAuto = type; x.origin = type === 'rem' ? 'manuel' : 'auto';
  INTS.push(x); return x;
}
// historique (30 derniers jours) et planning de l'équipe
for (let i = 0; i < 46; i++) { const t = pick(TECHS), d = dPlus(-(1 + Math.floor(rnd() * 29))); make({ tech:t.id, st:'done', date:d, created:new Date(d.getTime() - (1 + Math.floor(rnd() * 6)) * DAY) }); }
for (let i = 0; i < 4; i++) make({ tech:pick(TECHS).id, st:'ko', date:dPlus(-(1 + Math.floor(rnd() * 5))) });
for (const t of TECHS.slice(0, 2)) { for (let i = 0; i < 4; i++) make({ tech:t.id, st: i === 0 ? 'run' : 'plan', date:TODAY, time:SLOTS[i] }); make({ tech:t.id, st:'plan', date:dPlus(-1 - Math.floor(rnd() * 2)) }); }
for (let i = 0; i < 16; i++) make({ tech:pick(TECHS).id, st:'plan', date:dPlus(1 + Math.floor(rnd() * 6)) });
for (let i = 0; i < 14; i++) make({ st:'todo' });
// le technicien connecté (Sami Gharbi, zone Sud) : sa tournée du jour, une intervention en retard
[['done','08:30','ctl','Sfax'], ['run','10:00','dep','Sfax'], ['plan','11:30','ins','Sfax'], ['plan','14:00','dep','Gabès'], ['plan','15:30','rem','Gabès']]
  .forEach(([st, time, type, ville], i) => make({ tech:ME.id, st, date:TODAY, time, type, ville, created: i >= 3 ? dPlus(-1) : undefined }));
make({ tech:ME.id, st:'plan', date:dPlus(-1), time:'15:30', type:'dep', ville:'Médenine' });
for (const v of ['Gafsa', 'Sfax', 'Médenine']) make({ st:'todo', ville:v, type:'dep' });

// décisions prises dans la maquette (planifier, démarrer, clôturer) gardées sur ce poste
const KEY = 'fa-sav-state';
try { const S = JSON.parse(localStorage.getItem(KEY) || '{}'); INTS.forEach(x => { const s = S[x.id]; if (s) Object.assign(x, s, { date:s.date ? new Date(s.date) : x.date, closed:s.closed ? new Date(s.closed) : x.closed }); }); } catch (e) {}
function persist(x, ch){ Object.assign(x, ch); ['date', 'closed'].forEach(k => { if (typeof x[k] === 'string') x[k] = new Date(x[k]); }); try { const S = JSON.parse(localStorage.getItem(KEY) || '{}'); S[x.id] = Object.assign(S[x.id] || {}, ch); localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} render(); }

const isLate = x => x.st === 'plan' && x.date && x.date < TODAY && !same(x.date, TODAY);
const stHtml = x => isLate(x) ? '<span class="st late"><i></i>En retard</span>' : '<span class="st ' + x.st + '"><i></i>' + STS[x.st] + '</span>';
const tyHtml = x => '<span class="ty ' + x.type + '">' + TYPES[x.type] + '</span>';
const why = x => (x = Object.assign({}, x, { type:x.typeAuto || x.type }), x.type === 'dep' ? 'Aucune donnée depuis ' + x.ago + ' j' : x.type === 'ctl' ? 'Déconnecté depuis ' + x.ago + ' j (alerte > 1 j)' : x.type === 'ins' ? 'Vendu, en attente de pose depuis ' + x.wait + ' j' : 'Boîtier défectueux à remplacer');
const ALERT = { dep:'Équipements : installé non connecté (aucune donnée depuis plus de 7 j)', ctl:'Équipements : déconnecté depuis plus de 1 j', ins:'Équipements : vendu non installé' };
const originTxt = x => (x.origin === 'auto' ? 'Alerte automatique · ' + ALERT[x.typeAuto] : 'Créée par le responsable SAV')
  + (x.type !== x.typeAuto ? ' · type modifié par le responsable SAV (proposé : ' + TYPES[x.typeAuto] + ')' : '');
const originTag = x => x.type !== x.typeAuto ? 'modifié' : x.origin === 'auto' ? 'auto' : 'manuel';
const open = () => INTS.filter(x => ['todo', 'plan', 'run', 'ko'].includes(x.st));
const done30 = L => L.filter(x => x.st === 'done' && x.closed && daysBetween(x.closed, TODAY) <= 30);

/* ============ Fenêtre de détail ============ */
function modal(title, body, foot){
  $('#md').innerHTML = '<div class="ov" id="ov"><div class="md" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="md-h"><h3>' + title + '</h3><button data-x aria-label="Fermer">×</button></div>'
    + '<div class="md-b">' + body + '</div><div class="md-f"><button class="btn ghost" data-x>Fermer</button><span style="display:flex;gap:8px;flex-wrap:wrap">' + (foot || '') + '</span></div></div></div>';
  $('#ov').onclick = e => { if (e.target.id === 'ov' || e.target.closest('[data-x]')) $('#md').innerHTML = ''; };
}
__on('keydown', e => { if (e.key === 'Escape') $('#md').innerHTML = ''; });
function openInt(x){
  const t = TECH(x.tech), me = !TEAM;
  const kv = [['Type', tyHtml(x)], ['Origine', originTxt(x)], ['Statut', stHtml(x)], ['Problème', why(x)], ['Client', esc(x.client) + (me ? '' : ' · ' + esc(x.rev))], ['Adresse', esc(x.addr)],
    ['Véhicule', esc(x.veh)], ['Équipement', esc(x.model) + ' · IMEI ' + x.imei], ['Rendez-vous', x.date ? fmtD(x.date) + (x.time ? ' · ' + x.time : '') : 'à planifier'],
    ...(me ? [] : [['Technicien', t ? esc(t.nm) + ' · zone ' + t.zone : '—'], ['Signalée le', x.created.toLocaleDateString('fr-FR')]]),
    ...(x.result ? [['Résultat', esc(x.result) + (x.first ? ' · résolu à la 1re visite' : '')]] : [])].map(([k, v]) => '<span>' + k + '</span><div>' + v + '</div>').join('');
  const CHECK = x.type === 'ins' ? ['Boîtier fixé et alimenté (+12/24 V, masse)', 'Antenne GPS dégagée', 'SIM insérée', 'Premier envoi reçu sur la plateforme', 'Photo de la pose']
    : ['Alimentation et fusible vérifiés', 'Antenne GPS et GSM vérifiées', 'SIM présente et active', 'Test d’envoi : position reçue', 'Photo après intervention'];
  let body = '<div class="kv">' + kv + '</div>';
  let foot = '';
  if (me && ['plan', 'run'].includes(x.st)) {
    body += '<h4 style="margin:6px 0 0;font-size:14px">Contrôles sur place</h4><ul class="chk">' + CHECK.map((c, i) => '<li><label><input type="checkbox" data-ck="' + i + '">' + c + '</label></li>').join('') + '</ul>'
      + '<label style="font-size:13px;color:#475569">Résultat <select id="iRes" style="font:inherit;font-size:13px;margin-left:6px;border:1px solid #CBD5E1;border-radius:8px;padding:5px 8px">' + RESULTS.concat(['Client absent', 'À revoir (pièce manquante)']).map(r => '<option>' + r + '</option>').join('') + '</select></label>'
      + '<p id="iErr" style="color:#B91C1C;font-size:13px;margin:0" hidden>Cochez « Test d’envoi : position reçue » avant de clôturer (sauf client absent ou à revoir).</p>';
    foot = (x.st === 'plan' ? '<button class="btn2 ghost" id="iStart">Démarrer</button>' : '') + '<button class="btn2" id="iClose">Clôturer l’intervention</button>';
  }
  if (TEAM && x.st !== 'done') {
    body += '<h4 style="margin:6px 0 0;font-size:14px">Type d’intervention</h4><p style="margin:0;font-size:12.5px;color:#475569">Proposé par le système à partir de l’alerte ; à corriger si le diagnostic est différent (ex. boîtier hors service : Remplacement).</p>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><select id="iType" aria-label="Type d’intervention" style="font:inherit;font-size:13px;border:1px solid #CBD5E1;border-radius:8px;padding:5px 8px">' + Object.entries(TYPES).map(([k, v]) => '<option value="' + k + '"' + (k === x.type ? ' selected' : '') + '>' + v + (k === x.typeAuto && x.origin === 'auto' ? ' (proposé)' : '') + '</option>').join('') + '</select>'
      + '<button class="btn2 ghost" id="iTypeOk">Enregistrer le type</button><span id="iTypeMsg" style="font-size:12.5px;color:#047857"></span></div>';
  }
  if (TEAM && ['todo', 'ko'].includes(x.st) || TEAM && isLate(x)) {
    body += '<h4 style="margin:6px 0 0;font-size:14px">Planifier</h4><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' + techSel(x, 'iTech') + '<input type="date" id="iDate" value="' + dPlus(1).toISOString().slice(0, 10) + '" style="font:inherit;font-size:13px;border:1px solid #CBD5E1;border-radius:8px;padding:5px 8px"></div>';
    foot = '<button class="btn2" id="iPlan">Planifier</button>';
  }
  if (TEAM) foot = '<a class="btn2 ghost" href="Equipements-v3.html">Ouvrir Équipements</a>' + foot;
  modal(x.id + ' · ' + TYPES[x.type], body, foot);
  if ($('#iStart')) $('#iStart').onclick = () => { persist(x, { st:'run' }); openInt(x); };
  if ($('#iClose')) $('#iClose').onclick = () => { const r = $('#iRes').value, okTest = $('[data-ck="3"]').checked;
    if (!okTest && !/absent|revoir/i.test(r)) { $('#iErr').hidden = false; return; }
    persist(x, /absent|revoir/i.test(r) ? { st:'ko', result:r, first:false } : { st:'done', result:r, closed:TODAY.toISOString() }); $('#md').innerHTML = ''; };
  if ($('#iTypeOk')) $('#iTypeOk').onclick = () => { const v = $('#iType').value; if (v === x.type) { $('#iTypeMsg').textContent = 'Aucun changement.'; return; } persist(x, { type:v }); openInt(x); $('#iTypeMsg').textContent = 'Type enregistré.'; };
  if ($('#iPlan')) $('#iPlan').onclick = () => { persist(x, { st:'plan', tech:$('#iTech').value, date:$('#iDate').value + 'T12:00:00', time:'09:00' }); $('#md').innerHTML = ''; };
}
const techSel = (x, id) => { const sug = (TECHS.find(t => t.villes.includes(x.ville)) || TECHS[0]).id;
  return '<select id="' + id + '" aria-label="Technicien">' + TECHS.map(t => '<option value="' + t.id + '"' + (t.id === (x.tech || sug) ? ' selected' : '') + '>' + esc(t.nm) + ' · ' + t.zone + '</option>').join('') + '</select>'; };

/* ============ Cartes (même modèle que L'essentiel) ============ */
const kcard = (i, l, v, small, ctx, cls) => '<button class="card kc" data-k="' + i + '"><span class="lbl">' + l + '</span><span class="v"' + (cls ? ' style="color:' + cls + '"' : '') + '>' + v + (small ? '<small>' + small + '</small>' : '') + '</span><span class="ctx">' + ctx + '</span></button>';
const list = (L, empty) => L.length ? L.map(x => '<button class="trow ' + (x.st === 'done' ? 'done' : '') + '" data-int="' + x.id + '"><span class="h">' + (x.time || '—') + '<small>' + (x.date && !same(x.date, TODAY) ? fmtD(x.date) : 'aujourd’hui') + '</small></span>'
  + '<span class="t"><b>' + esc(x.client) + '</b> · ' + esc(x.ville) + '<small>' + why(x) + ' · ' + esc(x.model) + ' · ' + esc(x.veh) + '</small><small>' + esc(x.addr) + '</small></span>'
  + '<span class="r">' + tyHtml(x) + stHtml(x) + '</span></button>').join('') : '<p style="padding:14px 16px;margin:0;color:#475569;font-size:13px">' + empty + '</p>';
const bindRows = () => $$('[data-int]').forEach(b => b.onclick = () => openInt(INTS.find(x => x.id === b.dataset.int)));
const byTime = (a, b) => (a.date - b.date) || String(a.time).localeCompare(String(b.time));

/* ============ Vue Technicien SAV terrain ============ */
function renderTech(){
  $('#pTitle').textContent = 'Mes interventions';
  $('#pSub').textContent = ME.nm + ' · Technicien SAV · zone ' + ME.zone + ' (' + ME.villes.join(', ') + ') : vos interventions, sans les autres zones ni les données commerciales.';
  const mine = INTS.filter(x => x.tech === ME.id), today = mine.filter(x => same(x.date, TODAY)).sort(byTime), late = mine.filter(isLate).sort(byTime);
  const next = mine.filter(x => x.st === 'plan' && x.date > TODAY && !same(x.date, TODAY)).sort(byTime), week = mine.filter(x => x.st === 'done' && daysBetween(x.closed, TODAY) <= 7);
  const zone = INTS.filter(x => x.st === 'todo' && ME.villes.includes(x.ville));
  const left = today.filter(x => x.st !== 'done' && x.st !== 'ko').length;
  $('#view').innerHTML = '<section><div class="kg" style="--n:4">'
    + kcard(0, 'Aujourd’hui', today.length, 'interventions', left + ' restante(s) · ' + today.filter(x => x.st === 'done').length + ' terminée(s)')
    + kcard(1, 'En retard', late.length, 'à faire', late.length ? 'date dépassée, à faire en priorité' : 'aucune', late.length ? '#B91C1C' : '')
    + kcard(2, 'Terminées · 7 j', week.length, 'interventions', pct(week.filter(x => x.first).length, week.length) + ' % résolues à la 1re visite')
    + kcard(3, 'À vérifier dans ma zone', zone.length, 'équipements', 'pas encore planifiés par le responsable') + '</div></section>'
    + (late.length ? '<section><div class="sh"><h2 style="color:#B91C1C">En retard</h2><span>à faire en premier</span></div><div class="card">' + list(late) + '</div></section>' : '')
    + '<section><div class="sh"><h2>Ma tournée du jour</h2><span>dans l’ordre des rendez-vous · cliquez pour ouvrir la fiche, cocher les contrôles et clôturer</span></div><div class="card">' + list(today, 'Aucune intervention aujourd’hui.') + '</div></section>'
    + '<section><div class="sh"><h2>Prochains jours</h2><span>déjà planifiées</span></div><div class="card">' + list(next, 'Rien de planifié pour les prochains jours.') + '</div></section>'
    + '<section><div class="sh"><h2>À vérifier dans ma zone</h2><span>équipements signalés, pas encore planifiés · le responsable SAV les planifie</span></div><div class="card">' + list(zone, 'Rien à signaler dans votre zone.') + '</div></section>';
  bindRows();
  const go = [today, late, week, zone];
  $$('[data-k]').forEach(b => b.onclick = () => { const L = go[+b.dataset.k];
    modal(b.querySelector('.lbl').textContent, '<div class="card" style="border:0">' + list(L, 'Rien à afficher.') + '</div>'); bindRows(); });
}

/* ============ Vue Responsable SAV (et Admin TUNAV) : toute l'équipe ============ */
const F = { tech:'', st:'', type:'', q:'', page:0 };
function renderTeam(){
  $('#pTitle').textContent = 'Interventions SAV';
  $('#pSub').textContent = (ROLE === 'RespSAV' ? 'Responsable SAV' : 'Admin TUNAV') + ' · toute l’équipe SAV (' + TECHS.length + ' techniciens) : planifier, suivre et mesurer les interventions. Aucun prix.';
  const O = open(), todo = INTS.filter(x => x.st === 'todo'), late = INTS.filter(isLate), d30 = done30(INTS);
  const delay = d30.length ? Math.round(d30.reduce((s, x) => s + daysBetween(x.created, x.closed), 0) / d30.length * 10) / 10 : 0;
  const first = pct(d30.filter(x => x.first).length, d30.length);
  $('#view').innerHTML = '<section><div class="kg" style="--n:5">'
    + kcard(0, 'Interventions ouvertes', O.length, '', todo.length + ' à planifier · ' + INTS.filter(x => x.st === 'run').length + ' en cours')
    + kcard(1, 'À planifier', todo.length, 'sans technicien', 'à affecter à un technicien', todo.length ? '#B45309' : '')
    + kcard(2, 'En retard', late.length, '', 'date de rendez-vous dépassée', late.length ? '#B91C1C' : '')
    + kcard(3, 'Résolues à la 1re visite', first + '&nbsp;%', '', d30.length + ' terminées sur 30 j · objectif 85 %', first >= 85 ? '#047857' : '#B45309')
    + kcard(4, 'Délai moyen', String(delay).replace('.', ','), 'jours', 'du signalement à la clôture (30 j)') + '</div>'
    + '<div class="card info" style="margin-top:12px"><span style="font-weight:600">Alertes Équipements à traiter :</span><span><b>126</b> installés non connectés</span><span><b>252</b> déconnectés depuis plus de 1 j</span><span><b>52</b> installations en attente depuis plus de 30 j</span><a href="Equipements-v3.html" style="margin-left:auto;font-weight:600;font-size:13px">Ouvrir Équipements →</a></div></section>'
    + '<section><div class="sh"><h2>Charge par technicien</h2><span>aujourd’hui, ouvertes, en retard · cliquez pour sa liste</span></div><div class="card gc">' + TECHS.map(t => {
        const mine = INTS.filter(x => x.tech === t.id), op = mine.filter(x => ['plan', 'run'].includes(x.st)), lt = mine.filter(isLate), td = mine.filter(x => same(x.date, TODAY)), max = 14;
        return '<button class="ld" data-tech="' + t.id + '"><span class="nm">' + esc(t.nm) + '<small>zone ' + t.zone + '</small></span><span class="bar" style="height:18px">'
          + (op.length - lt.length ? '<i style="flex:' + (op.length - lt.length) + ';background:#2563EB" title="Ouvertes à l’heure">' + (op.length - lt.length) + '</i>' : '') + (lt.length ? '<i style="flex:' + lt.length + ';background:#DC2626" title="En retard">' + lt.length + '</i>' : '')
          + '<i style="flex:' + Math.max(max - op.length, 0) + ';background:#EEF2F7"></i></span><span class="n">' + td.length + ' aujourd’hui · ' + op.length + ' ouvertes · ' + done30(mine).length + ' terminées (30 j)</span></button>'; }).join('')
    + '<div class="leg"><span><span class="key" style="background:#2563EB"></span>Planifiées / en cours</span><span><span class="key" style="background:#DC2626"></span>En retard</span></div></div></section>'
    + '<section><div class="sh"><h2>À planifier</h2><span>' + todo.length + ' signalement(s) sans technicien · le technicien de la zone est proposé</span></div><div class="card wrap"><table class="tbl"><thead><tr><th>Signalement</th><th>Client · ville</th><th>Problème</th><th>Technicien</th><th>Date</th><th></th></tr></thead><tbody>'
    + todo.sort((a, b) => (b.prio === 'haute') - (a.prio === 'haute') || a.created - b.created).map(x => '<tr><td><b>' + x.id + '</b><small>' + tyHtml(x) + ' ' + originTag(x) + (x.prio === 'haute' ? ' <span class="badge bad">priorité haute</span>' : '') + '</small></td><td>' + esc(x.client) + '<small>' + esc(x.ville) + ' · ' + esc(x.rev) + '</small></td><td>' + why(x) + '<small>' + esc(x.model) + ' · ' + esc(x.veh) + '</small></td>'
      + '<td>' + techSel(x, 'ts-' + x.id) + '</td><td><input type="date" id="td-' + x.id + '" value="' + dPlus(1).toISOString().slice(0, 10) + '"></td><td><button class="btn2" data-plan="' + x.id + '">Planifier</button></td></tr>').join('')
    + (todo.length ? '' : '<tr><td colspan="6" style="color:#475569">Tout est planifié.</td></tr>') + '</tbody></table></div></section>'
    + '<section><div class="sh"><h2>Toutes les interventions</h2><span id="allCnt"></span></div><div class="card"><div class="flt">'
    + '<input type="search" id="fQ" placeholder="Client, ville, IMEI, n° d’intervention" aria-label="Rechercher">'
    + '<select id="fTech" aria-label="Technicien"><option value="">Tous les techniciens</option>' + TECHS.map(t => '<option value="' + t.id + '">' + esc(t.nm) + '</option>').join('') + '<option value="-">Sans technicien</option></select>'
    + '<select id="fSt" aria-label="Statut"><option value="">Tous les statuts</option><option value="late">En retard</option>' + Object.entries(STS).map(([k, v]) => '<option value="' + k + '">' + v + '</option>').join('') + '</select>'
    + '<select id="fTy" aria-label="Type"><option value="">Tous les types</option>' + Object.entries(TYPES).map(([k, v]) => '<option value="' + k + '">' + v + '</option>').join('') + '</select>'
    + '</div><div class="wrap"><table class="tbl"><thead><tr><th>N°</th><th>Type</th><th>Client · ville</th><th>Technicien</th><th>Rendez-vous</th><th>Statut</th><th>Résultat</th></tr></thead><tbody id="allRows"></tbody></table></div><div class="pg" id="allPg"></div></div></section>';
  $('#fTech').value = F.tech; $('#fSt').value = F.st; $('#fTy').value = F.type; $('#fQ').value = F.q;
  [['fTech', 'tech'], ['fSt', 'st'], ['fTy', 'type']].forEach(([id, k]) => $('#' + id).onchange = e => { F[k] = e.target.value; F.page = 0; drawAll(); });
  $('#fQ').oninput = e => { F.q = e.target.value; F.page = 0; drawAll(); };
  $$('[data-plan]').forEach(b => b.onclick = () => { const x = INTS.find(i => i.id === b.dataset.plan); persist(x, { st:'plan', tech:$('#ts-' + x.id).value, date:$('#td-' + x.id).value + 'T12:00:00', time:'09:00' }); });
  $$('[data-tech]').forEach(b => b.onclick = () => { F.tech = b.dataset.tech; F.st = ''; F.page = 0; $('#fTech').value = F.tech; $('#fSt').value = ''; drawAll(); $('#allRows').closest('section').scrollIntoView({ behavior:'smooth' }); });
  const go = [() => { F.st = ''; }, () => { F.st = 'todo'; }, () => { F.st = 'late'; }, () => { F.st = 'done'; }, () => { F.st = 'done'; }];
  $$('[data-k]').forEach(b => b.onclick = () => { go[+b.dataset.k](); F.tech = ''; F.page = 0; $('#fSt').value = F.st; $('#fTech').value = ''; drawAll(); $('#allRows').closest('section').scrollIntoView({ behavior:'smooth' }); });
  drawAll();
}
function drawAll(){
  const q = F.q.trim().toLowerCase(), PS = 15;
  const L = INTS.filter(x => (!F.tech || (F.tech === '-' ? !x.tech : x.tech === F.tech)) && (!F.st || (F.st === 'late' ? isLate(x) : x.st === F.st && !isLate(x)))
      && (!F.type || x.type === F.type) && (!q || [x.id, x.client, x.ville, x.imei].join(' ').toLowerCase().includes(q)))
    .sort((a, b) => (isLate(b) - isLate(a)) || ((a.date || dPlus(99)) - (b.date || dPlus(99))));
  const pages = Math.max(1, Math.ceil(L.length / PS)); F.page = Math.min(F.page, pages - 1);
  $('#allCnt').textContent = L.length + ' intervention(s) · cliquez sur une ligne pour la fiche';
  $('#allRows').innerHTML = L.slice(F.page * PS, F.page * PS + PS).map(x => '<tr class="click" data-int="' + x.id + '"><td><b>' + x.id + '</b></td><td>' + tyHtml(x) + '<small>' + originTag(x) + '</small></td><td>' + esc(x.client) + '<small>' + esc(x.ville) + '</small></td><td>' + (x.tech ? esc(TECH(x.tech).nm) : '<span style="color:#B45309">à affecter</span>') + '</td>'
    + '<td>' + (x.date ? fmtD(x.date) + (x.time ? ' · ' + x.time : '') : '—') + '</td><td>' + stHtml(x) + '</td><td>' + (x.result ? esc(x.result) : '—') + '</td></tr>').join('') || '<tr><td colspan="7" style="color:#475569">Aucune intervention.</td></tr>';
  $('#allPg').innerHTML = '<span>Page ' + (F.page + 1) + ' / ' + pages + '</span><span><button id="pPrev"' + (F.page ? '' : ' disabled') + '>Précédent</button> <button id="pNext"' + (F.page < pages - 1 ? '' : ' disabled') + '>Suivant</button></span>';
  $('#pPrev').onclick = () => { F.page--; drawAll(); }; $('#pNext').onclick = () => { F.page++; drawAll(); };
  bindRows();
}

/* ============ Notifications (cloche) : propres à chaque profil ============ */
const PR = { 1:['#DC2626', 'Urgent'], 2:['#D97706', 'Aujourd’hui'], 3:['#64748B', 'À suivre'] };
function notifs(){
  const N = [], add = (p, t, d, go) => N.push({ p, t, d, go });
  if (!TEAM) {
    const mine = INTS.filter(x => x.tech === ME.id);
    mine.filter(isLate).forEach(x => add(1, 'En retard : ' + x.client + ' · ' + x.ville, TYPES[x.type] + ' prévue ' + fmtD(x.date) + (x.time ? ' à ' + x.time : '') + ' · ' + why(x), () => openInt(x)));
    mine.filter(x => x.st === 'ko').forEach(x => add(1, 'À revoir : ' + x.client, x.result + ' · le responsable va replanifier', () => openInt(x)));
    mine.filter(x => x.st === 'plan' && daysBetween(x.created, TODAY) <= 1 && !isLate(x)).forEach(x => add(2, 'Nouvelle intervention : ' + x.client + ' · ' + x.ville, TYPES[x.type] + ' · ' + fmtD(x.date) + (x.time ? ' à ' + x.time : '') + ' · affectée par le responsable SAV', () => openInt(x)));
    const nx = mine.filter(x => same(x.date, TODAY) && ['plan', 'run'].includes(x.st)).sort(byTime)[0];
    if (nx) add(2, 'Prochain rendez-vous : ' + nx.time + ' · ' + nx.client, why(nx) + ' · ' + nx.addr, () => openInt(nx));
    const zone = INTS.filter(x => x.st === 'todo' && ME.villes.includes(x.ville));
    if (zone.length) add(3, zone.length + ' équipement(s) signalé(s) dans ma zone', 'pas encore planifiés · le responsable SAV les planifie', () => document.querySelector('#view section:last-child').scrollIntoView({ behavior:'smooth' }));
  } else {
    const filt = (st, tech) => () => { F.st = st; F.tech = tech || ''; F.page = 0; renderTeam(); $('#allRows').closest('section').scrollIntoView({ behavior:'smooth' }); };
    INTS.filter(isLate).sort(byTime).forEach(x => add(1, 'En retard : ' + x.client + ' · ' + x.ville, TECH(x.tech).nm + ' · prévue ' + fmtD(x.date) + ' · ' + TYPES[x.type], () => openInt(x)));
    INTS.filter(x => x.st === 'ko').forEach(x => add(1, 'À revoir : ' + x.client + ' · ' + x.ville, TECH(x.tech).nm + ' · ' + x.result + ' · à replanifier', () => openInt(x)));
    const hi = INTS.filter(x => x.st === 'todo' && x.prio === 'haute');
    if (hi.length) add(1, hi.length + ' signalement(s) priorité haute à planifier', 'équipement muet ou installation en attente depuis plus de 30 j', filt('todo'));
    const todo = INTS.filter(x => x.st === 'todo');
    if (todo.length) add(2, todo.length + ' signalement(s) à planifier', 'sans technicien ni date', () => document.querySelector('[data-plan]')?.closest('section').scrollIntoView({ behavior:'smooth' }));
    const load = TECHS.map(t => [t, INTS.filter(x => x.tech === t.id && same(x.date, TODAY) && ['plan', 'run'].includes(x.st)).length + INTS.filter(x => x.tech === t.id && isLate(x)).length]).sort((m, q) => q[1] - m[1])[0];
    if (load[1] >= 5) add(2, 'Charge la plus élevée : ' + load[0].nm, load[1] + ' interventions à faire aujourd’hui, retards compris · zone ' + load[0].zone, filt('', load[0].id));
    add(2, 'Alertes Équipements : 252 déconnectés depuis plus de 1 j', 'dont 126 installés non connectés · à transformer en interventions', () => { location.href = 'Equipements-v3.html'; });
    const closed = INTS.filter(x => x.st === 'done' && same(x.closed, TODAY));
    if (closed.length) add(3, closed.length + ' intervention(s) clôturée(s) aujourd’hui', closed.map(x => TECH(x.tech).nm.split(' ')[0] + ' · ' + x.client).slice(0, 3).join(' · '), filt('done'));
  }
  return N;
}
function renderBell(){
  const N = notifs(), urg = N.filter(n => n.p === 1).length;
  $('#bellCnt').textContent = N.length > 99 ? '99+' : N.length; $('#bellCnt').hidden = !N.length;
  $('#bpanel').innerHTML = '<div class="bh"><b>Notifications</b><span>' + urg + ' urgente(s) · ' + N.length + ' au total</span></div><ul>'
    + [1, 2, 3].map(p => { const L = N.map((n, i) => [n, i]).filter(([n]) => n.p === p); return L.length ? '<li class="bg" style="color:' + PR[p][0] + '">' + PR[p][1] + '</li>'
      + L.map(([n, i]) => '<li data-bn="' + i + '"><i style="background:' + PR[p][0] + '"></i><span>' + esc(n.t) + '<small>' + esc(n.d) + '</small></span><b></b></li>').join('') : ''; }).join('')
    + (N.length ? '' : '<li class="bg" style="color:#475569">Aucune notification.</li>') + '</ul>';
  $$('#bpanel [data-bn]').forEach(li => li.onclick = () => { $('#bpanel').classList.add('hidden'); N[+li.dataset.bn].go(); });
}
$('#bell').onclick = e => { e.stopPropagation(); $('#bpanel').classList.toggle('hidden'); };
__on('click', e => { if (!e.target.closest('#bpanel, #bell')) $('#bpanel').classList.add('hidden'); });

/* ============ En-tête : État au, Excel, PDF ============ */
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
$('#pAu').value = iso(REAL_TODAY); $('#pAu').max = iso(dPlus(14));
function setDate(v){ TODAY = new Date((v || iso(REAL_TODAY)) + 'T12:00:00'); $('#pAu').value = iso(TODAY); render(); }
$('#pAu').onchange = e => setDate(e.target.value);
$('#pAuToday').onclick = () => setDate('');
$('#bXls').onclick = () => {
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', L = [['N°','Type','Origine','Statut','Client','Ville','Adresse','Véhicule','Modèle','IMEI','Technicien','Rendez-vous','Heure','Problème','Résultat']];
  INTS.filter(x => TEAM || x.tech === ME.id).forEach(x => L.push([x.id, TYPES[x.type], originTxt(x), isLate(x) ? 'En retard' : STS[x.st], x.client, x.ville, x.addr, x.veh, x.model, x.imei, x.tech ? TECH(x.tech).nm : '', x.date ? x.date.toLocaleDateString('fr-FR') : '', x.time || '', why(x), x.result || '']));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + L.map(r => r.map(q).join(';')).join(String.fromCharCode(13, 10))], { type:'text/csv;charset=utf-8' }));
  a.download = (TEAM ? 'interventions-sav-' : 'mes-interventions-') + $('#pAu').value + '.csv'; a.click(); URL.revokeObjectURL(a.href);
};
$('#bPdf').onclick = () => window.print();

function render(){
  TEAM ? renderTeam() : renderTech(); renderBell();
  const real = same(TODAY, REAL_TODAY);
  $('#pVs').innerHTML = 'État au <b>' + TODAY.toLocaleDateString('fr-FR') + '</b>' + (real ? ' (aujourd’hui)' : '') + ' · tournée du jour, retards et notifications calculés à cette date';
}
render();

  if (typeof opts.after === 'function') opts.after({ setView: typeof setView === 'function' ? setView : null });
  return () => {
    __listeners.forEach(([t, f, c]) => document.removeEventListener(t, f, c));
    __timers.forEach((id) => { window.clearTimeout(id); window.clearInterval(id); });
  };
}
