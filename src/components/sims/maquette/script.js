/* eslint-disable */
// @ts-nocheck
/**
 * Script de la maquette validée Puces-v3.html (FleetAdmin-maquettes v3), généré par scripts/port-maquette.py.
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
    get pathname() { return '/Puces-v3.html'; },
    get search() { return opts.search || ''; },
    get hash() { return ''; },
    set href(v) { if (opts.navigate) opts.navigate(v); },
    replace: (v) => { if (opts.navigate) opts.navigate(v); },
    reload: () => {}
  };

/* ======================= Données (fictives) ======================= */
// Offres : nom, opérateur, type, forfait mensuel (Mo) et prix fixe par puce et par mois (TND)
const OFFERS = [
  {id:'o1', name:'Data 1 Go',       op:'Orange',  type:'Data',       quota:1024,  price:12},
  {id:'o2', name:'Data 5 Go + SMS', op:'Télécom', type:'Data + SMS', quota:5120,  price:25},
  {id:'o3', name:'M2M Premium',     op:'Ooredoo', type:'M2M',        quota:10240, price:40},
];
// Réseau : Tunav (clients directs, 150 puces dont le stock) + 3 revendeurs de 100 puces chacun
const NETWORK = [
  {reseller:'Tunav', total:150, clients:[['Transport Express',14],['Transport Urbain Tunis',18],['Société Médicale ABC',9],['Fret International',12],['Distribution Nord',8],['BTP Carthage',15],['Agri Transport Béja',10],['Cimenterie du Nord',13],['Pharma Distribution',11],['Sotra Bâtiment',15],['Stock Tunav',25]]},
  {reseller:'MyCom', total:100, clients:[['MyCom',22],['Livraison Rapide',16],['Logistique Sud',20],['Transport Sahel',18],['Bus Côtier',24]]},
  {reseller:'FleetPro Sfax', total:100, clients:[['Taxi Sfax',30],['Frigo Express',18],['Location Auto Plus',22],['Sfax Logistique',16],['Huilerie Sahel',14]]},
  {reseller:'NavSud', total:100, clients:[['Gabès Transport',24],['Djerba Tours',20],['Sud Carburants',18],['Médenine BTP',16],['Oasis Express',22]]},
];
// 8 puces « histoire » (exemples suivis dans la maquette depuis la v2), le reste est généré
const SIMS = [
  {id:1, num:'+216 71 12 34 56', iccid:'89330123456789012345', offer:'o2', client:'Transport Express', reseller:'Tunav', equip:'EQ-2024-001', eqType:'ETX', installed:true,
   act:'2024-01-05', exp:'2026-12-15', d30:4710, last:'today', m:[3100,3400,2900,1200,2800,3500,4100,5400,4600,4700,310,0],
   events:[['2026-09-30','Rappel envoyé au client : 92 % du forfait','Rappel','amber'],['2026-09-22','80 % du forfait atteint (4,0 Go / 5 Go)','Alerte','amber'],['2026-09-01','Nouveau cycle de forfait','Cycle','gray'],['2026-08-31','Dépassement : 5,4 Go / 5 Go · Finance prévenue','Dépassement','red'],['2024-01-15','Affectée à EQ-2024-001 (ETX)','Affectation','gray'],['2024-01-05','Activation chez Télécom','Activation','gray']]},
  {id:2, num:'+216 71 33 44 55', iccid:'89330111122223333444', offer:'o2', client:'Transport Urbain Tunis', reseller:'Tunav', equip:'EQ-2025-031', eqType:'ETX', installed:true,
   act:'2025-06-28', exp:'2027-06-30', d30:3650, last:'today', m:[1800,2100,2400,2200,2600,2900,3100,2700,3300,3600,240,0],
   events:[['2025-07-01','Affectée à EQ-2025-031 (ETX)','Affectation','gray'],['2025-06-28','Activation chez Télécom','Activation','gray']]},
  {id:3, num:'+216 22 98 76 54', iccid:'89330987600000000008', offer:'o1', client:'MyCom', reseller:'MyCom', equip:'EQ-2024-014', eqType:'ETX', installed:true,
   act:'2024-09-02', exp:'2026-12-10', d30:0, last:'2026-04-15', m:[600,550,480,120,0,0,0,0,0,0,0,0],
   events:[['2026-04-22','Puce muette depuis 7 jours','Alerte','red'],['2026-04-15','Dernière consommation','Conso','gray'],['2024-09-05','Affectée à EQ-2024-014 (ETX)','Affectation','gray'],['2024-09-02','Activation chez Orange','Activation','gray']]},
  {id:4, num:'+216 71 65 43 21', iccid:'89330987654321098765', offer:'o1', client:'MyCom', reseller:'MyCom', equip:'EQ-2024-002', eqType:'ET6', installed:false, detail:'aff',
   act:'2024-09-02', exp:'2026-11-20', d30:0, last:null, m:[0,0,0,0,0,0,0,0,0,0,0,0],
   events:[['2026-09-08','Puce muette depuis 7 jours','Alerte','red'],['2024-09-02','Affectée à EQ-2024-002 (non installé)','Affectation','gray'],['2024-09-02','Activation chez Orange','Activation','gray']]},
  {id:5, num:'+216 71 11 22 33', iccid:'89216001100110011001', offer:'o3', client:'Société Médicale ABC', reseller:'Tunav', equip:null, eqType:null, installed:false, detail:'paid',
   act:'2025-01-10', exp:'2027-02-10', d30:0, last:null, m:[0,0,0,0,0,0,0,0,0,0,0,0],
   events:[['2025-01-17','Payée sans équipement : aucun équipement affecté','Alerte','red'],['2025-01-10','Activation chez Ooredoo','Activation','gray']]},
  {id:6, num:'+33600000001', iccid:'8933000000000000001', offer:null, client:'Stock Tunav', reseller:'Tunav', equip:'STK-2026-001', eqType:'FMC130', installed:false, detail:'stock', act:null, exp:'2026-12-31', d30:null, last:null, m:null, events:[['2026-09-10','Entrée en stock','Stock','gray']]},
  {id:7, num:'+33600000002', iccid:'8933000000000000002', offer:null, client:'Stock Tunav', reseller:'Tunav', equip:'STK-2026-002', eqType:'FMB120', installed:false, detail:'stock', act:null, exp:'2027-03-31', d30:null, last:null, m:null, events:[['2026-09-10','Entrée en stock','Stock','gray']]},
  {id:8, num:'+33600000003', iccid:'8933000000000000003', offer:null, client:'Stock Tunav', reseller:'Tunav', equip:'STK-2026-003', eqType:'FMB920', installed:false, detail:'stock', act:null, exp:'2026-11-30', d30:null, last:null, m:null, events:[['2026-09-25','Entrée en stock','Stock','gray']]},
];
// Génération déterministe (même résultat à chaque ouverture) des autres puces
(function generate(){
  let seed = 20261102; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const pick = arr => arr[Math.floor(rnd()*arr.length)], pad = (n,l) => String(n).padStart(l,'0');
  const TYPES = ['ETX','ET6','ET8','FMB120','FMB920','FMC130','MiniTrace','EasyCAN'], OPPFX = {o1:'22', o2:'71', o3:'50'};
  const CUR = new Date().getMonth();
  let id = SIMS.length, eq = 200;
  NETWORK.forEach(net => net.clients.forEach(([client, n]) => {
    const have = SIMS.filter(x=>x.client===client).length;
    for (let i = have; i < n; i++){
      id++; eq++;
      const stock = client === 'Stock Tunav';
      const offer = stock ? null : (r => r < .4 ? 'o1' : r < .85 ? 'o2' : 'o3')(rnd());
      const o = OFFERS.find(x=>x.id===offer);
      const y = 2023 + Math.floor(rnd()*4), mo = 1 + Math.floor(rnd()*(y===2026 ? 9 : 12)), d = 1 + Math.floor(rnd()*27);
      const act = stock ? null : `${y}-${pad(mo,2)}-${pad(d,2)}`;
      const r = rnd(), installed = !stock && r < .72;
      const detail = stock ? 'stock' : installed ? undefined : (rnd() < .65 ? 'aff' : 'paid');
      const equip = stock ? `STK-2026-${pad(id,3)}` : detail === 'paid' ? null : `EQ-${y}-${pad(eq,3)}`;
      let m = null, d30 = stock ? null : 0, last = null; const events = [];
      if (!stock){
        m = Array(12).fill(0);
        if (installed){
          const level = .1 + rnd()*.6, mute = rnd() < .08 ? 3 + Math.floor(rnd()*6) : null;   // ~8 % deviennent muettes
          for (let k = 0; k <= CUR; k++){
            if (mute !== null && k >= mute) break;
            let v = o.quota * level * (.75 + rnd()*.5);
            if (rnd() < .05) v = o.quota * (1.02 + rnd()*.15);                                     // dépassements ponctuels
            m[k] = Math.round(k === CUR ? v * new Date().getDate() / 30 : v);
          }
          if (mute !== null){ d30 = 0; last = `2026-${pad(mute,2)}-${pad(5 + Math.floor(rnd()*20),2)}`; events.push([last,'Dernière consommation','Conso','gray']); }
          else { d30 = Math.round(m[Math.max(0,CUR-1)] * (.95 + rnd()*.1)); last = 'today'; }
          if (d30 >= o.quota*.8) events.push([`2026-${pad(CUR,2)}-2${Math.floor(rnd()*8)}`, `${Math.round(d30/o.quota*100)} % du forfait atteint`, 'Alerte', 'amber']);
        }
        if (equip) events.push([act, `Affectée à ${equip}`, 'Affectation', 'gray']);
        events.push([act, `Activation chez ${o.op}`, 'Activation', 'gray']);
      } else events.push(['2026-09-10','Entrée en stock','Stock','gray']);
      const ey = 2026 + Math.floor(rnd()*2), em = 1 + Math.floor(rnd()*12);
      SIMS.push({ id, num:`+216 ${stock ? '90' : OPPFX[offer]} ${pad(Math.floor(rnd()*1000),3)} ${pad(Math.floor(rnd()*1000),3)}`, iccid:`8921${pad(Math.floor(rnd()*1e8),8)}${pad(id,8)}`,
        offer, client, reseller:net.reseller, equip, eqType: equip ? pick(TYPES) : null, installed, detail, act,
        exp:`${ey}-${pad(em,2)}-${pad(1 + Math.floor(rnd()*27),2)}`, d30, last, m, events:events.sort((p,q)=>q[0].localeCompare(p[0])) });
    }
  }));
})();
const RESELLERS = NETWORK.map(n=>n.reseller);
const DETAIL = {aff:'affectée, équipement non posé', paid:'payée sans équipement', stock:'en stock'};
const MIN_MO = 100;   // intervalle attendu : de 100 Mo au forfait ; rappel à 80 %

/* ======================= Outils ======================= */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const TODAY = new Date(); TODAY.setHours(12,0,0,0);
const DAY = 864e5, CUR = TODAY.getMonth();
const MOIS = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const d0 = s => { const d = new Date(s); d.setHours(0,0,0,0); return d; };
const fmtD = s => s ? new Date(s).toLocaleDateString('fr-FR') : '—';
const since = s => Math.floor((d0(TODAY) - d0(s)) / DAY);
const pct = (a,b) => b ? Math.round(a*100/b) : 0;
const vol = mo => mo == null ? '—' : mo >= 1024 ? `${(mo/1024).toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1})} Go` : `${Math.round(mo)} Mo`;
const tnd = v => `${v.toLocaleString('fr-FR',{minimumFractionDigits:2, maximumFractionDigits:2})} TND`;
const offerOf = s => OFFERS.find(o=>o.id===s.offer);
const priceOf = s => offerOf(s)?.price || 0;
const costOf = l => l.reduce((t,s)=>t+priceOf(s),0);
const offTxt = o => o ? `${o.name} · ${o.op}` : 'Aucune offre';
const stHtml = s => s.installed ? '<span class="st ins">Installée</span>' : `<span class="st non">Non installée</span><small>${DETAIL[s.detail]}</small>`;
const daysNoService = s => s.installed && s.last === 'today' ? 0 : s.last ? since(s.last) : s.act ? since(s.act) : null;
const alertOf = s => { const o = offerOf(s); if (!o || s.d30 == null) return null;
  if (s.d30 >= o.quota*.8) return 'high'; if (s.d30 < MIN_MO && s.installed) return 'low'; return null; };   // puce muette = installée sans conso
let VIEW = '', NET = '', PER = 'm', MONTH = Math.max(0, CUR - 1), BY = 'client', SEL_SIM = 1, MFILT = '', OPEN_RES = new Set();   // dernier mois complet par défaut
const sims = () => SIMS.filter(s=>(!VIEW || s.reseller===VIEW) && (!NET || s.reseller===NET));
// Consommation d'une puce sur la période choisie : volume, forfait de la période, surconsommation (volume au-delà du forfait)
// 7 j et 30 j : estimés à partir de « Data 30 j » (la maquette n'a pas le détail par jour)
function per(s, p = PER, m = MONTH){
  const o = offerOf(s); if (!o || !s.m) return {v:0, q:0, over:0};
  if (p==='m') return {v:s.m[m], q:o.quota, over:Math.max(0, s.m[m]-o.quota)};
  if (p==='y') { const k = s.m.slice(0, CUR+1); return {v:k.reduce((t,x)=>t+x,0), q:o.quota*(CUR+1), over:k.reduce((t,x)=>t+Math.max(0,x-o.quota),0), qo:o.quota*k.filter(x=>x>o.quota).length}; }
  const f = p==='7' ? 7/30 : 1, v = (s.d30||0)*f, q = o.quota*f; return {v, q, over:Math.max(0, v-q)};
}
const perPrev = s => PER==='m' ? (MONTH ? per(s,'m',MONTH-1) : null) : PER==='y' ? null : {v:(PER==='7' ? (s.d30||0)*7/30 : mVal(s,Math.max(0,CUR-1))) * .95, q:0, over:0};
const perLabel = () => PER==='7' ? '7 derniers jours' : PER==='30' ? '30 derniers jours' : PER==='y' ? `année ${TODAY.getFullYear()} (janv. → ${MOIS[CUR]})` : `${MOIS[MONTH]} ${TODAY.getFullYear()}${MONTH===CUR?' (en cours)':''}`;
const netLabel = r => r==='Tunav' ? 'Tunav · clients directs' : r;
const mVal = (s, m) => s.m ? s.m[m] : 0;

/* ======================= Pagination (5 / 10 / 25 / 50) ======================= */
const PG = {};
function pager(el, key, total, onChange){
  const st = PG[key] = PG[key] || {page:0, size:10}, pages = Math.max(1, Math.ceil(total/st.size));
  if (st.page >= pages) st.page = pages - 1;
  const from = total ? st.page*st.size + 1 : 0, to = Math.min(total, (st.page+1)*st.size);
  const btns = []; for (let p = 0; p < pages; p++) if (p < 2 || p >= pages-2 || Math.abs(p-st.page) <= 1) btns.push(p); else if (btns[btns.length-1] !== '…') btns.push('…');
  $(el).innerHTML = `<select data-ps>${[5,10,25,50].map(n=>`<option value="${n}" ${n===st.size?'selected':''}>${n} par page</option>`).join('')}</select>
    <span>${from}–${to} sur ${total}</span><button data-pp="-1" ${st.page===0?'disabled':''}>‹</button>${btns.map(p=>p==='…'?'<span>…</span>':`<button data-pn="${p}" class="${p===st.page?'on':''}">${p+1}</button>`).join('')}<button data-pp="1" ${st.page>=pages-1?'disabled':''}>›</button>`;
  $(el).querySelector('[data-ps]').onchange = e=>{ st.size = +e.target.value; st.page = 0; onChange(); };
  $(el).querySelectorAll('[data-pp]').forEach(b=>b.onclick=()=>{ st.page += +b.dataset.pp; onChange(); });
  $(el).querySelectorAll('[data-pn]').forEach(b=>b.onclick=()=>{ st.page = +b.dataset.pn; onChange(); });
  return [st.page*st.size, st.page*st.size + st.size];
}

/* ======================= Fenêtre de détail générique ======================= */
let MLIST = [];
function modal(title, body, foot=''){
  $('#modal').innerHTML = `<div class="ov" id="ov"><div class="modal" role="dialog" aria-modal="true">
    <div class="mh"><h3>${title}</h3><button class="x" data-x aria-label="Fermer">×</button></div>
    <div class="mb">${body}</div>
    <div class="mf">${foot}<button class="btn primary" data-x>Fermer</button></div></div></div>`;
  $('#ov').onclick = e => { if (e.target.id==='ov' || e.target.closest('[data-x]')) $('#modal').innerHTML = ''; };
  if ($('#mlist')) drawMList();
  $$('#modal [data-sim]').forEach(r=>r.onclick=()=>openSim(+r.dataset.sim));
}
// liste de puces paginée dans une fenêtre
let MMODE = '';
const simTable = (list, mode = '') => { MLIST = list; MMODE = mode; PG.mlist = {page:0, size:10}; return list.length ? '<div id="mlist"></div><div class="pager" id="mlistPg"></div>' : '<p class="note" style="text-align:center;padding:16px">Aucune puce.</p>'; };
function drawMList(){
  const [a,b] = pager('#mlistPg', 'mlist', MLIST.length, drawMList);
  if (MMODE==='over') { // puces en surconsommation : ID, revendeur, client, offre, conso, dépassement
    $('#mlist').innerHTML = `<table><thead><tr><th>Puce · ID</th><th>Revendeur</th><th>Client</th><th>Offre</th><th>Conso</th><th>Dépassement</th></tr></thead><tbody>${MLIST.slice(a,b).map(s=>{ const p = per(s); return `
    <tr class="click" data-sim="${s.id}"><td class="num" style="white-space:nowrap">${s.num}<small>ID ${s.id}</small></td><td><b>${s.reseller==='Tunav' ? 'Tunav' : s.reseller}</b><small>${s.reseller==='Tunav' ? 'client direct' : 'revendeur'}</small></td><td>${s.client}<small>${s.equip || 'sans équipement'}</small></td><td>${offerOf(s).name}<small>${offerOf(s).op}</small></td><td class="num" style="white-space:nowrap">${vol(p.v)}<small>sur ${vol(p.q)}</small></td><td class="num ov-t">${p.over ? '+' + vol(p.over) : '—'}</td></tr>`; }).join('')}</tbody></table>`;
    $$('#mlist [data-sim]').forEach(r=>r.onclick=()=>openSim(+r.dataset.sim)); return; }
  if (MMODE==='simple') { // liste simple sans prix : puce, client, revendeur, offre, conso, statut
    $('#mlist').innerHTML = `<table><thead><tr><th>Puce · ID</th><th>Client</th><th>Revendeur</th><th>Offre</th><th>Conso</th><th>Statut</th></tr></thead><tbody>${MLIST.slice(a,b).map(s=>`
    <tr class="click" data-sim="${s.id}"><td class="num" style="white-space:nowrap">${s.num}<small>ID ${s.id}</small></td><td>${s.client}</td><td>${s.reseller==='Tunav' ? 'Tunav' : s.reseller}</td><td>${offerOf(s) ? offerOf(s).name : '—'}</td><td class="num">${offerOf(s) && s.m ? vol(per(s).v) : '—'}</td><td>${s.installed ? '<span class="st ins">Installée</span>' : '<span class="st non">Non installée</span>'}</td></tr>`).join('')}</tbody></table>`;
    $$('#mlist [data-sim]').forEach(r=>r.onclick=()=>openSim(+r.dataset.sim)); return; }
  $('#mlist').innerHTML = `<table><thead><tr><th>Puce</th><th>Client · revendeur</th><th>Offre · prix</th><th>Data 30 j</th><th>Statut</th></tr></thead><tbody>${MLIST.slice(a,b).map(s=>`
    <tr class="click" data-sim="${s.id}"><td class="num">${s.num}<small>${s.iccid}</small></td><td>${s.client}<small>${s.reseller}${s.equip ? ' · ' + s.equip : ''}</small></td><td>${offTxt(offerOf(s))}${offerOf(s) ? `<small>${tnd(priceOf(s))} / mois</small>` : ''}</td><td class="num">${vol(s.d30)}</td><td>${stHtml(s)}</td></tr>`).join('')}</tbody></table>`;
  $$('#mlist [data-sim]').forEach(r=>r.onclick=()=>openSim(+r.dataset.sim));
}

/* ======================= 1. Cartes ======================= */
function renderCards(){
  const L = sims(), ins = L.filter(s=>s.installed), non = L.filter(s=>!s.installed), al = L.filter(alertOf);
  const tun = L.filter(s=>s.reseller==='Tunav').length, rev = L.length - tun;
  const card = (k, t, v, ic, extra='') => `<button class="kc" data-k="${k}"><div class="t">${t}</div><div class="ic">${ic}</div><div class="v">${v}</div>${extra}<span class="more">Voir le détail →</span></button>`;
  const IC = {
    tot:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>',
    ins:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.6a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0"/><circle cx="12" cy="20" r="1"/></svg>',
    non:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M5 12.6a10 10 0 0 1 5.2-2.8M19 12.6a10 10 0 0 0-2.5-1.9"/><circle cx="12" cy="20" r="1"/></svg>',
    cost:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
    over:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>',
    al:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/></svg>'};
  $('#cards').innerHTML =
    card('tot','Total puces', L.length, IC.tot, VIEW || NET ? `<div class="note">${netLabel(NET || VIEW)}</div>` : `<div class="note">Tunav ${tun} · revendeurs ${rev}</div>`) +
    card('ins','Installées', `<span style="color:var(--green)">${ins.length}</span> <small>${pct(ins.length,L.length)} %</small>`, IC.ins) +
    card('non','Non installées', `<span style="color:var(--amber)">${non.length}</span> <small>${pct(non.length,L.length)} %</small>`, IC.non) +
    card('over','Puces en surconsommation', `<span style="color:var(--red)">${L.filter(s=>per(s).over>0).length}</span> <small>puce(s)</small>`, IC.over, `<div class="note"><span style="color:var(--red)">+${vol(L.reduce((t,s)=>t+per(s).over,0))}</span> au-delà du forfait · ${perLabel()}</div>`);
  $$('#cards [data-k]').forEach(b=>b.onclick=()=>openCard(b.dataset.k));
}
const netTable = L => `<table><thead><tr><th>Réseau</th><th>Clients</th><th>Puces</th><th>Installées</th><th>Non installées</th><th>Coût / mois</th></tr></thead><tbody>${RESELLERS.filter(r=>L.some(s=>s.reseller===r)).map(r=>{ const l = L.filter(s=>s.reseller===r);
  return `<tr><td><b>${r==='Tunav' ? 'Tunav · clients directs' : r}</b><small>${r==='Tunav' ? 'dont stock Tunav' : 'revendeur'}</small></td><td class="num">${new Set(l.map(s=>s.client)).size}</td><td class="num">${l.length}</td><td class="num">${l.filter(s=>s.installed).length}</td><td class="num">${l.filter(s=>!s.installed).length}</td><td class="num">${tnd(costOf(l))}</td></tr>`; }).join('')}
  <tr style="font-weight:600;background:#F8FAFC"><td>Total</td><td class="num">${new Set(L.map(s=>s.client)).size}</td><td class="num">${L.length}</td><td class="num">${L.filter(s=>s.installed).length}</td><td class="num">${L.filter(s=>!s.installed).length}</td><td class="num">${tnd(costOf(L))}</td></tr></tbody></table>`;
function openCard(k){
  const L = sims();
  if (k==='tot') modal(`Toutes les puces · ${L.length}`, `<h4 class="dh" style="margin-top:0">Tunav et revendeurs</h4>${netTable(L)}<h4 class="dh">Puces</h4>${simTable(L)}`);
  if (k==='ins') { const l = L.filter(s=>s.installed); modal(`Puces installées · ${l.length}`, `<p class="note" style="margin-top:0">Puce dans un équipement posé chez le client · coût ${tnd(costOf(l))} / mois.</p>${simTable(l)}`); }
  if (k==='non') { const l = L.filter(s=>!s.installed), n = d => l.filter(s=>s.detail===d);
    modal(`Puces non installées · ${l.length}`, `<div class="tiles"><div class="tile warn"><span>Affectée, non posée</span><b>${n('aff').length}</b><small>${tnd(costOf(n('aff')))} / mois</small></div><div class="tile bad"><span>Payée sans équipement</span><b>${n('paid').length}</b><small>${tnd(costOf(n('paid')))} / mois</small></div><div class="tile"><span>En stock</span><b>${n('stock').length}</b><small>sans offre</small></div></div><h4 class="dh">Puces</h4>${simTable(l)}`); }
  if (k==='over') { const l = L.filter(s=>per(s).over>0).sort((a,b)=>per(b).over-per(a).over), tot = l.reduce((t,s)=>t+per(s).over,0);
    modal(`Surconsommation · ${perLabel()}`, `<div class="tiles"><div class="tile bad"><span>Puces au-delà du forfait</span><b>${l.length}</b><small>sur ${L.filter(offerOf).length} puces avec offre</small></div><div class="tile bad"><span>Volume en trop</span><b>${vol(tot)}</b><small>${perLabel()}</small></div><div class="tile"><span>Offre la plus touchée</span><b>${(OFFERS.map(o=>[o, l.filter(s=>s.offer===o.id).length]).sort((a,b)=>b[1]-a[1])[0]||[{name:'—'}])[0].name}</b><small>proposer l’offre supérieure</small></div></div>
      <h4 class="dh">Par réseau</h4><table><thead><tr><th>Réseau</th><th>Puces en surconso</th><th>Volume en trop</th></tr></thead><tbody>${RESELLERS.filter(r=>L.some(s=>s.reseller===r)).map(r=>{ const x = l.filter(s=>s.reseller===r); return `<tr><td><b>${netLabel(r)}</b></td><td class="num">${x.length}</td><td class="num ov-t">${vol(x.reduce((t,s)=>t+per(s).over,0))}</td></tr>`; }).join('')}</tbody></table>
      <h4 class="dh">Puces (de la plus en surconsommation à la moins)</h4>${simTable(l, 'over')}`); }
  if (k==='al') { const l = L.filter(alertOf);
    modal(`Alertes consommation · ${l.length}`, `<div class="tiles"><div class="tile warn"><span>≥ 80 % du forfait</span><b>${l.filter(s=>alertOf(s)==='high').length}</b><small>proposer l’offre supérieure</small></div><div class="tile bad"><span>Sous l’intervalle</span><b>${l.filter(s=>alertOf(s)==='low').length}</b><small>suspendre ou installer</small></div><div class="tile"><span>Coût concerné</span><b>${tnd(costOf(l.filter(s=>alertOf(s)==='low')))}</b><small>puces muettes / mois</small></div></div><h4 class="dh">Puces</h4>${simTable(l)}`); }
}

/* ======================= 2. Puces installées par offre ======================= */
function renderOffers(){
  const L = sims();
  const rows = [...OFFERS.map(o=>({o, l:L.filter(s=>s.offer===o.id)})), ].filter(r=>r.l.length);
  $('#offers').innerHTML = rows.map(r=>{ const n = r.l.filter(s=>s.installed).length;
    return `<button class="oc${r.o?'':' none'}" data-of="${r.o ? r.o.id : 'none'}">
      <span class="on">${r.o ? `${r.o.name} - ${r.o.op}` : 'Sans offre (stock)'}</span>
      ${r.o ? `<span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="op">📶 ${r.o.op}</span><span class="note"><b style="color:var(--ink)">${tnd(r.o.price)}</b> / puce / mois</span></span>` : '<span class="op">Puces en stock</span>'}
      <span class="n">${n} <span style="color:var(--faint)">/</span> ${r.l.length} <small>installées / puces</small></span>
      <div class="meter"><i style="width:${pct(n,r.l.length)}%"></i></div>
      <div class="foot"><span>${pct(n,r.l.length)} % installées${r.o ? ` · ${tnd(costOf(r.l))} / mois` : ''}</span><b>Voir les puces →</b></div></button>`; }).join('');
  $$('#offers [data-of]').forEach(b=>b.onclick=()=>{ const id = b.dataset.of, o = OFFERS.find(x=>x.id===id), l = L.filter(s=>id==='none' ? !s.offer : s.offer===id), n = l.filter(s=>!s.installed);
    modal(o ? `${o.name} · ${o.op}` : 'Sans offre (stock)', `<div class="tiles"><div class="tile"><span>Prix</span><b>${o ? tnd(o.price) : '—'}</b><small>par puce et par mois</small></div><div class="tile"><span>Puces · installées</span><b>${l.length} · ${l.length-n.length}</b><small>forfait ${o ? vol(o.quota) : '—'}</small></div><div class="tile ${o && n.length ? 'bad' : ''}"><span>Coût / mois</span><b>${o ? tnd(costOf(l)) : '—'}</b><small>${o ? tnd(costOf(n)) + ' non installées' : ''}</small></div></div><h4 class="dh">Puces de l'offre</h4>${simTable(l)}`); });
}

/* ======================= 3. Tableau des puces ======================= */
const F = { q:'', st:'', of:'', op:'', re:'', cl:'', al:'' };
function filtered(){ return sims().filter(s=>{ const o = offerOf(s);
  if (F.q && !`${s.num} ${s.iccid} ${o?o.op:''} ${s.client} ${s.reseller} ${s.equip||''}`.toLowerCase().includes(F.q)) return false;
  if (F.st==='ins' && !s.installed) return false; if (F.st==='non' && s.installed) return false;
  if (F.of && s.offer!==F.of) return false; if (F.op && (!o || o.op!==F.op)) return false;
  if (F.re && s.reseller!==F.re) return false; if (F.cl && s.client!==F.cl) return false; if (F.al && alertOf(s)!==F.al) return false; return true; }); }
function renderTable(){
  const L = filtered(), [a,b] = pager('#pg', 'rows', L.length, renderTable);
  $('#rows').innerHTML = L.slice(a,b).map(s=>{ const o = offerOf(s), al = alertOf(s), dns = daysNoService(s);
    return `<tr class="click${s.detail==='paid'?' alert-r':''}" data-sim="${s.id}">
      <td class="num">${s.num}<small>${s.iccid}</small></td>
      <td>${s.client}<small>${s.equip ? `${s.equip} · ${s.installed ? 'installé' : s.detail==='stock' ? s.eqType : 'non installé'}` : 'Aucun équipement'}</small></td>
      <td>${s.reseller}<small>${s.reseller==='Tunav' ? 'client direct' : 'revendeur'}</small></td>
      <td>${o ? `${o.name} · ${o.op}<br><span class="price">${tnd(o.price)} / mois</span>` : '<span class="note">Aucune offre</span>'}</td>
      <td class="num">${fmtD(s.act)}</td>
      <td>${stHtml(s)}</td></tr>`; }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">Aucune puce</td></tr>';
  $$('#rows [data-sim]').forEach(r=>r.onclick=()=>{ SEL_SIM = +r.dataset.sim; openSim(SEL_SIM); });
  $('#chips').innerHTML = `${L.length} puce(s) · coût ${tnd(costOf(L))} / mois`;
}

/* ======================= Fiche puce ======================= */
function openSim(id){
  const s = SIMS.find(x=>x.id===id), o = offerOf(s), a = alertOf(s), dns = daysNoService(s);
  const tile = (t,v,sub='',cls='') => `<div class="tile ${cls}"><span>${t}</span><b>${v}</b><small>${sub}</small></div>`;
  const months = MOIS.map((m,i)=>({m, v: i > CUR ? null : mVal(s,i)}));
  const max = Math.max(o ? o.quota : 1, ...months.map(x=>x.v||0));
  modal(`${s.num} ${s.installed ? '<span class="st ins" style="margin-left:6px">Installée</span>' : `<span class="st non" style="margin-left:6px">Non installée · ${DETAIL[s.detail]}</span>`}`,
    `<div class="tiles">
      ${tile('Offre', o ? o.name : '—', o ? `${o.op} · forfait ${vol(o.quota)}` : 'aucune offre')}
      ${tile('Prix', o ? tnd(o.price) : '—', o ? (s.installed ? 'par mois · en service' : 'par mois · payé sans service') : '', o && !s.installed ? 'bad' : '')}
      ${tile('Client', s.client, s.reseller==='Tunav' ? 'client direct Tunav' : `revendeur ${s.reseller}`)}
      ${tile('Équipement', s.equip || '—', s.equip ? `${s.eqType} · ${s.installed ? 'installé' : 'non installé'}` : 'aucun équipement', s.detail==='paid' ? 'bad' : '')}
      ${tile('Data 30 j', vol(s.d30), o && s.d30 != null ? `${pct(s.d30,o.quota)} % du forfait` : '', a==='high' ? 'warn' : a==='low' ? 'bad' : '')}
      ${tile('Jours sans service', dns == null ? '—' : `${dns} j`, s.act ? `activée le ${fmtD(s.act)} · expire le ${fmtD(s.exp)}` : 'non activée', dns > 7 ? 'bad' : '')}
    </div>
    ${s.m ? `<h4 class="dh">Consommation par mois (${TODAY.getFullYear()})</h4>
      <div class="cols" style="position:relative;height:140px">${o ? `<div class="plan-line" style="bottom:${o.quota/max*85}%"></div>` : ''}${months.map(x=>`<div class="c${x.v==null?' fut':''}" title="${x.m} : ${x.v==null?'à venir':vol(x.v)}">${x.v ? `<span class="v">${vol(x.v)}</span>` : ''}<div class="bar" style="height:${(x.v||0)/max*85}%;background:${o && x.v > o.quota ? '#D97706' : '#2563EB'}"></div></div>`).join('')}</div>
      <div class="xl">${MOIS.map((m,i)=>`<span class="${i>CUR?'fut':''}">${m.replace('.','')}</span>`).join('')}</div>` : ''}
    <h4 class="dh">Traçabilité</h4>${s.events.map(e=>`<div class="ev"><span class="d">${fmtD(e[0])}</span><span>${e[1]}</span><span class="tag ${e[3]}">${e[2]}</span></div>`).join('')}`);
}

/* ======================= 4. Consommation data : par client / par revendeur (période, jauge, surconsommation) ======================= */
function agg(l){
  const p = l.map(s=>per(s)), v = p.reduce((t,x)=>t+x.v,0), q = p.reduce((t,x)=>t+x.q,0), over = p.reduce((t,x)=>t+x.over,0);
  const pv = l.map(perPrev), prev = pv.every(x=>x) ? pv.reduce((t,x)=>t+x.v,0) : null;
  // % du forfait atteint pendant les mois dépassés (toujours > 100 %) : 100 + volume en trop ÷ forfait de ces mois
  const po = p.filter(x=>x.over>0), qo = po.reduce((t,x)=>t+(x.qo ?? x.q),0), overPct = po.length ? Math.round(100 + po.reduce((t,x)=>t+x.over,0)*100/qo) : 0;
  // utilisé du forfait : seulement les puces installées (une puce non installée a un forfait mais ne peut pas consommer)
  const pi = l.filter(s=>s.installed).map(s=>per(s)), vi = pi.reduce((t,x)=>t+x.v,0), qi = pi.reduce((t,x)=>t+x.q,0);
  return {l, v, q, vi, qi, over, overPct, nOver:po.length, prev, ins:pi.length};
}
// consommation ramenée à un mois : année = moyenne des mois écoulés, 7 j = extrapolée à 30 j
const perMonth = v => PER==='y' ? v/(CUR+1) : PER==='7' ? v*30/7 : v;
const prevLabel = () => PER==='m' ? (MONTH ? MOIS[MONTH-1] : '') : PER==='y' ? '' : PER==='7' ? '7 j précédents' : '30 j précédents';
const passFilt = g => !MFILT || (MFILT==='over' ? g.over>0 : MFILT==='high' ? g.qi && g.vi >= g.qi*.8 : MFILT==='low' ? g.qi && g.vi < g.qi*.2 : MFILT==='zero' ? g.v===0 : true);
// recherche par nom de client (en mode revendeur : garde les revendeurs qui ont ce client)
let MQ = '';
const norm = t => t.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const hitQ = name => !MQ || norm(name).includes(norm(MQ));
function groups(){
  const key = s => BY==='client' ? s.client : s.reseller;
  return [...new Set(sims().map(key))].map(name=>({name, res:sims().find(s=>key(s)===name).reseller, ...agg(sims().filter(s=>key(s)===name))}))
    .filter(g => BY==='client' ? hitQ(g.name) : !MQ || g.l.some(s=>hitQ(s.client)))
    .filter(passFilt).sort((a,b)=>b.v-a.v || b.l.length-a.l.length);
}
// jauge : zone attendue (100 Mo → forfait) en vert, repère noir (rouge au-delà du forfait), échelle 0 → 120 % du forfait
const gauge = (v, q) => { if (!q) return '<span class="note">non suivi</span>';
  const u = Math.round(v*100/q), mk = Math.min(v/q, 1.2)/1.2*100, lo = Math.min(MIN_MO/q, 1)/1.2*100;
  return `<div class="ugauge"><div class="gauge${v>q?' over':''}" title="${vol(v)} sur un forfait de ${vol(q)}"><div class="ok" style="left:${lo}%;right:${100-100/1.2}%"></div><div class="mk" style="left:${mk}%"></div></div><span class="num ${u>100?'ov-t':u>=80?'warn-t':''}">${u} %</span></div>`; };
// une ligne du tableau : nom | puces | conso / mois | utilisé du forfait | dépassement | vs période précédente
const SIM_SHOW = 5;   // puces visibles sous un client ouvert, le reste via « voir toutes »
const prevCell = (v, prev) => prev == null ? '<span class="note">—</span>' : (d => d===0 ? '<span class="dlt down">=</span>' : `<span class="dlt ${d>0?'up':'down'}">${d>0?'+':'−'}${prev ? Math.round(Math.abs(d)*100/prev)+' %' : vol(Math.abs(d))}</span>`)(v - prev);
const overCell = (over, n) => over ? `<span class="ov-t num">+${vol(over)}</span>${n == null ? '' : `<small>${n} puce${n>1?'s dépassent':' dépasse'}</small>`}` : '<span class="note">—</span>';
const rowCells = g => `<td class="num">${g.l.length}<small>${g.ins} installée(s)</small></td><td><span class="num">${vol(perMonth(g.v))}</span><small>${vol(perMonth(g.v)/g.l.length)} / puce</small></td>
  <td class="num">${g.qi ? vol(perMonth(g.qi)) : '—'}<small>${g.qi ? 'par mois' : 'aucune installée'}</small></td><td>${gauge(g.vi, g.qi)}</td><td>${overCell(g.over, g.nOver)}</td><td>${prevCell(g.v, g.prev)}</td>`;
const simCells = x => { const p = per(x), pv = perPrev(x);
  return `<td></td><td class="num">${vol(perMonth(p.v))}</td><td class="num">${vol(perMonth(p.q))}</td><td>${x.installed ? gauge(p.v, p.q) : '<span class="note">non installée</span>'}</td><td>${overCell(p.over)}</td><td>${prevCell(p.v, pv && pv.v)}</td>`; };
const OPEN_CLI = new Set();
// lignes d'un client : la ligne client, puis ses puces s'il est ouvert (dépassement en premier)
function clientRows(c, parent){
  const k = (parent ? parent.name : '') + '|' + c.name, open = OPEN_CLI.has(k);
  const share = parent && parent.v ? `${Math.round(c.v*100/parent.v)} % de ${netLabel(parent.name)}` : netLabel(c.res);
  let h = `<tr class="click ${parent ? 'sub' : ''}" data-c="${k}"><td><span class="caret">${open?'▾':'▸'}</span><b>${c.name}</b><small>${share}</small></td>${rowCells(c)}</tr>`;
  if (open) { const L = c.l.slice().sort((x,y)=>per(y).over-per(x).over || per(y).v-per(x).v);
    h += L.slice(0, SIM_SHOW).map(x=>`<tr class="click sim${parent ? ' deep' : ''}" data-sim="${x.id}"><td><span class="num">${x.num}</span><small>${offTxt(offerOf(x))}${x.installed ? '' : ' · non installée'}</small></td>${simCells(x)}</tr>`).join('');
    if (L.length > SIM_SHOW) h += `<tr class="sim more${parent ? ' deep' : ''}" data-all="${c.name}"><td colspan="7">+ ${L.length - SIM_SHOW} autre(s) puce(s) · voir toutes</td></tr>`; }
  return h;
}
function renderMonth(){
  const G = groups(), [a,b] = pager('#mPg', 'month-'+BY, G.length, renderMonth);
  $('#mTitle').textContent = `Consommation data · ${perLabel()}`;
  const all = agg(sims());
  $('#mSub').textContent = `${BY==='client' ? `Par client (${G.length})` : `Par revendeur (${G.length})`} · conso ${vol(perMonth(all.v))} / mois · dépassement ${vol(all.over)} (${all.nOver} puce(s))${PER==='7'||PER==='30' ? ' · estimé à partir de Data 30 j' : ''}`;
  $('#mCol').textContent = BY==='client' ? 'Client / puce' : 'Revendeur / client / puce';
  $('#mQList').innerHTML = [...new Set(sims().map(s=>s.client))].sort().map(c=>`<option value="${c}">`).join('');
  $('#mPrev').textContent = PER==='m' ? (MONTH ? `vs ${MOIS[MONTH-1]}` : 'vs mois préc.') : PER==='y' ? 'vs année préc.' : `vs ${prevLabel()}`;
  $('#mPrev').title = 'Écart avec la période précédente';
  $('#mRows').innerHTML = G.slice(a,b).map(g=>{
    if (BY==='client') return clientRows(g);
    // par revendeur : la ligne s'ouvre sur ses clients ; une recherche ouvre les revendeurs qui ont le client
    const open = OPEN_RES.has(g.name) || !!MQ, nCli = new Set(g.l.map(s=>s.client)).size;
    const clients = open ? [...new Set(g.l.map(s=>s.client))].filter(hitQ).map(c=>({name:c, res:g.name, ...agg(g.l.filter(s=>s.client===c))})).filter(passFilt).sort((x,y)=>y.v-x.v) : [];
    return `<tr class="click lvl1" data-r="${g.name}"><td><span class="caret">${open?'▾':'▸'}</span><b>${netLabel(g.name)}</b><small>${nCli} client(s)</small></td>${rowCells(g)}</tr>` + clients.map(c=>clientRows(c, g)).join('');
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">Aucune ligne pour ce filtre</td></tr>';
  // graphique : nombre de puces au-delà du forfait, par revendeur
  const nets = RESELLERS.filter(r=>sims().some(x=>x.reseller===r)).map(r=>{ const l = sims().filter(x=>x.reseller===r), o = l.filter(x=>per(x).over>0);
    return {r, l, o, ins:l.filter(x=>x.installed).length, over:o.reduce((t,x)=>t+per(x).over,0), cli:new Set(o.map(x=>x.client)).size}; }).sort((a,b)=>b.o.length-a.o.length);
  const omax = Math.max(1, ...nets.map(n=>n.o.length));
  $('#ocSub').textContent = `${perLabel()} · ${all.nOver} puce(s) au-delà du forfait · cliquez sur une barre pour voir les puces`;
  $('#ocRows').innerHTML = nets.map(n=>`<button class="hrow oc" data-oc="${n.r}"><span><b>${netLabel(n.r)}</b><small>${n.cli} client(s) concerné(s)</small></span><div class="tr" style="background:transparent">${n.o.length ? `<i style="width:${n.o.length/omax*100}%;background:#DC2626;border-radius:4px"></i>` : '<em>aucune</em>'}</div><span class="num"><b>${n.o.length}</b> puce(s)${n.over ? `<small class="ov-t">+${vol(n.over)}</small>` : ''}</span></button>`).join('');
  $$('#ocRows [data-oc]').forEach(b=>b.onclick=()=>{ const n = nets.find(x=>x.r===b.dataset.oc), l = n.o.slice().sort((x,y)=>per(y).over-per(x).over);
    modal(`${netLabel(n.r)} · puces en surconsommation · ${perLabel()}`, l.length ? `<p class="note" style="margin-top:0">${l.length} puce(s) chez ${n.cli} client(s) · +${vol(n.over)} au-delà du forfait.</p>${simTable(l, 'over')}` : '<p class="note">Aucune puce au-delà du forfait sur la période.</p>'); });
  $$('#mRows [data-r]').forEach(r=>r.onclick=()=>{ const n = r.dataset.r; OPEN_RES.has(n) ? OPEN_RES.delete(n) : OPEN_RES.add(n); renderMonth(); });
  $$('#mRows [data-c]').forEach(r=>r.onclick=()=>{ const k = r.dataset.c; OPEN_CLI.has(k) ? OPEN_CLI.delete(k) : OPEN_CLI.add(k); renderMonth(); });
  $$('#mRows [data-sim]').forEach(r=>r.onclick=()=>openSim(+r.dataset.sim));
  $$('#mRows [data-all]').forEach(r=>r.onclick=()=>{ const name = r.dataset.all, g = agg(sims().filter(s=>s.client===name));
    const lst = g.l.slice().sort((x,y)=>per(y).over-per(x).over || per(y).v-per(x).v);
    modal(`${name} · ${perLabel()}`, `<div class="tiles"><div class="tile"><span>Conso / mois</span><b>${vol(perMonth(g.v))}</b><small>${g.l.length} puce(s)</small></div><div class="tile ${g.vi>g.qi?'bad':g.vi>=g.qi*.8?'warn':''}"><span>Utilisé du forfait</span><b>${pct(g.vi,g.qi)} %</b><small>${g.ins} puce(s) installée(s) · forfait ${vol(perMonth(g.qi))} / mois</small></div><div class="tile ${g.over?'bad':''}"><span>Dépassement</span><b>${g.over?'+'+vol(g.over):'—'}</b><small>${g.nOver} puce(s) dépassent</small></div></div>
      <h4 class="dh">Puces (dépassement en premier)</h4>${simTable(lst, 'over')}`); });
}

/* ======================= 5. Volume par opérateur ======================= */
function renderOperators(){
  const ops = OFFERS.map(o=>o.op), L = sims();
  const data = ops.map(op=>{ const l = L.filter(s=>offerOf(s)?.op===op), a = agg(l); return {op, l, v:a.v, over:a.over, act:l.filter(s=>per(s).v>0).length, cost:costOf(l)}; });
  const max = Math.max(1, ...data.map(d=>d.v));
  $('#opSub').textContent = `${perLabel()} · volume consommé par opérateur · cliquez sur une barre pour voir ses puces`;
  $('#opCols').innerHTML = data.map(d=>`<button class="c" data-op="${d.op}" title="${d.op} : ${vol(d.v)} · ${d.act} puce(s) actives sur ${d.l.length}"><span class="v">${vol(d.v)}</span><div class="bar" style="height:${Math.max(1,d.v/max*85)}%;background:${d.v?'#2563EB':'#D97706'}"></div></button>`).join('');
  $('#opX').innerHTML = data.map(d=>`<span><b>${d.op}</b><br>${d.act} puces actives sur ${d.l.length}${d.over ? `<br><b class="ov-t">+${vol(d.over)} au-delà du forfait</b>` : ''}</span>`).join('');
  const idle = data.map(d=>({...d, idle:d.l.filter(s=>!per(s).v)})).filter(d=>d.idle.length);
  $$('#opCols [data-op]').forEach(b=>b.onclick=()=>{ const d = data.find(x=>x.op===b.dataset.op), idleL = d.l.filter(s=>!per(s).v);
    modal(`${d.op} · ${perLabel()}`, `<div class="tiles"><div class="tile"><span>Volume</span><b>${vol(d.v)}</b><small>${d.over ? 'dont +' + vol(d.over) + ' au-delà du forfait' : 'aucune surconsommation'}</small></div><div class="tile"><span>Puces actives</span><b>${d.act} / ${d.l.length}</b></div><div class="tile ${idleL.length?'bad':''}"><span>Sans consommation</span><b>${idleL.length}</b><small>puce(s)</small></div></div><h4 class="dh">Puces ${d.op}</h4>${simTable(d.l.slice().sort((a,b)=>per(a).v-per(b).v), 'simple')}`); });
}

/* ======================= 6. Statistiques ======================= */
function renderStats(){
  const L = sims();
  const rows = OFFERS.map(o=>({lab:`${o.name} · ${o.op}`, id:o.id, l:L.filter(s=>s.offer===o.id)})).filter(r=>r.l.length);
  const max = Math.max(...rows.map(r=>r.l.length));
  $('#svSub').textContent = `Pour chaque offre : puces installées / total · cliquez sur une offre`;
  $('#svRows').innerHTML = rows.map(r=>{ const i = r.l.filter(s=>s.installed).length, n = r.l.length - i;
    return `<button class="hrow" data-sv="${r.id}"><span>${r.lab}</span><div class="tr" style="width:${r.l.length/max*100}%">${i?`<i style="flex:${i};background:#2563EB"></i>`:''}${n?`<i style="flex:${n};background:#D97706"></i>`:''}</div><span class="num">${i} / ${r.l.length}</span></button>`; }).join('');
  $$('#svRows [data-sv]').forEach(b=>b.onclick=()=>{ const r = rows.find(x=>x.id===b.dataset.sv), i = r.l.filter(s=>s.installed).length; modal(`${r.lab} · ${i} installée(s) sur ${r.l.length}`, simTable(r.l.slice().sort((a,b)=>a.installed-b.installed), 'simple')); });
  // statut : deux états seulement
  const parts = [['ins','Installée','#2563EB',L.filter(s=>s.installed)],['non','Non installée','#D97706',L.filter(s=>!s.installed)]].filter(p=>p[3].length);
  $('#stSub').textContent = `${L.filter(s=>s.installed).length} puce(s) sur ${L.length} sont dans un équipement posé · cliquez sur une couleur`;
  $('#stBar').innerHTML = parts.map(p=>`<button data-sp="${p[0]}" style="flex:${p[3].length};background:${p[2]}" title="${p[1]} : ${p[3].length} puce(s)">${p[3].length} · ${pct(p[3].length,L.length)} %</button>`).join('');
  $('#stLeg').innerHTML = parts.map(p=>`<span><i class="dot" style="background:${p[2]}"></i>${p[1]} : ${p[3].length} puce(s)</span>`).join('');
  $$('#stBar [data-sp]').forEach(b=>b.onclick=()=>{ const p = parts.find(x=>x[0]===b.dataset.sp); modal(`${p[1]} · ${p[3].length} puce(s)`, simTable(p[3], 'simple')); });
  renderEvol();
}
/* Évolution de la consommation, janvier → mois en cours : une courbe par revendeur (vue revendeur : par client) ;
   le filtre isole une courbe en barres avec la ligne du forfait des puces installées (orange = au-dessus du forfait) */
let EVSEL = '';
const EVCOL = ['#2563EB','#D97706','#059669','#7C3AED','#DB2777','#0891B2','#65A30D','#B45309','#4F46E5','#DC2626','#0D9488','#9333EA'];
function evSeries(){
  const L = sims(), byCli = !!(VIEW || NET);
  const keys = byCli ? [...new Set(L.map(s=>s.client))] : RESELLERS.filter(r=>L.some(s=>s.reseller===r));
  return keys.map(k=>{ const l = L.filter(s=>byCli ? s.client===k : s.reseller===k);
    const m = MOIS.map((_,i)=> i > CUR ? null : l.reduce((t,s)=>t + (offerOf(s) ? mVal(s,i) : 0), 0));
    const q = l.filter(s=>s.installed && offerOf(s)).reduce((t,s)=>t+offerOf(s).quota, 0);
    const over = i => l.reduce((t,s)=>t + (offerOf(s) && s.m ? Math.max(0, mVal(s,i) - offerOf(s).quota) : 0), 0);
    return {k, lab: byCli ? k : netLabel(k), l, m, q, over}; })
    .sort((a,b)=>(b.m[Math.max(0,CUR-1)]||0)-(a.m[Math.max(0,CUR-1)]||0)).map((x,i)=>({...x, c:EVCOL[i % EVCOL.length]}));
}
function renderEvol(){
  const S = evSeries(), byCli = !!(VIEW || NET);
  $('#evLab').textContent = byCli ? 'Client' : 'Revendeur';
  if (!S.some(x=>x.k===EVSEL)) EVSEL = '';
  $('#evSel').innerHTML = `<option value="">${byCli ? 'Tous les clients' : 'Tous les revendeurs'}</option>` + S.map(x=>`<option value="${x.k}">${x.lab}</option>`).join('');
  $('#evSel').value = EVSEL;
  const one = EVSEL ? S.find(x=>x.k===EVSEL) : null;
  const W = 600, H = 238, pl = 52, pr = 8, pt = 16, pb = 34, xw = (W-pl-pr)/12, x = i => pl + xw*i + xw/2;
  const max = Math.max(1, ...(one ? [one.q, ...one.m.map(v=>v||0)] : S.flatMap(x=>x.m.map(v=>v||0)))) * 1.12;
  const y = v => pt + (H-pt-pb) * (1 - v/max);
  let g = [0,.25,.5,.75,1].map(f=>`<line x1="${pl}" x2="${W-pr}" y1="${y(max*f)}" y2="${y(max*f)}" stroke="#EEF1F6"/><text x="${pl-6}" y="${y(max*f)+3}" text-anchor="end" class="evt">${f ? vol(max*f) : '0'}</text>`).join('');
  if (one) {
    g += one.m.map((v,i)=>v==null ? '' : `<rect x="${x(i)-xw*.3}" y="${y(v)}" width="${xw*.6}" height="${Math.max(0,y(0)-y(v))}" rx="3" fill="${v > one.q ? '#D97706' : '#2563EB'}" opacity="${i===CUR ? .35 : 1}"/><text x="${x(i)}" y="${y(v)-4}" text-anchor="middle" class="evt">${(v/1024).toFixed(0)}</text>`).join('');
    g += `<line x1="${pl}" x2="${W-pr}" y1="${y(one.q)}" y2="${y(one.q)}" stroke="#1E293B" stroke-dasharray="5 4"/>`;
    // pics de surconsommation : marque rouge au-dessus des 3 mois les plus dépassés, montant sur le plus haut
    const ov = MOIS.map((_,i)=>i > CUR ? 0 : one.over(i)), top = ov.map((o,i)=>[o,i]).filter(p=>p[0]).sort((a,b)=>b[0]-a[0]).slice(0,3).map(p=>p[1]);
    g += top.map((i,r)=>`<path d="M${x(i)-5} ${y(one.m[i])-24}h10l-5 7z" fill="#DC2626"><title>${MOIS[i]} : +${vol(ov[i])} au-delà du forfait</title></path><text x="${x(i)}" y="${y(one.m[i])-28}" text-anchor="middle" class="evo" style="font-size:${r ? 9 : 10.5}px">+${vol(ov[i])}</text>`).join('');
  } else {
    g += S.map(sr=>{ const pts = sr.m.map((v,i)=>v==null ? null : [x(i), y(v)]).filter(Boolean);
      const done = pts.slice(0, CUR), part = pts.slice(Math.max(0, CUR-1));   // mois en cours partiel : pointillé
      return `<polyline points="${done.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${sr.c}" stroke-width="2.2" stroke-linejoin="round"/>` + (part.length > 1 ? `<polyline points="${part.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${sr.c}" stroke-width="1.6" stroke-dasharray="3 4" opacity=".6"/>` : '') + pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${i===CUR?'#fff':sr.c}" stroke="${sr.c}"/>`).join(''); }).join('');
    // pics de surconsommation : un anneau rouge sur le mois le plus dépassé de chaque revendeur (étiquette au-dessus / au-dessous en alternance)
    g += S.map((sr,k)=>{ const ov = MOIS.map((_,i)=>i > CUR ? 0 : sr.over(i)), o = Math.max(...ov), i = ov.indexOf(o); if (!o) return '';
      return `<circle cx="${x(i)}" cy="${y(sr.m[i])}" r="7" fill="none" stroke="#DC2626" stroke-width="2.2"><title>${sr.lab} · ${MOIS[i]} : +${vol(o)} au-delà du forfait</title></circle><text x="${x(i)}" y="${y(sr.m[i]) + (k % 2 ? 20 : -12)}" text-anchor="middle" class="evo">+${vol(o)}</text>`; }).join('');
  }
  // le plus gros pic de la vue, écrit sous le titre
  const peaks = (one ? [one] : S).flatMap(sr=>MOIS.map((_,i)=>i > CUR ? null : {sr, i, o:sr.over(i)})).filter(p=>p && p.o).sort((a,b)=>b.o-a.o);
  g += MOIS.map((m,i)=>`<text x="${x(i)}" y="${H-16}" text-anchor="middle" class="evt${i > CUR ? ' fut' : ''}">${m.replace('.','')}</text>${i===CUR ? `<text x="${x(i)}" y="${H-4}" text-anchor="middle" class="evt" style="font-size:9px">en cours</text>` : ''}`).join('');
  g += MOIS.map((m,i)=>i > CUR ? '' : `<rect class="evhit" data-evm="${i}" x="${pl+xw*i}" y="${pt}" width="${xw}" height="${H-pt-pb}"><title>${m} : cliquez pour le détail</title></rect>`).join('');
  $('#evChart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="evsvg" role="img" aria-label="Évolution de la consommation par mois">${g}</svg>`;
  $('#evSub').innerHTML = (one ? `${one.lab} · forfait des puces installées : ${vol(one.q)} / mois` : `${byCli ? 'Un trait par client' : 'Un trait par revendeur'} · janv. → ${MOIS[CUR]} ${TODAY.getFullYear()}`)
    + (peaks.length ? `<br><span class="ov-t">Pic de surconsommation : ${MOIS[peaks[0].i]} · ${peaks[0].sr.lab} +${vol(peaks[0].o)}</span>` : '');
  $('#evLeg').innerHTML = one
    ? `<span><i class="dot" style="background:#2563EB"></i>Dans le forfait</span><span><i class="dot" style="background:#D97706"></i>Au-dessus du forfait</span><span><i class="tri"></i>Pics de surconsommation</span><span>┄ forfait</span><button class="evk" data-evk="">← ${byCli ? 'tous les clients' : 'tous les revendeurs'}</button>`
    : S.map(sr=>`<button class="evk" data-evk="${sr.k}"><i class="dot" style="background:${sr.c}"></i>${sr.lab}</button>`).join('') + '<span><i class="ring"></i>Pic de surconsommation du revendeur</span>';
  $$('#evLeg [data-evk]').forEach(b=>b.onclick=()=>{ EVSEL = b.dataset.evk; renderEvol(); });
  // clic sur un mois : tableau simple du mois (revendeurs, ou clients du revendeur choisi)
  $$('#evChart [data-evm]').forEach(r=>r.onclick=()=>{ const i = +r.dataset.evm;
    const rows = one && !byCli ? [...new Set(one.l.map(s=>s.client))].map(c=>{ const l = one.l.filter(s=>s.client===c);
        return {lab:c, v:l.reduce((t,s)=>t+(offerOf(s) ? mVal(s,i) : 0),0), q:l.filter(s=>s.installed && offerOf(s)).reduce((t,s)=>t+offerOf(s).quota,0), o:l.reduce((t,s)=>t+(offerOf(s) && s.m ? Math.max(0, mVal(s,i)-offerOf(s).quota) : 0),0)}; })
      : (one ? [one] : S).map(sr=>({lab:sr.lab, v:sr.m[i], q:sr.q, o:sr.over(i)}));
    rows.sort((a,b)=>b.v-a.v);
    modal(`Consommation · ${MOIS[i]} ${TODAY.getFullYear()}${one ? ' · ' + one.lab : ''}`, `<table><thead><tr><th>${one && !byCli || byCli ? 'Client' : 'Revendeur'}</th><th>Consommation</th><th>Forfait</th><th>Dépassement</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${x.lab}</b></td><td class="num">${vol(x.v)}</td><td class="num">${vol(x.q)}</td><td class="num ${x.o ? 'ov-t' : ''}">${x.o ? '+' + vol(x.o) : '—'}</td></tr>`).join('')}</tbody></table>`); });
}
$('#evSel').onchange = e=>{ EVSEL = e.target.value; renderEvol(); };

/* ======================= Cloche + alerte en temps réel ======================= */
// clients dont au moins une puce dépasse son forfait sur la période affichée (en production : à chaque relevé de consommation)
function overClients(){
  const L = sims().filter(s=>per(s).over > 0), by = {};
  L.forEach(s=>{ (by[s.client] = by[s.client] || {client:s.client, reseller:s.reseller, l:[], over:0}); by[s.client].l.push(s); by[s.client].over += per(s).over; });
  const mins = [3, 12, 27, 45, 70, 95, 130, 180];
  return Object.values(by).sort((a,b)=>b.over-a.over).map((c,i)=>({...c, when: i < mins.length ? `il y a ${mins[i]} min` : 'aujourd’hui'}));
}
let TOAST_DONE = false;
function liveAlert(){   // notification « temps réel » : le client qui dépasse le plus son forfait ce mois-ci
  const c = overClients()[0]; if (!c || TOAST_DONE) return; TOAST_DONE = true;
  const s = c.l.slice().sort((a,b)=>per(b).over-per(a).over)[0];
  $('#toast').innerHTML = `<div class="toast" role="status"><span class="live">En direct</span><div><b>${c.client} dépasse son forfait</b><small>${netLabel(c.reseller)} · puce ${s.num} (ID ${s.id}) · +${vol(per(s).over)} au-delà de ${vol(per(s).q)}${c.l.length > 1 ? ` · ${c.l.length} puces concernées` : ''}</small></div><button class="btn" data-t="see">Voir</button><button class="x" data-t="x" aria-label="Fermer">×</button></div>`;
  $('#toast [data-t=see]').onclick = ()=>{ $('#toast').innerHTML = ''; modal(`${c.client} · puces au-delà du forfait · ${perLabel()}`, `<p class="note" style="margin-top:0">${netLabel(c.reseller)} · +${vol(c.over)} au-delà du forfait. L’alerte part dès qu’une puce dépasse son forfait.</p>${simTable(c.l, 'over')}`); };
  $('#toast [data-t=x]').onclick = ()=>{ $('#toast').innerHTML = ''; };
}
/* ======================= Cloche ======================= */
function renderBell(){
  const L = sims(), paid = L.filter(s=>s.detail==='paid'), high = L.filter(s=>alertOf(s)==='high'), low = L.filter(s=>alertOf(s)==='low' && s.detail!=='paid');
  // clients en surconsommation (mois en cours, en temps réel) : en tête de la cloche
  const ovc = overClients();
  const items = [
    ...ovc.slice(0,5).map(c=>({c:'#DC2626', t:`${c.client} : ${c.l.length} puce(s) au-delà du forfait`, s:`${netLabel(c.reseller)} · +${vol(c.over)} · ${c.when}`, id:c.l[0].id})),
    ...paid.slice(0,5).map(s=>({c:'#DC2626', t:`${s.client} : puce payée sans équipement`, s:`${s.num} · ${tnd(priceOf(s))} / mois · ${s.reseller}`, id:s.id})),
    ...high.slice(0,5).map(s=>({c:'#D97706', t:`${s.client} : ${pct(s.d30,offerOf(s).quota)} % du forfait`, s:`${s.num} · ${vol(s.d30)} / ${vol(offerOf(s).quota)}`, id:s.id})),
    ...low.slice(0,5).map(s=>({c:'#DC2626', t:`${s.client} : puce muette`, s:`${s.num} · ${daysNoService(s)} j sans service`, id:s.id}))];
  const total = ovc.length + paid.length + high.length + low.length;
  $('#bellCnt').textContent = total;
  $('#bpanel').innerHTML = `<div class="bh"><b>Alertes</b><span>${total} à traiter · ${ovc.length} client(s) en surconsommation · ${paid.length} payées sans équipement · ${high.length} ≥ 80 % · ${low.length} muettes</span></div><ul>${items.map(it=>`<li data-bi="${it.id}"><i style="background:${it.c}"></i><div>${it.t}<small>${it.s}</small></div><span class="go">Voir →</span></li>`).join('')}
    <li data-all="1"><i style="background:#94A3B8"></i><div>Voir toutes les alertes<small>liste complète paginée</small></div><span class="go">→</span></li></ul>`;
  $$('#bpanel [data-bi]').forEach(li=>li.onclick=()=>{ $('#bpanel').classList.add('hidden'); openSim(+li.dataset.bi); });
  $('#bpanel [data-all]').onclick = ()=>{ $('#bpanel').classList.add('hidden'); openCard('al'); };
}

/* ======================= Rendu + contrôles ======================= */
function fillFilters(){
  const L = sims(), opt = (v,l=v) => `<option value="${v}">${l}</option>`;
  $('#fOf').innerHTML = opt('','Toutes') + OFFERS.map(o=>opt(o.id, `${o.name} · ${o.op}`)).join('');
  $('#fOp').innerHTML = opt('','Tous') + [...new Set(OFFERS.map(o=>o.op))].map(o=>opt(o)).join('');
  $('#fRe').innerHTML = opt('','Tous') + RESELLERS.filter(r=>L.some(s=>s.reseller===r)).map(r=>opt(r, r==='Tunav' ? 'Tunav (clients directs)' : r)).join('');
  $('#fCl').innerHTML = opt('','Tous') + [...new Set(L.filter(s=>!F.re || s.reseller===F.re).map(s=>s.client))].sort().map(c=>opt(c)).join('');
  $('#pNet').innerHTML = opt('', VIEW ? `Revendeur ${VIEW}` : 'Tout le réseau') + (VIEW ? '' : RESELLERS.map(r=>opt(r, netLabel(r))).join('')); $('#pNet').value = NET;
  $('#pMonth').innerHTML = MOIS.slice(0, CUR+1).map((m,i)=>`<option value="${i}" ${i===MONTH?'selected':''}>${m} ${TODAY.getFullYear()}${i===CUR?' (en cours)':''}</option>`).join('');
}
function renderAll(){
  $('#todayTxt').textContent = fmtD(TODAY);
  const L = sims();
  $('#pVs').innerHTML = `Période : <b>${perLabel()}</b>${PER==='7'||PER==='30' ? ' (estimée à partir de Data 30 j)' : ''} · ${NET ? `réseau <b>${netLabel(NET)}</b> · ${L.length} puces` : VIEW ? `vue revendeur <b>${VIEW}</b> · ${L.length} puces` : `<b>${L.length} puces</b> : Tunav ${L.filter(s=>s.reseller==='Tunav').length} · revendeurs ${L.filter(s=>s.reseller!=='Tunav').length}`}`;
  renderCards(); renderOffers(); renderTable(); renderMonth(); renderOperators(); renderStats(); renderBell();
}
$('#fQ').oninput = e=>{ F.q = e.target.value.trim().toLowerCase(); PG.rows && (PG.rows.page = 0); renderTable(); };
[['#fSt','st'],['#fOf','of'],['#fOp','op'],['#fCl','cl'],['#fAl','al']].forEach(([id,k])=>$(id).onchange = e=>{ F[k] = e.target.value; PG.rows && (PG.rows.page = 0); renderTable(); });
$('#fRe').onchange = e=>{ F.re = e.target.value; F.cl = ''; fillFilters(); $('#fRe').value = F.re; PG.rows && (PG.rows.page = 0); renderTable(); };
$('#pMonth').onchange = e=>{ MONTH = +e.target.value; renderAll(); };
$$('#pPer button').forEach(b=>b.onclick=()=>{ PER = b.dataset.p; $$('#pPer button').forEach(x=>x.classList.toggle('on', x===b)); $('#pMonthW').classList.toggle('hidden', PER!=='m'); renderAll(); });
$('#pNet').onchange = e=>{ NET = e.target.value; F.re = ''; F.cl = ''; OPEN_RES.clear(); Object.keys(PG).forEach(k=>PG[k].page = 0); fillFilters(); renderAll(); };
$('#mQ').oninput = e=>{ MQ = e.target.value.trim(); PG['month-'+BY] && (PG['month-'+BY].page = 0); renderMonth(); };
$('#mFilt').onchange = e=>{ MFILT = e.target.value; PG['month-'+BY] && (PG['month-'+BY].page = 0); renderMonth(); };
$$('#mBy button').forEach(b=>b.onclick=()=>{ BY = b.dataset.by; $$('#mBy button').forEach(x=>x.classList.toggle('on', x===b)); renderMonth(); });
$('#pView').onchange = e=>{ VIEW = e.target.value; NET = ''; OPEN_RES.clear(); F.re = ''; F.cl = ''; Object.keys(PG).forEach(k=>PG[k].page = 0); fillFilters(); renderAll(); };
$('#btnOffers').onclick = ()=>modal('Offres puce', `<table><thead><tr><th>Offre</th><th>Opérateur</th><th>Type</th><th>Forfait / mois</th><th>Prix / puce / mois</th><th>Puces</th><th>Installées</th><th>Coût / mois</th></tr></thead><tbody>${OFFERS.map(o=>{ const l = sims().filter(s=>s.offer===o.id); return `<tr><td><b>${o.name}</b></td><td>${o.op}</td><td>${o.type}</td><td class="num">${vol(o.quota)}</td><td class="num">${tnd(o.price)}</td><td class="num">${l.length}</td><td class="num">${l.filter(s=>s.installed).length}</td><td class="num">${tnd(costOf(l))}</td></tr>`; }).join('')}</tbody></table>`);
$('#bell').onclick = e=>{ e.stopPropagation(); $('#bpanel').classList.toggle('hidden'); };
__on('click', e=>{ if (!e.target.closest('#bpanel') && !e.target.closest('#bell')) $('#bpanel').classList.add('hidden'); });
__on('keydown', e=>{ if (e.key==='Escape') $('#modal').innerHTML = ''; });
fillFilters(); renderAll();
// lien depuis le Tableau de bord : ?rev=<revendeur>&conso=over → réseau choisi, consommation « Avec surconsommation », défilement jusqu'au tableau
{ const q = new URLSearchParams(location.search), rev = q.get('rev'), cf = q.get('conso');
  if (rev && [...$('#pNet').options].some(o => o.value === rev)) { $('#pNet').value = rev; $('#pNet').dispatchEvent(new Event('change')); }
  if (cf && [...$('#mFilt').options].some(o => o.value === cf)) { $('#mFilt').value = cf; $('#mFilt').dispatchEvent(new Event('change')); }
  if (rev || cf) setTimeout(() => $('#conso').scrollIntoView({ behavior:'smooth' }), 300); }
setTimeout(liveAlert, 1500);

  if (typeof opts.after === 'function') opts.after({ setView: typeof setView === 'function' ? setView : null });
  return () => {
    __listeners.forEach(([t, f, c]) => document.removeEventListener(t, f, c));
    __timers.forEach((id) => { window.clearTimeout(id); window.clearInterval(id); });
  };
}
