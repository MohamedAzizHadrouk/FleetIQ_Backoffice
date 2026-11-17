/* eslint-disable */
// @ts-nocheck
/**
 * Script de la maquette validée Clients-v3.html (FleetAdmin-maquettes v3), généré par scripts/port-maquette.py.
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
    get pathname() { return '/Clients-v3.html'; },
    get search() { return opts.search || ''; },
    get hash() { return ''; },
    set href(v) { if (opts.navigate) opts.navigate(v); },
    replace: (v) => { if (opts.navigate) opts.navigate(v); },
    reload: () => {}
  };

/* ---------------- Données fictives (alignées sur la capture actuelle) ---------------- */
// Données fictives écrites pour le 19/10/2026, recalées sur la date du jour à l'ouverture
const DATA_DATE = new Date('2026-10-19T12:00:00');
let TODAY = new Date(); TODAY.setHours(12,0,0,0);
const REAL_TODAY = new Date(TODAY);
const PACKS = [
  {id:1, name:'FleetIQ Secure',   color:'#2563eb'},
  {id:2, name:'FleetIQ Pro',      color:'#4f46e5'},
  {id:3, name:'FleetIQ Mechanic', color:'#d97706'},
  {id:4, name:'FleetIQ Vision',   color:'#059669'},
];
// eq: [serial, dateAffectation(DateContract), dateFirstSend|null, lastPosition|null]
// CLIENTS = clients visibles par le compte connecté (tous pour le super admin Tunav, ceux du revendeur sinon)
const ALL_CLIENTS = [
  {id:12, name:'Distribution Nord',   reseller:'Tunav', rev:false, pack:2, blocked:true,  exp:'2026-09-30', last:'2026-01-05T01:00', eq:[['863719061234501','2025-12-10',null,null]]},
  {id:14, name:'Fret International',  reseller:'Tunav', rev:false, pack:1, blocked:false, exp:'2026-11-20', last:'2026-10-14T09:12', eq:[['863719061234502','2026-02-01','2026-02-03','2026-10-19T08:40'],['863719061234503','2026-06-15','2026-06-16','2026-10-02T17:05']]},
  {id:15, name:'Livraison Rapide',    reseller:'MyCom', rev:false, pack:null, blocked:true, exp:'2026-08-15', last:null, eq:[]},
  {id:16, name:'Logistique Sud',      reseller:'MyCom', rev:false, pack:2, blocked:false, exp:'2027-03-31', last:'2026-04-01T01:00', eq:[['863719061234504','2026-03-20','2026-03-22','2026-10-19T07:55']]},
  {id:17, name:'MyCom',               reseller:'Tunav', rev:true,  pack:1, blocked:false, exp:'2026-12-31', last:'2026-10-17T15:30', eq:[['863719061234505','2026-01-12','2026-01-13','2026-10-19T09:01'],['863719061234506','2026-01-12','2026-01-14','2026-10-18T22:10'],['863719061234507','2026-05-03','2026-05-04','2026-10-19T06:30']]},
  {id:18, name:'Société Médicale ABC',reseller:'Tunav', rev:false, pack:3, blocked:false, exp:'2026-12-05', last:'2025-04-10T01:00', eq:[['863719061234508','2025-03-01','2025-03-02','2026-10-19T05:20'],['863719061234509','2025-03-01','2025-03-03','2026-07-28T11:45']]},
  {id:19, name:'Agri Transport Béja', reseller:'Tunav', rev:false, pack:4, blocked:false, exp:'2027-09-30', last:'2026-10-18T10:05', eq:[['863719061234510','2026-10-01','2026-10-02','2026-10-19T08:15'],['863719061234511','2026-10-01','2026-10-02','2026-10-19T08:16'],['863719061234512','2026-10-01','2026-10-03','2026-10-19T07:59']]},
  {id:20, name:'Transport Sahel',     reseller:'MyCom', rev:false, pack:1, blocked:false, exp:'2026-11-08', last:'2026-09-02T14:20', eq:[['863719061234513','2026-08-25',null,null],['863719061234514','2026-08-25',null,null]]},
  {id:21, name:'BTP Carthage',        reseller:'Tunav', rev:false, pack:2, blocked:false, exp:'2027-02-28', last:'2026-10-16T08:45', eq:[['863719061234515','2026-04-11','2026-04-12','2026-10-19T09:10'],['863719061234516','2026-04-11','2026-04-12','2026-10-18T19:40']]},
];
// VIEW : '' = super admin Tunav, sinon nom du revendeur connecté · OWNER : filtre propriétaire de toute la page (super admin)
let CLIENTS = ALL_CLIENTS, VIEW = '', OWNER = '';

/* ---------------- Helpers ---------------- */
const $ = s => document.querySelector(s);
const DAY = 864e5;
const d0 = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const fmtD = s => s ? new Date(s).toLocaleDateString('fr-FR') : '—';
const fmtDT = s => s ? new Date(s).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const daysSince = s => Math.floor((d0(TODAY) - d0(s)) / DAY);
const daysUntil = s => Math.round((d0(s) - d0(TODAY)) / DAY);
const pct = (a,b) => b ? Math.round(a*100/b) : 0;
const packOf = id => PACKS.find(p => p.id === id);

// Un seul délai (filtre « Délai » de À traiter) pour l'échéance et l'inactivité ; 30 j à l'ouverture
const P = { renew:30, inact:30, hours:24, pctOff:50 };
const F = { search:'', type:'', status:'', pack:'', conn:'', alert:'' };

// Blocage 30 j après la date d'expiration : entre l'échéance et le blocage, le client (ou revendeur) reste actif
const GRACE = 30;
const isActive = c => !c.blocked && (!c.exp || daysUntil(c.exp) >= -GRACE);
const inGrace = c => !c.blocked && !!c.exp && daysUntil(c.exp) < 0 && daysUntil(c.exp) >= -GRACE;
const blockIn = c => GRACE + daysUntil(c.exp);                                      // jours restants avant le blocage
const blockDate = c => { const d = new Date(c.exp.length === 10 ? c.exp + 'T12:00:00' : c.exp); d.setDate(d.getDate() + GRACE); return d; };
const eqConnected = e => !!e[3] && (TODAY - new Date(e[3])) <= P.hours * 36e5;
const connCount = c => c.eq.filter(eqConnected).length;
const neverSent = e => !e[2];

/* ---------------- Règles des alertes (cf. documentation) ---------------- */
const ALERTS = [
  { id:'grace', ref:'A-04', tag:['Blocage','red'], title:()=>`Bloqués dans ≤ ${GRACE} j`,
    test:inGrace, desc:list => list.length ? `premier : dans ${Math.min(...list.map(blockIn))} j` : 'aucun blocage proche', unit:'client(s)' },
  { id:'renew', ref:'A-01', tag:['Échéance','amber'], title:()=>`Échéance ≤ ${P.renew} j`,
    test:c => isActive(c) && c.exp && daysUntil(c.exp) >= 0 && daysUntil(c.exp) <= P.renew,
    desc:list => list.length ? `première : ${list.map(c=>daysUntil(c.exp)).sort((a,b)=>a-b)[0]} j` : 'aucune échéance proche', unit:'client(s)' },
  { id:'inact', ref:'A-02', tag:['Relance','amber'], title:()=>`Sans connexion > ${P.inact} j`,
    test:c => isActive(c) && (!c.last || daysSince(c.last) > P.inact),
    desc:() => 'clients actifs uniquement', unit:'client(s)' },
];

/* ---------------- Comparaison optionnelle (bouton « Comparer ») ---------------- */
const CMPC = { on:false, mode:'30', date:'' };
const refDate = () => CMPC.mode==='year' ? new Date(TODAY.getFullYear()-1, TODAY.getMonth(), TODAY.getDate(), 12)
  : CMPC.mode==='custom' && CMPC.date ? new Date(CMPC.date+'T12:00:00') : new Date(TODAY.getTime() - 30*DAY);
const existsAt = (c,D) => !c.since || d0(c.since) <= d0(D);
const activeAt = (c,D) => existsAt(c,D) && !(c.blockedOn && d0(c.blockedOn) <= d0(D)) && !(c.blocked && !c.blockedOn) && (!c.exp || (d0(D) - d0(c.exp)) / DAY <= GRACE);
const dlt = (n, p, inverse=false) => { const v = n - p; if (!v) return ' <span class="dlt eq">= 0</span>';
  const good = inverse ? v < 0 : v > 0; return ` <span class="dlt ${good?'pos':'neg'}">${v>0?'+':''}${v}</span>`; };

/* ---------------- Détail d'une carte « À traiter » ---------------- */
function openAlert(id){
  const a = ALERTS.find(x=>x.id===id), list = CLIENTS.filter(a.test);
  // colonnes selon la carte : ce qui explique pourquoi le client est dans la liste
  const COLS = {
    grace:{ h:['Client','Expiré le','Bloqué le','Reste'], row:c=>[c.name + (c.rev ? ' <small class="note">revendeur</small>' : '') + ownSmall(c), fmtD(c.exp), blockDate(c).toLocaleDateString('fr-FR'), `<span class="ago ${blockIn(c)<=10?'bad':'warn'}">dans ${blockIn(c)} j</span>`],
            sort:(x,y)=>blockIn(x)-blockIn(y) },
    renew:{ h:['Client','Pack','Échéance','Reste'], row:c=>{ const du = daysUntil(c.exp); return [c.name + ownSmall(c), packsHtml(c), fmtD(c.exp), `<span class="ago ${du<=10?'bad':'warn'}">J-${du}</span>`]; },
            sort:(x,y)=>daysUntil(x.exp)-daysUntil(y.exp), dec:'Lancer la relance de renouvellement ; à 10 jours, valider le paiement.' },
    inact:{ h:['Client','Dernière connexion','Depuis'], row:c=>[c.name + ownSmall(c), c.last ? fmtD(c.last) : 'jamais', c.last ? `<b style="color:var(--red)">${daysSince(c.last)} j</b>` : '—'],
            sort:(x,y)=>(x.last?daysSince(x.last):1e9) < (y.last?daysSince(y.last):1e9) ? 1 : -1, dec:'Appeler le client : proposer une formation ou une démonstration de son pack.' },
  }[id];
  const rows = list.slice().sort(COLS.sort);
  $('#modal').innerHTML = `<div class="ov" id="ov"><div class="modal" role="dialog" aria-modal="true" style="max-width:620px">
    <div class="mh"><h3>${a.title()} <span class="tag ${a.tag[1]}" style="vertical-align:middle;margin-left:6px">${a.tag[0]}</span></h3><button class="x" data-x aria-label="Fermer">×</button></div>
    <div class="mb">
      <p class="dl" style="margin-top:0"><b>${fmtN(rows.length)} client(s)</b>${splitOwners(rows) ? ` · ${splitOwners(rows)}` : ''} · cliquez sur un client pour ouvrir sa fiche</p>
      ${rows.length ? `<table class="ft-t al-t"><thead><tr>${COLS.h.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(c=>`<tr data-oc="${c.id}">${COLS.row(c).map((v,i)=>`<td>${i===0?`<b>${v}</b>`:v}</td>`).join('')}</tr>`).join('')}</tbody></table>`
        : '<p class="note" style="text-align:center;padding:16px">Aucun client avec ce délai.</p>'}
    </div>
    <div class="mf"><button class="btn" data-filt="${id}">Filtrer le tableau</button><button class="btn primary" data-x>Fermer</button></div></div></div>`;
  $('#ov').onclick = e => { if (e.target.id==='ov' || e.target.closest('[data-x]')) $('#modal').innerHTML = ''; };
  $('#modal [data-filt]').onclick = ()=>{ $('#modal').innerHTML = ''; F.alert = id; renderAll(); $('#rows').scrollIntoView({behavior:'smooth', block:'start'}); };
}

/* ---------------- Rendu KPI ---------------- */
function renderKpis(){
  const total = CLIENTS.length, rev = CLIENTS.filter(c=>c.rev).length;
  const act = CLIENTS.filter(isActive).length, blk = total - act;
  const eqAll = CLIENTS.flatMap(c=>c.eq), eqOn = eqAll.filter(eqConnected).length;
  // comparaison optionnelle : mêmes règles recalculées à la date de comparaison
  let dT = '', dA = '', dB = '';
  if (CMPC.on){ const R = refDate(), totR = CLIENTS.filter(c=>existsAt(c,R)).length, actR = CLIENTS.filter(c=>activeAt(c,R)).length;
    dT = dlt(total, totR); dA = dlt(act, actR); dB = dlt(blk, totR-actR, true); }
  // cartes du haut : clients visibles (réseau complet, revendeur connecté ou propriétaire filtré)
  const net = netData(), nRev = rev, eqT = CLIENTS.filter(c=>!c.rev).reduce((t,c)=>t+c.eq.length,0);
  $('#k01').innerHTML = `${fmtN(total)}${dT}`;
  $('#k01s').textContent = VIEW ? `clients de ${VIEW} · ${fmtN(eqT)} équip.` : nRev ? `dont ${nRev} revendeur(s) · ${fmtN(eqT)} équip.` : `${fmtN(eqT)} équip.`;
  $('#k02').innerHTML = `<span style="color:var(--green)">${fmtN(act)}</span> <small class="of">actifs</small>${dA} <span style="color:#CBD5E1;font-weight:400">·</span> <span style="color:var(--red)">${fmtN(blk)}</span> <small class="of">bloqués</small>${dB}`;
  $('#k02m').innerHTML = `<i style="width:${pct(act,total)}%;background:var(--green)"></i><i style="width:${pct(blk,total)}%;background:var(--red)"></i>`;
  // parc équipements : clients finaux (le parc des revendeurs eux-mêmes n'est pas compté)
  const eP = eqPool(), eTot = eP.reduce((t,c)=>t+c.n,0), eqOff = eP.reduce((t,c)=>t+c.offN,0), eOn = eTot - eqOff;
  $('#k04').innerHTML = `${fmtN(eOn)} <small style="color:var(--muted);font-weight:400">/ ${fmtN(eTot)}</small> <small class="up">${pct(eOn,eTot)} %</small>`;
  $('#k04m').innerHTML = `<i style="width:${pct(eOn,eTot)}%;background:var(--green)"></i><i style="width:${pct(eqOff,eTot)}%;background:var(--red)"></i>`;
  $('#k04s').innerHTML = `connectés · <b style="color:var(--red)">${fmtN(eqOff)}</b> hors ligne`;

  $('#alerts').innerHTML = ALERTS.map(a=>{
    const list = CLIENTS.filter(a.test);
    const n = a.count ? a.count(list) : list.length;
    // carte courte : titre + chiffre + répartition par propriétaire (super admin) ; le clic ouvre la liste
    return `<button class="al short${F.alert===a.id?' on':''}" data-alert="${a.id}" title="${list.slice(0,10).map(c=>c.name).join(', ')}${list.length > 10 ? '…' : ''}">
      <div class="row1"><span class="t">${a.title()}</span><span class="tag ${a.tag[1]}">${a.tag[0]}</span></div>
      <div class="n">${fmtN(n)} <span class="d">${a.unit}</span></div>${splitOwners(list) ? `<div class="who">${splitOwners(list)}</div>` : ''}</button>`;
  }).join('');
  document.querySelectorAll('#alerts [data-alert]').forEach(b=>b.onclick=()=>openAlert(b.dataset.alert));

  // D-01 pack bars
  // une seule barre par pack : longueur = équipements (même échelle pour tous), un bloc = un client
  // un client à plusieurs packs a un bloc dans chacun de ses packs (avec les équipements de ce pack)
  const rows = PACKS.map(p=>({id:p.id,name:p.name,color:p.color,cls:CLIENTS.filter(c=>hasPack(c,p.id))}));
  rows.forEach(r=>{ const n = c => r.id ? eqOfPack(c,r.id).length : c.eq.length; r.n = n;
    r.cls.sort((a,b)=>n(b)-n(a)||a.name.localeCompare(b.name)); r.cl = r.cls.length; r.eq = r.cls.reduce((t,c)=>t+n(c),0); });
  const maxEq = Math.max(1,...rows.map(r=>r.eq)), plur = (n,s) => `${n} ${s}${n>1?'s':''}`;
  $('#packBars').innerHTML = rows.sort((a,b)=>b.eq-a.eq||b.cl-a.cl).map(r=>`
    <div class="b clk" role="button" tabindex="0" data-pk="${r.id||'none'}" aria-label="Voir les clients du pack ${r.name}"><span><i class="dot" style="background:${r.color}"></i>${r.name}</span>
      <div class="track pbar1"><i style="width:${r.eq/maxEq*100}%;background:${r.color}"></i></div>
      <span class="num">${fmtN(r.cl)} client${r.cl>1?'s':''} · ${fmtN(r.eq)} équip.</span></div>`).join('');
  $('#packLeg').innerHTML = '';   // le détail (clients, équipements) s'ouvre au clic sur la ligne

  // D-02 : super admin sans filtre = un propriétaire par ligne ; sinon les 10 clients les plus touchés
  const sc = SOLO.conn;   // 'on' = connectés seuls, 'off' = non connectés seuls
  const byOwner = !VIEW && !OWNER, srt = (a,b)=> sc==='on' ? b.on-a.on : b.off-a.off||b.on-a.on;
  const withEq = byOwner
    ? NET.map(o=>{ const cl = CLIENTS.filter(c=>!c.rev && c.reseller===o.name), n = cl.reduce((t,c)=>t+c.eq.length,0), on = cl.reduce((t,c)=>t+connCount(c),0);
        return {own:o.name, name:o.name + (o.direct ? ' (direct)' : ''), on, off:n-on}; }).filter(r=>r.on+r.off)
    : CLIENTS.filter(c=>c.eq.length).map(c=>({id:c.id,name:c.name,on:connCount(c),off:c.eq.length-connCount(c)})).sort(srt).slice(0,10);
  if (byOwner) withEq.sort(srt);
  $('#connT').textContent = byOwner ? 'Équipements hors ligne par propriétaire' : 'Équipements connectés / non connectés : 10 clients les plus touchés';
  $('#connSub').innerHTML = byOwner ? 'Un propriétaire par ligne · cliquez pour voir ses clients' : `Trié par nombre de non connectés · <button class="lnk" data-eqall style="border:0;background:none;padding:0;font:inherit;color:var(--blue);cursor:pointer">voir tous les clients →</button>`;
  const maxEqC = Math.max(1,...withEq.map(r=>byOwner ? r.off : r.on+r.off));
  $('#connBars').innerHTML = withEq.map(r=>`
    <div class="b clk" role="button" tabindex="0" ${r.own ? `data-cbo="${r.own}"` : `data-cb="${r.id}"`} aria-label="${r.own ? 'Voir les clients de' : 'Voir les équipements de'} ${r.name}"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.name}</span>
      <div class="track">${byOwner ? `<i style="width:${pct(r.off,maxEqC)}%;background:var(--red)"></i>` : `${shown('conn','on')?`<i style="width:${pct(r.on,maxEqC)}%;background:var(--green)"></i>`:''}${shown('conn','off')?`<i style="width:${pct(r.off,maxEqC)}%;background:#fca5a5"></i>`:''}`}</div>
      <span class="num">${sc==='off' ? `${fmtN(r.off)} non conn. / ${fmtN(r.on+r.off)}` : byOwner ? `${fmtN(r.off)} hors ligne / ${fmtN(r.on+r.off)}` : `${r.on} / ${r.on+r.off}`}</span></div>`).join('');
  if (byOwner) $('#connLeg').innerHTML = '<span><i class="dot" style="background:var(--red)"></i>Hors ligne · longueur relative au propriétaire le plus touché</span>';
  else legend('#connLeg', 'conn', [{k:'on',l:'Connectés',c:'var(--green)'},{k:'off',l:'Non connectés',c:'#fca5a5'}]);
  // chaque ligne ouvre son détail : pack → clients du pack, client → onglet Équipements de sa fiche
  $$('#packBars [data-pk]').forEach(b=>b.onclick=e=>{ if (!e.target.closest('[data-oc]')) openPack(b.dataset.pk); });
  $$('#connBars [data-cb]').forEach(b=>b.onclick=()=>{ FICHE_TAB = 'eq'; openClient(+b.dataset.cb); });
  $$('#connBars [data-cbo]').forEach(b=>b.onclick=()=>{ openEq('off'); stOwn(b.dataset.cbo); });
  $$('[data-eqall]').forEach(b=>b.onclick=()=>openEq('off'));
}

/* ---------------- Fenêtres de détail des cartes du haut ---------------- */
function modal(title, body, docRef, width=640){
  $('#modal').innerHTML = `<div class="ov" id="ov"><div class="modal" role="dialog" aria-modal="true" style="max-width:${width}px">
    <div class="mh"><h3>${title}</h3><button class="x" data-x aria-label="Fermer">×</button></div>
    <div class="mb">${body}</div>
    <div class="mf"><button class="btn primary" data-x>Fermer</button></div></div></div>`;
  $('#ov').onclick = e => { if (e.target.id==='ov' || e.target.closest('[data-x]')) $('#modal').innerHTML = ''; };
}
// tout élément portant data-oc (nom de client dans un détail) ouvre la fiche du client
__on('click', e=>{ const t = e.target.closest('[data-oc]'); if (!t) return;
  e.preventDefault(); FICHE_TAB = t.dataset.tab || 'syn'; openClient(+t.dataset.oc); });
const cLink = c => `<button class="lnk" data-oc="${c.id}" style="border:0;background:none;padding:0;font:inherit;font-weight:500;color:var(--ink);cursor:pointer;text-align:left">${c.name}</button>`;
const eqState = e => !e[2] ? '<span class="st off"><i></i>Jamais connecté</span>' : eqConnected(e) ? '<span class="st on"><i></i>Connecté</span>' : `<span class="st off"><i></i>Non connecté · ${daysSince(e[3])} j</span>`;

/* Réseau Tunav : clients directs + revendeurs et leurs clients.
   Volumes à l'échelle (fictif) : genNetwork() complète les clients réels par des clients générés
   avec les mêmes champs (dates, connexions, équipements) ; toute la page les utilise. */
const NET = [
  {name:'Tunav',         col:'#64748B', target:5000, direct:true},
  {name:'MyCom',         col:'#2563eb', target:5000},
  {name:'Comafrique',    col:'#d97706', target:1000},
  {name:'Côte d’Ivoire', col:'#059669', target:300},
  {name:'Mali',          col:'#db2777', target:200},
  {name:'Sénégal',       col:'#7c3aed', target:150},
  {name:'Cameroun',      col:'#0891b2', target:120},
  {name:'Burkina Faso',  col:'#65a30d', target:90},
];
const stHtml = off => off ? '<span class="st off"><i></i>Bloqué</span>' : '<span class="st on"><i></i>Actif</span>';
// vue « détail » d'un client (listes paginées des cartes du haut)
const toNet = c => ({id:c.id, name:c.name, n:c.eq.length, packs:packsHtml(c), off:!isActive(c), sig:signals(c).join(' · '), blk:W.block(c),
  exp:c.exp, offN:c.eq.length-connCount(c), owner:c.reseller, rv:c.rev, st:statusHtml(c)});
// propriétaires visibles (Tunav toujours en tête) avec leurs clients finaux, calculés sur CLIENTS (compte + filtre propriétaire)
function netData(){
  return NET.map(o=>{ const clients = CLIENTS.filter(c=>!c.rev && c.reseller===o.name).map(toNet).sort((a,b)=>b.n-a.n || a.name.localeCompare(b.name));
      return {...o, clients, eq:clients.reduce((t,c)=>t+c.n,0)}; })
    .filter(o=>o.direct || o.clients.length || CLIENTS.some(c=>c.rev && c.name===o.name));
}
// « Tunav 12 · MyCom 14 · Comafrique 6 · autres 5 » : qui doit agir (super admin, sans filtre propriétaire)
function splitOwners(list){
  if (VIEW || OWNER || !list.length) return '';
  const g = NET.map(o=>[o.name, list.filter(c=>c.reseller===o.name).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);
  const rest = g.slice(3).reduce((t,x)=>t+x[1],0);
  return g.slice(0,3).map(([n,v])=>`${n} ${fmtN(v)}`).join(' · ') + (rest ? ` · autres ${fmtN(rest)}` : '');
}
/* Section « Revendeurs » (super admin) : Tunav (direct) puis chaque revendeur, calculé sur tout le réseau */
const RV = { p:0, per:5 };
function renderResellers(){
  if (VIEW) return;
  const rows = NET.map(o=>{ const cl = ALL_CLIENTS.filter(c=>!c.rev && c.reseller===o.name), eq = cl.reduce((t,c)=>t+c.eq.length,0);
    const on = cl.reduce((t,c)=>t+connCount(c),0), blk = cl.filter(c=>!isActive(c)).length;
    return {o, n:cl.length, eq, on, blk, ech:cl.filter(ALERTS[0].test).length}; });
  const pages = Math.ceil(rows.length/RV.per); RV.p = Math.min(RV.p, pages-1);
  $('#rvD').textContent = P.renew;
  $('#rvRows').innerHTML = rows.slice(RV.p*RV.per, (RV.p+1)*RV.per).map(r=>{ const bp = pct(r.blk, r.n), cp = pct(r.on, r.eq);
    return `<tr data-rvo="${r.o.name}" class="${OWNER===r.o.name?'sel':''}${bp >= 15 ? ' warn' : ''}" title="Filtrer la page sur ${r.o.name}">
      <td><i class="dot" style="background:${r.o.col}"></i><b>${r.o.name}</b>${r.o.direct ? ' <small class="note">direct</small>' : ''}${OWNER===r.o.name ? ' <span class="tag blue">filtré</span>' : ''}</td>
      <td>${fmtN(r.n)}</td><td>${fmtN(r.eq)}</td>
      <td><span class="st-bar"><i style="width:${cp}%;background:${cp < 85 ? 'var(--amber)' : 'var(--green)'}"></i></span><small class="note">${cp} %</small></td>
      <td style="color:${r.blk ? 'var(--red)' : 'var(--muted)'}">${fmtN(r.blk)} <small class="note">· ${bp} %</small></td>
      <td style="color:${r.ech ? 'var(--amber)' : 'var(--muted)'}">${fmtN(r.ech)}</td></tr>`; }).join('');
  $('#rvPg').innerHTML = pages > 1 ? `<div class="pgr"><span>${RV.p*RV.per+1}–${Math.min((RV.p+1)*RV.per, rows.length)} sur ${rows.length} propriétaires</span><span>
    <button data-rvp="${RV.p-1}"${RV.p?'':' disabled'} aria-label="Page précédente">‹</button>${Array.from({length:pages},(_,i)=>`<button data-rvp="${i}"${i===RV.p?' class="on"':''}>${i+1}</button>`).join('')}<button data-rvp="${RV.p+1}"${RV.p<pages-1?'':' disabled'} aria-label="Page suivante">›</button></span></div>` : '';
}
__on('click', e=>{
  const r = e.target.closest('[data-rvo]'), p = e.target.closest('[data-rvp]');
  if (p){ RV.p = +p.dataset.rvp; renderResellers(); }
  else if (r) setOwner(OWNER===r.dataset.rvo ? '' : r.dataset.rvo);
});

/* Listes paginées des panneaux de détail (pic, nouveaux / bloqués, échéances, connexions) */
const DP = {}, DP_R = {};
function dpList(key, items, row, render, per=8){
  const pages = Math.max(1, Math.ceil(items.length/per)), p = DP[key] = Math.min(DP[key]||0, pages-1); DP_R[key] = render;
  return `<ul class="dlist">${items.slice(p*per, (p+1)*per).map(row).join('') || li2('Aucun')}</ul>` + (pages > 1 ? `<div class="pgr"><span>${p*per+1}–${Math.min((p+1)*per, items.length)} sur ${fmtN(items.length)}</span><span>
    <button data-dp="${key}:${p-1}"${p?'':' disabled'} aria-label="Page précédente">‹</button><button data-dp="${key}:${p+1}"${p<pages-1?'':' disabled'} aria-label="Page suivante">›</button></span></div>` : '');
}
__on('click', e=>{ const b = e.target.closest('[data-dp]'); if (!b) return; const [k,i] = b.dataset.dp.split(':'); DP[k] = +i; DP_R[k](); });
// Statut : tous les clients visibles, revendeurs compris côté super admin (clients de Tunav)
const statusPool = () => CLIENTS.map(toNet);
// Équipements : clients finaux visibles (le parc des revendeurs eux-mêmes n'est pas compté)
const eqPool = () => CLIENTS.filter(c=>!c.rev).map(toNet);
// bloqués d'abord (échéance la plus ancienne en tête), puis actifs avec alerte, puis actifs sans alerte
const stRank = c => c.off ? 0 : c.sig ? 1 : 2;
const stSort = list => [...list].sort((a,b)=>stRank(a)-stRank(b) || (a.off ? (a.exp||'').localeCompare(b.exp||'') : 0) || a.name.localeCompare(b.name));
const fmtN = n => n.toLocaleString('fr-FR');
const TT = {q:'', open:null, p:{}}, TT_PER = {r:5, d:10, s:8, q:10};   // r revendeurs · d clients directs · s clients du revendeur ouvert · q résultats de recherche
const ttSlice = (k, list) => list.slice((TT.p[k]||0)*TT_PER[k], ((TT.p[k]||0)+1)*TT_PER[k]);
function ttPager(k, total){
  const per = TT_PER[k], pages = Math.ceil(total/per); if (pages <= 1) return '';
  const p = TT.p[k] || 0, a = p*per;
  let btns = '', prev = -1;
  [...new Set([0, p-1, p, p+1, pages-1])].filter(i=>i>=0 && i<pages).sort((x,y)=>x-y).forEach(i=>{
    if (i-prev > 1) btns += '<span class="gap">…</span>';
    btns += `<button data-pg="${k}:${i}"${i===p?' class="on"':''}>${i+1}</button>`; prev = i; });
  return `<div class="pgr"><span>${a+1}–${Math.min(a+per,total)} sur ${fmtN(total)}</span><span>
    <button data-pg="${k}:${p-1}"${p?'':' disabled'} aria-label="Page précédente">‹</button>${btns}<button data-pg="${k}:${p+1}"${p<pages-1?'':' disabled'} aria-label="Page suivante">›</button></span></div>`;
}
const ttRow = (c, via) => `<li><span>${c.id ? cLink(c) : `<span>${c.name}</span>`} ${c.st}${via ? `<small class="note">via ${via}</small>` : ''}</span><b>${c.packs} · ${fmtN(c.n)} équip.</b></li>`;
const ttRv = o => `<li class="rv${TT.open===o.name?' open':''}" data-ttr="${o.name}"><span><i class="chev">▸</i><i class="dot" style="background:${o.col}"></i><b class="rv-n">${o.name}</b><span class="tag blue">Revendeur</span>${o.id ? `<button class="lnk rv-f" data-oc="${o.id}">fiche →</button>` : ''}</span><b>${fmtN(o.clients.length)} clients · ${fmtN(o.eq)} équip.</b></li>`;
const ttSub = o => `<li class="sub"><ul class="dlist">${ttSlice('s',o.clients).map(c=>ttRow(c)).join('') || li2('Aucun client')}</ul>${ttPager('s',o.clients.length)}</li>`;
function ttRender(){
  const el = $('#ttL'); if (!el) return;
  const net = netData(), [tun, ...rv] = net;
  if (VIEW){   // compte revendeur : uniquement ses clients
    const me = net.find(o=>o.name===VIEW), q = TT.q.toLowerCase(), list = q ? me.clients.filter(c=>c.name.toLowerCase().includes(q)) : me.clients;
    el.innerHTML = `<h4 class="dh">${q ? 'Résultats' : `Clients de ${VIEW}`} (${fmtN(list.length)})</h4><ul class="dlist">${ttSlice('d',list).map(c=>ttRow(c)).join('') || li2('Aucun résultat')}</ul>${ttPager('d',list.length)}`;
    return;
  }
  if (TT.q){
    const q = TT.q.toLowerCase();
    const hits = [...rv.filter(o=>o.name.toLowerCase().includes(q)).map(o=>({rv:o})),
      ...net.flatMap(o=>o.clients.filter(c=>c.name.toLowerCase().includes(q)).map(c=>({c, via:o.name})))];
    el.innerHTML = `<h4 class="dh">Résultats (${fmtN(hits.length)})</h4><ul class="dlist">${ttSlice('q',hits).map(h=>h.rv ? ttRv(h.rv) : ttRow(h.c, h.via)).join('') || li2('Aucun résultat')}</ul>${ttPager('q',hits.length)}`;
    return;
  }
  el.innerHTML = `<h4 class="dh">Revendeurs de Tunav (${rv.length})</h4><ul class="dlist">${ttSlice('r',rv).map(o=>ttRv(o) + (TT.open===o.name ? ttSub(o) : '')).join('')}</ul>${ttPager('r',rv.length)}
    <h4 class="dh" id="ttD">Clients directs de Tunav (${fmtN(tun.clients.length)})</h4><ul class="dlist">${ttSlice('d',tun.clients).map(c=>ttRow(c)).join('')}</ul>${ttPager('d',tun.clients.length)}`;
}
// pagination, ouverture d'un revendeur (ligne ou légende), clic sur « Tunav » dans la légende = clients directs
__on('click', e=>{
  if (!e.target.closest('#ttW') || e.target.closest('[data-oc]')) return;
  const pg = e.target.closest('[data-pg]'), r = e.target.closest('[data-ttr]'), lg = e.target.closest('[data-tto]');
  if (pg){ const [k,i] = pg.dataset.pg.split(':'); TT.p[k] = +i; ttRender(); return; }
  const name = r ? r.dataset.ttr : lg ? lg.dataset.tto : null; if (name === null) return;
  const wasSearch = !!TT.q; TT.q = ''; $('#ttQ').value = '';
  if (!name){ ttRender(); $('#ttD').scrollIntoView({behavior:'smooth', block:'start'}); return; }
  const i = netData().slice(1).findIndex(o=>o.name===name);
  TT.open = r && !wasSearch && TT.open===name ? null : name; TT.p.s = 0; TT.p.r = Math.floor(i/TT_PER.r); ttRender();
  if (TT.open) document.querySelector(`[data-ttr="${CSS.escape(name)}"]`).scrollIntoView({behavior:'smooth', block:'nearest'});
});
function openTotal(){
  const net = netData(), tot = net.reduce((t,o)=>t+o.eq,0), nC = net.reduce((t,o)=>t+o.clients.length,0) + net.length-1;   // + les revendeurs, clients de Tunav
  let acc = 0; const grad = net.map(o=>{ const p = o.eq*100/tot, s = `${o.col} ${acc}% ${acc+p}%`; acc += p; return s; }).join(',');
  Object.assign(TT, {q:'', open:null, p:{}});
  modal('Total clients', `<div id="ttW">
    <div class="donut-w"><div class="donut" style="background:conic-gradient(${grad})"><div><b>${fmtN(nC)}</b><small>clients</small><small>${fmtN(tot)} équip.</small></div></div>
      <div class="dleg tt-leg">${net.map(o=>`<button data-tto="${o.direct ? '' : o.name}"><i class="dot" style="background:${o.col}"></i>${o.name}${o.direct ? ' <small class="note">direct</small>' : ''}<span class="tt-v"><b>${fmtN(o.eq)}</b> équip. · ${pct(o.eq,tot)} %</span></button>`).join('')}
      <p class="note">cliquez sur un revendeur pour voir ses clients</p></div></div>
    <input class="tt-q" id="ttQ" type="search" placeholder="Rechercher un client ou un revendeur…" aria-label="Rechercher un client ou un revendeur">
    <div id="ttL"></div></div>`, 'K-01', 680);
  $('#ttQ').oninput = e => { TT.q = e.target.value.trim(); TT.p.q = TT.p.d = 0; ttRender(); };
  ttRender();
}
// compte revendeur : répartition actifs / bloqués de ses clients, puis la liste paginée
function openTotalRev(){
  const me = netData().find(o=>o.name===VIEW), n = me.clients.length, off = me.clients.filter(c=>c.off).length, a = pct(n-off, n);
  Object.assign(TT, {q:'', open:null, p:{}});
  modal(`Total clients <span class="tag blue" style="vertical-align:middle;margin-left:6px">${VIEW}</span>`, `<div id="ttW">
    <div class="donut-w"><div class="donut" style="background:conic-gradient(var(--green) 0 ${a}%, var(--red) ${a}% 100%)"><div><b>${fmtN(n)}</b><small>clients</small><small>${fmtN(me.eq)} équip.</small></div></div>
      <div class="dleg"><div><i class="dot" style="background:var(--green)"></i>Actifs <b>${fmtN(n-off)}</b> (${a} %)</div><div><i class="dot" style="background:var(--red)"></i>Bloqués <b>${fmtN(off)}</b> (${100-a} %)</div>
      <p class="note">cliquez sur un nom pour ouvrir la fiche</p></div></div>
    <input class="tt-q" id="ttQ" type="search" placeholder="Rechercher un client…" aria-label="Rechercher un client">
    <div id="ttL"></div></div>`, 'K-01', 680);
  $('#ttQ').oninput = e => { TT.q = e.target.value.trim(); TT.p.d = 0; ttRender(); };
  ttRender();
}

/* Ligne du graphique « par pack » : clients du pack et leurs équipements */
function openPack(id){
  const p = id === 'none' ? null : packOf(+id), list = CLIENTS.filter(c=> p ? hasPack(c,p.id) : !c.packs.length);
  const eqIn = c => p ? eqOfPack(c,p.id) : c.eq, onIn = c => eqIn(c).filter(eqConnected).length;   // équipements de ce pack uniquement
  const eq = list.reduce((t,c)=>t+eqIn(c).length,0), on = list.reduce((t,c)=>t+onIn(c),0);
  modal(p ? `<i class="dot" style="background:${p.color}"></i>${p.name}` : 'Sans pack', `
    <div class="ft-grid" style="margin-bottom:12px"><div class="ft-k"><span>Clients</span><b>${list.length}</b><small>${list.filter(isActive).length} actif(s)</small></div>
      <div class="ft-k"><span>Équipements</span><b>${eq}</b><small>affectés</small></div>
      <div class="ft-k ${on<eq?'warn':''}"><span>Connectés</span><b>${on} / ${eq}</b><small>${pct(on,eq)} %</small></div></div>
    <table class="ft-t al-t"><thead><tr><th>Client</th><th>Statut</th><th>Équipements connectés</th><th>Échéance</th></tr></thead><tbody>
      ${list.map(c=>`<tr data-oc="${c.id}"><td><b>${c.name}</b>${c.packs.length > 1 ? `<br><small class="note">aussi : ${c.packs.filter(x=>!p || x!==p.id).map(x=>packOf(x).name).join(', ')}</small>` : ''}</td><td>${statusHtml(c)}</td><td>${eqIn(c).length ? `${onIn(c)} / ${eqIn(c).length}` : '—'}</td><td>${fmtD(c.exp)}</td></tr>`).join('') || '<tr><td colspan="4" class="note">Aucun client</td></tr>'}</tbody></table>
    <p class="note">Cliquez sur un client pour ouvrir sa fiche.</p>`, 'D-01');
}

/* ---- Légendes cliquables : un clic = n'afficher que cette série, re-clic = tout ---- */
const SOLO = {};
const shown = (chart, k) => !SOLO[chart] || SOLO[chart] === String(k);
function legend(el, chart, items){
  $(el).innerHTML = items.map(it=>`<button class="lg${SOLO[chart]===String(it.k)?' on':''}${SOLO[chart] && SOLO[chart]!==String(it.k)?' off':''}" data-lg="${chart}" data-k="${it.k}"><i class="dot" style="background:${it.c}"></i>${it.l}</button>`).join('')
    + (SOLO[chart] ? `<button class="lg reset" data-lg="${chart}" data-k="">Tout afficher</button>` : '');
}
__on('click', e=>{ const b = e.target.closest('[data-lg]'); if (!b) return;
  const ch = b.dataset.lg, k = b.dataset.k; SOLO[ch] = (!k || SOLO[ch]===k) ? null : k; renderKpis(); renderActivity(); });

/* ---------------- Tableau ---------------- */
const open = new Set();
// vue par défaut (super admin) : une ligne « Tunav » (ses clients directs rangés dessous) puis une ligne par revendeur
// (ses clients rangés dessous). Recherche, filtre « Client final » ou filtre propriétaire → liste à plat.
const nestOn = () => !VIEW && !OWNER && !F.search && F.type!=='simple';
const subMatch = name => subClients(name).filter(x=>matchF(x, true));
const TUNAV_ROW = {name:'Tunav', group:true};
function filtered(){
  if (!nestOn()) return CLIENTS.filter(c=>matchF(c));
  // un revendeur reste affiché si lui-même ou au moins un de ses clients passe les filtres (ordre du réseau)
  const rk = c => NET.findIndex(o=>o.name===c.name);
  const rv = CLIENTS.filter(c=>c.rev && c.reseller==='Tunav' && (matchF(c) || subMatch(c.name).length)).sort((a,b)=>rk(a)-rk(b));
  return (F.type!=='rev' && subMatch('Tunav').length ? [TUNAV_ROW] : []).concat(rv);
}
// filtres du tableau ; sub = client d'un revendeur déplié (le filtre « Type » ne s'applique pas)
function matchF(c, sub){
  const a = ALERTS.find(x=>x.id===F.alert);
  {
    if (F.search && !c.name.toLowerCase().includes(F.search.toLowerCase())) return false;
    if (!sub && F.type==='rev' && !c.rev) return false;
    if (!sub && F.type==='simple' && c.rev) return false;
    if (F.status==='on' && !isActive(c)) return false;
    if (F.status==='off' && isActive(c)) return false;
    if (F.pack==='none' && c.packs.length) return false;
    if (F.pack && F.pack!=='none' && !hasPack(c, +F.pack)) return false;   // un client à 2 packs apparaît dans les deux filtres
    if (F.conn==='none' && c.eq.length) return false;
    if (F.conn==='all' && (!c.eq.length || connCount(c)<c.eq.length)) return false;
    if (F.conn==='some' && !(c.eq.length && connCount(c)<c.eq.length)) return false;
    if (a && !a.test(c)) return false;
    return true;
  }
}
const ACTION_ICONS = {
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
  view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  equipment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>',
  payment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>'
};

// Pagination : 5 lignes par page dans la maquette (9 clients) pour la montrer ; 10 / 25 / 50 au choix
const PG = { page:1, size:10 };
// revendeurs dépliés dans le tableau : nom → page de la sous-liste de ses clients
const RVX = new Map(), RVX_PER = 10;
const subClients = name => ALL_CLIENTS.filter(x=>!x.rev && x.reseller===name);
// sous-tableau d'un revendeur : statut, pack et équipements connectés de chacun de ses clients (bloqués en tête)
function rvSubRow(c){
  const subs = subMatch(c.name).sort((a,b)=>isActive(a)-isActive(b) || a.name.localeCompare(b.name));
  const blk = subs.filter(x=>!isActive(x)).length, eqT = subs.reduce((t,x)=>t+x.eq.length,0), eqOn = subs.reduce((t,x)=>t+connCount(x),0);
  const pages = Math.max(1, Math.ceil(subs.length/RVX_PER)), p = Math.min(RVX.get(c.name), pages-1); RVX.set(c.name, p);
  const rows = subs.slice(p*RVX_PER, (p+1)*RVX_PER).map(x=>{ const on = connCount(x), n = x.eq.length, du = x.exp ? daysUntil(x.exp) : null;
    return `<tr><td><button class="lnk" data-eye="${x.id}" style="border:0;background:none;padding:0;font:inherit;font-weight:500;color:var(--ink);cursor:pointer">${x.name}</button></td>
      <td>${packsHtml(x)}</td>
      <td>${n ? `<div class="parc"><div class="p1"><b class="${on<n?'bad':''}">${on}</b> / ${n}</div><div class="mini"><i style="width:${pct(on,n)}%"></i></div></div>` : '<span class="none">Aucun équipement</span>'}</td>
      <td>${fmtDT(x.last)}</td>
      <td>${fmtD(x.exp)} ${du===null ? '' : du < 0 ? (inGrace(x) ? `<span class="ago bad">blocage J-${blockIn(x)}</span>` : '<span class="ago bad">expiré</span>') : du <= P.renew ? `<span class="ago warn">J-${du}</span>` : ''}</td>
      <td>${stHtml(!isActive(x))}</td></tr>`; }).join('');
  return `<tr class="det"><td colspan="9"><div class="det-in">
    <div class="h"><span><b>${c.name}</b> · ${c.group ? 'clients directs' : 'clients du revendeur'}</span>
      <span class="rv-k"><b>${fmtN(subs.length)}</b> clients · <b style="color:var(--green)">${fmtN(subs.length-blk)}</b> actifs · <b style="color:var(--red)">${fmtN(blk)}</b> bloqués · <b>${fmtN(eqOn)} / ${fmtN(eqT)}</b> équip. connectés</span>
      <button class="rv-f" data-rvf="${c.name}">Filtrer le tableau sur ${c.name} →</button></div>
    <table><thead><tr><th>Client</th><th>Pack</th><th>Équipements connectés</th><th>Dernière connexion</th><th>Échéance</th><th>Statut</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Aucun client</td></tr>'}</tbody></table>
    ${pages > 1 ? `<div class="rv-pg"><span>${p*RVX_PER+1}–${Math.min((p+1)*RVX_PER, subs.length)} sur ${fmtN(subs.length)} clients</span><span>
      <button data-rvxp="${c.name}:${p-1}"${p?'':' disabled'} aria-label="Page précédente">‹</button><button data-rvxp="${c.name}:${p+1}"${p<pages-1?'':' disabled'} aria-label="Page suivante">›</button></span></div>` : ''}
  </div></td></tr>`;
}
// ligne « Tunav » : synthèse de ses clients directs (statut, équipements), le clic les déplie dessous
function tunavRow(c){
  const all = subClients(c.name), eqT = all.reduce((t,x)=>t+x.eq.length,0), eqOn = all.reduce((t,x)=>t+connCount(x),0);
  const blk = all.filter(x=>!isActive(x)).length, op = RVX.has(c.name), arr = op ? '▴' : '▾';
  return `<tr class="r${op ? ' rv-open' : ''}">
      <td class="cname"><b>Tunav</b></td>
      <td>—</td>
      <td><span class="type">Direct</span><button class="rvx" data-rvx="Tunav" title="Voir les clients directs de Tunav">${arr} ${fmtN(subMatch('Tunav').length)} clients</button></td>
      <td><span class="none">—</span></td>
      <td><button class="parc" data-rvx="Tunav" title="Équipements de tous les clients directs de Tunav">
        <div class="p1"><b class="${eqOn<eqT?'bad':''}">${fmtN(eqOn)}</b> / ${fmtN(eqT)} <span style="color:var(--faint);font-family:Inter">${arr}</span></div>
        <div class="mini"><i style="width:${pct(eqOn,eqT)}%"></i></div><small class="note">tous ses clients</small></button></td>
      <td><span class="none">—</span></td>
      <td><span class="none">—</span></td>
      <td><span class="st on"><i></i>${fmtN(all.length-blk)} actifs</span><br><span class="st off"><i></i>${fmtN(blk)} bloqués</span></td>
      <td></td></tr>` + (op ? rvSubRow(c) : '');
}
function renderTable(){
  const list = filtered(), pages = Math.max(1, Math.ceil(list.length / PG.size));
  PG.page = Math.min(Math.max(1, PG.page), pages);
  const from = (PG.page - 1) * PG.size, pageList = list.slice(from, from + PG.size);
  $('#rows').innerHTML = pageList.map(c=>{
    if (c.group) return tunavRow(c);
    const on = connCount(c), n = c.eq.length;
    const ds = c.last ? daysSince(c.last) : null;
    const lastCls = ds===null ? 'bad' : ds > P.inact ? 'warn' : 'ok';
    const du = c.exp ? daysUntil(c.exp) : null;
    const expTag = du===null ? '' : du < 0 ? (inGrace(c) ? `<span class="ago bad">blocage J-${blockIn(c)}</span>` : `<span class="ago bad">expiré</span>`) : du <= P.renew ? `<span class="ago warn">J-${du}</span>` : '';
    // revendeur : équipements connectés de tous ses clients (le clic déplie la liste de ses clients)
    const rvS = c.rev ? subClients(c.name) : null, rvT = rvS && rvS.reduce((t,x)=>t+x.eq.length,0), rvOn = rvS && rvS.reduce((t,x)=>t+connCount(x),0);
    const parc = c.rev ? (rvT ? `<button class="parc" data-rvx="${c.name}" title="Équipements de tous les clients de ${c.name}">
        <div class="p1"><b class="${rvOn<rvT?'bad':''}">${fmtN(rvOn)}</b> / ${fmtN(rvT)} <span style="color:var(--faint);font-family:Inter">${RVX.has(c.name)?'▴':'▾'}</span></div>
        <div class="mini"><i style="width:${pct(rvOn,rvT)}%"></i></div><small class="note">tous ses clients</small></button>` : '<span class="none">—</span>')
      : n ? `<button class="parc" data-open="${c.id}">
        <div class="p1"><b class="${on<n?'bad':''}">${on}</b> / ${n} <span style="color:var(--faint);font-family:Inter">${open.has(c.id)?'▴':'▾'}</span></div>
        <div class="mini"><i style="width:${pct(on,n)}%"></i></div></button>` : `<span class="none">Aucun équipement</span>`;
    const rvN = c.rev ? subMatch(c.name).length : 0;
    let html = `<tr class="r${RVX.has(c.name) && c.rev ? ' rv-open' : ''}">
      <td class="cname"><button class="lnk" data-eye="${c.id}" title="Détails du client">${c.name}</button></td>
      <td>${c.reseller}</td>
      <td><span class="type ${c.rev?'rev':''}">${c.rev?'Revendeur':'Client final'}</span>${c.rev ? `<button class="rvx" data-rvx="${c.name}" title="Voir les clients de ${c.name}">${RVX.has(c.name)?'▴':'▾'} ${fmtN(rvN)} clients</button>` : ''}</td>
      <td>${packsHtml(c)}</td>
      <td>${parc}</td>
      <td>${fmtDT(c.last)}${ds===null?'<span class="ago bad">jamais</span>':`<span class="ago ${lastCls}">${ds} j</span>`}</td>
      <td>${fmtD(c.exp)} ${expTag}</td>
      <td>${isActive(c)?'<span class="st on"><i></i>Actif</span>':'<span class="st off"><i></i>Bloqué</span>'}</td>
      <td><div class="acts">
        ${opts.actions?.edit ? `<button type="button" data-mq-action="client-edit" data-client-id="${c.id}" title="Modifier le client" aria-label="Modifier ${c.name}">${ACTION_ICONS.edit}</button>` : ''}
        <button type="button" data-eye="${c.id}" title="Détails du client" aria-label="Voir ${c.name}">${ACTION_ICONS.view}</button>
        <button type="button" data-mq-action="client-equipment" data-client-id="${c.id}" title="Équipements du client" aria-label="Équipements de ${c.name}">${ACTION_ICONS.equipment}</button>
        ${opts.actions?.payment ? `<button type="button" data-mq-action="client-payment" data-client-id="${c.id}" title="Paiement du client" aria-label="Paiement de ${c.name}">${ACTION_ICONS.payment}</button>` : ''}
      </div></td></tr>`;
    if (!c.rev && open.has(c.id) && n){
      html += `<tr class="det"><td colspan="9"><div class="det-in">
        <div class="h"><span><b>${c.name}</b> · détail du parc</span><span>${on} connecté(s) · ${n-on} non connecté(s) · seuil ${P.hours} h</span></div>
        <table><thead><tr><th>N° série</th><th>Pack</th><th>Date d'affectation</th><th>1er envoi</th><th>Dernière position</th><th>Connexion</th></tr></thead><tbody>
        ${c.eq.map(e=>{
          const ok = eqConnected(e);
          const st = !e[2] ? '<span class="st off"><i></i>Jamais connecté</span>' : ok ? '<span class="st on"><i></i>Connecté</span>' : `<span class="st off"><i></i>Non connecté · ${daysSince(e[3])} j</span>`;
          return `<tr><td class="mono">${e[0]}</td><td>${badgeP(e[4])}</td><td>${fmtD(e[1])}</td><td>${fmtD(e[2])}</td><td>${fmtDT(e[3])}</td><td>${st}</td></tr>`;
        }).join('')}
        </tbody></table></div></td></tr>`;
    }
    if (c.rev && RVX.has(c.name)) html += rvSubRow(c);
    return html;
  }).join('') || `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px">Aucun client</td></tr>`;
  document.querySelectorAll('#rows [data-eye]').forEach(b=>b.onclick=()=>{ FICHE_TAB = 'syn'; openClient(+b.dataset.eye); });
  $$('#rows [data-mq-action]').forEach(b=>b.onclick=()=>{
    const c = CLIENTS.find(x=>x.id===+b.dataset.clientId); if (!c) return;
    const action = b.dataset.mqAction;
    if (opts.onClientAction?.(action, c.name)) return;
    if (action==='client-equipment'){ FICHE_TAB='eq'; openClient(c.id); return; }
    if (action==='client-edit'){
      modal(`Modifier ${c.name}`, `<div class="fgrid"><div><label for="editClientName">Nom du client</label><input id="editClientName" value="${c.name}"></div><div><label for="editClientExpiry">Échéance</label><input id="editClientExpiry" type="date" value="${c.exp||''}"></div></div><p id="editClientError" class="note" role="alert"></p><button type="button" class="btn primary" id="saveClientEdit">Enregistrer</button>`);
      $('#saveClientEdit').onclick=()=>{
        const name=$('#editClientName').value.trim();
        if (!name){ $('#editClientError').textContent='Le nom du client est obligatoire.'; return; }
        c.name=name; c.exp=$('#editClientExpiry').value;
        $('#modal').innerHTML=''; renderAll();
      };
    }
    if (action==='client-payment'){
      modal(`Valider le paiement · ${c.name}`, `<p class="note">Échéance actuelle : ${fmtD(c.exp)} · ${isActive(c)?'actif':'bloqué'}</p><label for="paymentExpiry">Nouvelle échéance</label><input id="paymentExpiry" type="date" value="${c.exp||isoC(REAL_TODAY)}"><p id="paymentError" class="note" role="alert"></p><button type="button" class="btn primary" id="savePayment">Valider le paiement</button>`);
      $('#savePayment').onclick=()=>{
        const expiry=$('#paymentExpiry').value;
        if (!expiry || expiry<isoC(REAL_TODAY)){ $('#paymentError').textContent='Choisissez une date à partir d’aujourd’hui.'; return; }
        c.exp=expiry; c.blocked=false; $('#modal').innerHTML=''; renderAll();
      };
    }
  });
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{ const id=+b.dataset.open; open.has(id)?open.delete(id):open.add(id); renderTable(); });
  $$('#rows [data-rvx]').forEach(b=>b.onclick=()=>{ const k = b.dataset.rvx; RVX.has(k) ? RVX.delete(k) : RVX.set(k, 0); renderTable(); });
  $$('#rows [data-rvxp]').forEach(b=>b.onclick=()=>{ const [k,i] = b.dataset.rvxp.split(':'); RVX.set(k, +i); renderTable(); });
  $$('#rows [data-rvf]').forEach(b=>b.onclick=()=>setOwner(b.dataset.rvf));

  const a = ALERTS.find(x=>x.id===F.alert);
  const nSub = nestOn() ? list.reduce((t,c)=>t+(c.group ? subMatch(c.name).length : 0),0) : 0, nRvSub = nestOn() ? list.reduce((t,c)=>t+(c.rev ? subMatch(c.name).length : 0),0) : 0;
  $('#chips').innerHTML = (nestOn() ? `<span>Tunav (${fmtN(nSub)} clients directs) + ${fmtN(list.filter(c=>c.rev).length)} revendeur(s) (${fmtN(nRvSub)} clients) · cliquez sur une ligne pour voir ses clients</span>`
    : `<span>${fmtN(list.length)} client(s) affiché(s)</span>`) +
    (a ? `<span class="chip">${a.ref} · ${a.title()} <button data-clr>×</button></span>` : '');
  const clr = document.querySelector('[data-clr]'); if (clr) clr.onclick = ()=>{ F.alert=''; renderAll(); };

  // pages : ‹ 1 2 3 … › (au-delà de 7 pages, on garde la première, la dernière et les voisines)
  const nums = Array.from({length:pages}, (_,i)=>i+1).filter(n=> pages <= 7 || n===1 || n===pages || Math.abs(n-PG.page) <= 1);
  const btns = nums.map((n,i)=> (i && n - nums[i-1] > 1 ? '<span style="padding:0 4px">…</span>' : '') + `<button data-pg="${n}" class="${n===PG.page?'on':''}">${n}</button>`).join('');
  $('#pager').innerHTML = `<label>Afficher <select id="pgSize">${[5,10,25,50].map(s=>`<option ${s===PG.size?'selected':''}>${s}</option>`).join('')}</select> par page</label>
    <span>${list.length ? `${from+1}–${from+pageList.length} sur ${list.length} client(s)` : '0 client'}</span>
    <div class="pg"><button data-pg="${PG.page-1}" ${PG.page<=1?'disabled':''} aria-label="Page précédente">‹</button>${btns}<button data-pg="${PG.page+1}" ${PG.page>=pages?'disabled':''} aria-label="Page suivante">›</button></div>`;
  $$('#pager [data-pg]').forEach(b=>b.onclick=()=>{ PG.page = +b.dataset.pg; renderTable(); });
  $('#pgSize').onchange = e=>{ PG.size = +e.target.value; PG.page = 1; renderTable(); };
}
function renderBell(){
  const crit = c => isActive(c) && c.exp && daysUntil(c.exp) >= 0 && daysUntil(c.exp) <= 10;
  const items = [
    ...CLIENTS.filter(inGrace).sort((a,b)=>blockIn(a)-blockIn(b)).map(c=>({col:'var(--red)', t:`${c.name}${c.rev ? ' (revendeur)' : ''} · ${W.grace(c)}`, s:`A-04 · expiré le ${fmtD(c.exp)} · blocage le ${blockDate(c).toLocaleDateString('fr-FR')}`, a:'grace'})),
    ...CLIENTS.filter(crit).map(c=>({col:'var(--red)', t:`${c.name} · ${W.exp(daysUntil(c.exp))}`, s:`Critique ≤ 10 j · ${fmtD(c.exp)}`, a:'renew'})),
    ...ALERTS.flatMap(a=>CLIENTS.filter(a.test).filter(c=>a.id!=='grace' && !(a.id==='renew' && crit(c)))
      .map(c=>({col:a.tag[1]==='red'?'var(--red)':'#f59e0b', t:c.name, s:`${a.ref} · ${a.title()}`, a:a.id}))),
  ];
  $('#bellCnt').textContent = items.length > 99 ? '99+' : items.length;
  $('#bpanel').innerHTML = `<div class="bh"><b>Alertes</b><span>${items.length} à traiter</span></div><ul>` +
    items.slice(0,40).map((it,i)=>`<li data-bi="${i}"><i style="background:${it.col}"></i><div>${it.t}<small>${it.s}</small></div></li>`).join('')
    + (items.length > 40 ? `<li style="cursor:default;display:block;color:var(--muted);font-size:12px">+ ${fmtN(items.length-40)} autres : ouvrez les cartes « À traiter »</li>` : '') + '</ul>';
  document.querySelectorAll('[data-bi]').forEach(li=>li.onclick=()=>{ F.alert = items[+li.dataset.bi].a; $('#bpanel').classList.add('hidden'); showTab('dash'); renderAll(); $('#rows').scrollIntoView({behavior:'smooth'}); });
}
$('#bell').onclick = e=>{ e.stopPropagation(); $('#bpanel').classList.toggle('hidden'); };
__on('click', e=>{ if (!e.target.closest('#bpanel')) $('#bpanel').classList.add('hidden'); });
/* ======================= ACTIVITÉ ET RENOUVELLEMENT ======================= */
// Données fictives complémentaires : création du client, date de blocage, mois avec connexion utilisateur, canal de la dernière connexion
const EXTRA = {
  12:{since:'2025-05-12', blockedOn:'2026-10-03', act:[], ch:'PC'},
  14:{since:'2025-08-20', act:['2026-05','2026-07','2026-08','2026-09','2026-10'], ch:'Mobile'},
  15:{since:'2025-03-03', blockedOn:'2026-08-20', act:[], ch:null},
  16:{since:'2026-03-15', act:[], ch:'PC'},
  17:{since:'2024-09-02', act:['2026-05','2026-06','2026-07','2026-08','2026-09','2026-10'], ch:'PC'},
  18:{since:'2025-01-10', act:[], ch:'PC'},
  19:{since:'2026-09-22', act:['2026-09','2026-10'], ch:'Mobile'},
  20:{since:'2026-08-20', act:['2026-08','2026-09'], ch:'Mobile'},
  21:{since:'2026-04-05', act:['2026-05','2026-06','2026-08','2026-09','2026-10'], ch:'PC'},
};
CLIENTS.forEach(c=>Object.assign(c, EXTRA[c.id]));
// Plusieurs packs par client : chaque équipement porte son pack (e[4]), par défaut le pack du client
const EQ_PACK = { '863719061234507':2, '863719061234516':1 };   // MyCom : 2 Secure + 1 Pro · BTP Carthage : 1 Pro + 1 Secure
CLIENTS.forEach(c=>{ c.eq.forEach(e=>{ e[4] = EQ_PACK[e[0]] || c.pack; });
  const n = id => c.eq.filter(e=>e[4]===id).length;
  c.packs = [...new Set(c.eq.map(e=>e[4]).concat(c.pack ? [c.pack] : []))].filter(Boolean).sort((a,b)=>n(b)-n(a)); });
const hasPack = (c,id) => c.packs.includes(id);
const eqOfPack = (c,id) => c.eq.filter(e=>e[4]===id);
// Connexions utilisateur par mois (fictif) : 12 valeurs de nov. 2025 à oct. 2026, cohérentes avec act / last
const LOGINS = {
  12:[6,4,1,0,0,0,0,0,0,0,0,0], 14:[5,7,6,4,3,0,4,0,6,8,5,3], 15:[0,0,0,0,0,0,0,0,0,0,0,0],
  16:[0,0,0,0,2,1,0,0,0,0,0,0], 17:[18,15,20,17,22,19,21,16,14,19,23,12], 18:[0,0,0,0,0,0,0,0,0,0,0,0],
  19:[0,0,0,0,0,0,0,0,0,0,3,9], 20:[0,0,0,0,0,0,0,0,0,4,1,0], 21:[0,0,0,0,0,5,8,6,0,7,10,11],
};
CLIENTS.forEach(c=>{ c.logm = {}; (LOGINS[c.id]||[]).forEach((n,i)=>{ const d = new Date(2025, 10+i, 1); c.logm[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`] = n; }); });
const SHIFT = Math.round((new Date(REAL_TODAY).setHours(0,0,0,0) - new Date(DATA_DATE).setHours(0,0,0,0)) / 864e5);
const SHIFT_M = (REAL_TODAY.getFullYear()*12 + REAL_TODAY.getMonth()) - (DATA_DATE.getFullYear()*12 + DATA_DATE.getMonth());
const shiftD = s => { if (!s || !SHIFT) return s; const d = new Date(s.length===10 ? s+'T12:00:00' : s); d.setDate(d.getDate()+SHIFT);
  const day = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; return s.length===10 ? day : day + s.slice(10); };
const shiftM = k => { if (!SHIFT_M) return k; const d = new Date(+k.slice(0,4), +k.slice(5)-1+SHIFT_M, 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
CLIENTS.forEach(c=>{ c.exp = shiftD(c.exp); c.last = shiftD(c.last); c.since = shiftD(c.since); c.blockedOn = shiftD(c.blockedOn);
  c.act = c.act.map(shiftM); c.logm = Object.fromEntries(Object.entries(c.logm).map(([k,v])=>[shiftM(k),v])); c.eq.forEach(e=>{ e[1] = shiftD(e[1]); e[2] = shiftD(e[2]); e[3] = shiftD(e[3]); }); });

const MOIS_C = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const mk = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;          // 2026-10
const mLabel = k => { const [y,m] = k.split('-'); return `${MOIS_C[+m-1]} ${y}`; };
let MONTHS6;
let MONTHS12, ELAPSED;
const setMonths = () => { MONTHS6 = Array.from({length:6}, (_,i)=>mk(new Date(TODAY.getFullYear(), TODAY.getMonth()-5+i, 1)));
  MONTHS12 = Array.from({length:12}, (_,i)=>mk(new Date(TODAY.getFullYear(), i, 1)));
  ELAPSED = MONTHS12.filter(k=>k <= mk(TODAY)); };
setMonths();
const inMonth = (s,k) => !!s && s.slice(0,7) === k;
const badgeP = id => { const p = packOf(id); return p ? `<span class="pk"><i class="dot" style="background:${p.color}"></i>${p.name}</span>` : '<span class="none">—</span>'; };
// tous les packs du client ; avec plusieurs packs, chaque pastille indique ses équipements
const packsHtml = c => c.packs.length ? `<span class="pks">${c.packs.map(id=>{ const p = packOf(id);
    return `<span class="pk"><i class="dot" style="background:${p.color}"></i>${p.name}${c.packs.length>1 ? `<small class="pk-n">${eqOfPack(c,id).length} éq.</small>` : ''}</span>`; }).join('')}</span>`
  : '<span class="none">—</span>';
const packNames = c => c.packs.length ? c.packs.map(id=>packOf(id).name).join(' + ') : '—';
const statusHtml = c => inGrace(c) ? `<span class="st warn" title="Abonnement expiré le ${fmtD(c.exp)} : bloqué le ${blockDate(c).toLocaleDateString('fr-FR')}"><i></i>Actif · bloqué dans ${blockIn(c)} j</span>` : isActive(c) ? '<span class="st on"><i></i>Actif</span>' : '<span class="st off"><i></i>Bloqué</span>';
// Libellés courts des signaux (mêmes mots partout : statut, fiche, cloche)
const W = {
  login: c => c.last ? `Aucune connexion : ${daysSince(c.last)} j` : 'Jamais connecté',            // utilisateurs (plateforme)
  eqOff: c => `Équip. hors ligne : ${c.eq.length-connCount(c)} / ${c.eq.length}`,                     // boîtiers sans position > 24 h
  exp:   du => du === 0 ? 'Expire aujourd’hui' : `Expire dans ${du} j`,
  grace: c => `Bloqué dans ${blockIn(c)} j`,
  block: c => { if (!c.blockedOn || !c.exp) return c.blocked ? 'Bloqué' : `Expiré depuis ${-daysUntil(c.exp)} j`;
    const g = Math.round((d0(c.blockedOn) - d0(c.exp)) / DAY);
    return g > 0 ? `Bloqué ${g} j après l’échéance` : g < 0 ? `Bloqué ${-g} j avant l’échéance` : 'Bloqué le jour de l’échéance'; },
};
const signals = c => { const s = [];
  if (inGrace(c)) s.push(W.grace(c));
  if (!c.last || daysSince(c.last) > P.inact) s.push(W.login(c));
  if (c.exp && daysUntil(c.exp) >= 0 && daysUntil(c.exp) <= P.renew) s.push(W.exp(daysUntil(c.exp)));
  if (c.eq.length && connCount(c) < c.eq.length) s.push(W.eqOff(c));
  return s; };

/* Réseau à l'échelle (fictif) : revendeurs et clients générés avec les mêmes champs que les clients réels,
   dates relatives à aujourd'hui ; chaque propriétaire est complété jusqu'à son parc cible (NET.target) */
function genNetwork(){
  let s = 7; const rnd = () => (s = (s*16807) % 2147483647) / 2147483647, pick = a => a[Math.floor(rnd()*a.length)], ri = (a,b) => a + Math.floor(rnd()*(b-a+1));
  const A = ['Transport','Logistique','Fret','Distribution','Livraison','Agri','BTP','Express','Cargo','Navette','Taxi','Location','Froid','Citerne'];
  const TN = ['Sfax','Sousse','Nabeul','Bizerte','Gabès','Kairouan','Monastir','Mahdia','Gafsa','Tozeur','Béja','Jendouba','Kef','Médenine','Ariana','Ben Arous','Zaghouan','Siliana','Kasserine','Tataouine'];
  const AF = ['Abidjan','Bamako','Dakar','Douala','Yaoundé','Ouagadougou','Bouaké','Thiès','Kayes','Ségou','Garoua','Bobo','Lomé','Cotonou','Niamey','Conakry','Saint-Louis','Kumasi','Mopti','Ziguinchor'];
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const at = (n, h) => { const d = iso(new Date(REAL_TODAY.getTime() + n*DAY)); return h === undefined ? d : `${d}T${String(h).padStart(2,'0')}:${String(ri(0,59)).padStart(2,'0')}`; };
  const used = new Set(ALL_CLIENTS.map(c=>c.name)); let id = 1000, sn = 0;
  const mkClient = (owner, name, n, rev) => {
    const off = !rev && rnd() < .08, exp = off ? -ri(5,150) : ri(3,420);
    let since = -ri(20,900); if (off) since = Math.min(since, exp - ri(30,300));
    const blockedOn = off ? Math.min(-1, exp + ri(0,10)) : null, end = off ? blockedOn : 0;
    const r = rnd(), lastD = r < .72 ? end - ri(0,29) : r < .92 ? end - ri(31,150) : null;
    const last = lastD === null || lastD < since ? null : at(lastD, ri(7,19));
    const p1 = !rev && rnd() < .06 ? null : ri(1,4), p2 = p1 && rnd() < .1 ? ri(1,4) : null;
    // mois avec connexion (12 derniers mois) : entre la création et la dernière connexion
    const engaged = rnd() < .7, logm = {}, act = [], sD = new Date(REAL_TODAY.getTime() + since*DAY), from = new Date(sD.getFullYear(), sD.getMonth(), 1);
    if (last) for (let i = 0; i < 12; i++){ const d = new Date(REAL_TODAY.getFullYear(), REAL_TODAY.getMonth()-11+i, 1), k = mk(d);
      if (d < from || k > last.slice(0,7)) continue;
      if (k === last.slice(0,7) || rnd() < (engaged ? .85 : .3)){ act.push(k); logm[k] = ri(1, engaged ? 25 : 6); } }
    // boîtiers : client bloqué = tous hors ligne ; sinon quelques clients ont des boîtiers sans position
    const offEq = off ? n : rnd() < .12 ? ri(1, Math.min(n,5)) : 0;
    const eq = Array.from({length:n}, (_,i)=>{ const aff = Math.min(-1, since + ri(0,20)), never = i < offEq && rnd() < .05;
      const lastPos = never ? null : i < offEq ? at(off ? Math.max(aff+1, blockedOn - ri(0,5)) : -ri(2,60), ri(0,23)) : at(0, ri(0,11));
      return [String(863719100000000 + sn++), at(aff), never ? null : at(aff+1), lastPos, p2 && rnd() < .3 ? p2 : p1]; });
    const c = {id:id++, name, reseller:owner, rev:!!rev, pack:p1, blocked:off, exp:at(exp), last, since:at(since), blockedOn: off ? at(blockedOn) : undefined,
      act, ch: last ? (rnd() < .55 ? 'PC' : 'Mobile') : null, logm, eq};
    const cnt = k => eq.filter(e=>e[4]===k).length;
    c.packs = [...new Set(eq.map(e=>e[4]).concat(p1 ? [p1] : []))].filter(Boolean).sort((a,b)=>cnt(b)-cnt(a));
    ALL_CLIENTS.push(c); return c;
  };
  NET.forEach((o,k)=>{
    if (!o.direct) o.id = (ALL_CLIENTS.find(c=>c.rev && c.name===o.name) || mkClient('Tunav', o.name, 0, true)).id;
    let left = o.target - ALL_CLIENTS.filter(c=>!c.rev && c.reseller===o.name).reduce((t,c)=>t+c.eq.length,0);
    while (left > 0){
      const n = Math.min(left, 1 + Math.floor(rnd()**2.2 * 80)), base = `${pick(A)} ${pick(k < 2 ? TN : AF)}`;
      let name = base, j = 2; while (used.has(name)) name = `${base} ${j++}`; used.add(name);
      mkClient(o.name, name, n); left -= n;
    }
  });
}
genNetwork();
// Délai de grâce (fictif) : environ 1 client sur 40 et le revendeur Burkina Faso ont un abonnement expiré depuis moins de 30 j
{ const ymd = k => { const d = new Date(REAL_TODAY.getTime() - k * DAY); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  ALL_CLIENTS.filter(c=>!c.blocked && !c.rev && c.id % 41 === 0).forEach(c=>{ c.exp = ymd(1 + (c.id * 7) % 29); });
  const bf = ALL_CLIENTS.find(c=>c.rev && c.name==='Burkina Faso'); if (bf) bf.exp = ymd(12); }

/* Graphique en colonnes générique : empilé ou groupé, colonne cliquable, légende cliquable */
function colChart(id, keys, labels, series, val, o={}){
  const vis = series.filter(s=>shown(o.chart, s.k));
  const tot = i => vis.reduce((n,s)=>n+val(i,s.k),0);
  const max = Math.max(1, ...keys.map((_,i)=> Math.max(o.group ? Math.max(0,...vis.map(s=>val(i,s.k))) : tot(i), o.cmp ? o.cmp(i) : 0)));
  $(id).innerHTML = keys.map((k,i)=>{
    const t = tot(i), top = o.group ? Math.max(0,...vis.map(s=>val(i,s.k))) : t;
    // o.cmp : barre grise de comparaison (ex. année précédente) à gauche de la barre du mois
    const cmpB = o.cmp ? `<div class="cc-b g cmp" style="height:${o.cmp(i)/max*100}%" title="${o.cmpL || 'Comparaison'} : ${o.cmp(i)}">${o.cmp(i) ? `<em>${o.cmp(i)}</em>` : ''}</div>` : '';
    const bars = cmpB + (o.group
      ? vis.map(s=>`<div class="cc-b g" style="height:${val(i,s.k)/max*100}%;background:${s.c}">${val(i,s.k)?`<em>${val(i,s.k)}</em>`:''}</div>`).join('')
      : `<div class="cc-b${o.cmp ? ' g' : ''}" style="height:${t/max*100}%">${!o.group && o.cmp && t ? `<em>${t}</em>` : ''}${vis.map(s=>val(i,s.k)?`<i style="flex:${val(i,s.k)};background:${o.color?o.color(i,s):s.c}"></i>`:'').join('')}</div>`);
    return `<button class="cc-c${o.sel===k?' sel':''}" data-ci="${k}" title="${labels[i]} · cliquer pour le détail">
      ${!o.group && !o.cmp && t ? `<span class="cc-n" style="bottom:calc(${top/max*100}% + 2px)">${t}</span>` : ''}<div class="cc-row">${bars}</div></button>`;
  }).join('');
  $(id+'X').innerHTML = labels.map((l,i)=>`<span class="${o.sel===keys[i]?'sel':''}">${l}</span>`).join('');
  $$(`${id} [data-ci]`).forEach(b=>b.onclick=()=>o.onPick(b.dataset.ci));
}
const $$ = s => [...document.querySelectorAll(s)];
const SEL = { log:null, logM:null, peak:null, flow:null, ech:null };
const li2 = (a,b='') => `<li><span>${a}</span><b>${b}</b></li>`;
// propriétaire en petit à côté du nom (super admin) ; noms en liste courte pour les recommandations
const ownSmall = c => VIEW ? '' : ` <small class="note">${c.reseller==='Tunav' ? 'Tunav' : `via ${c.reseller}`}</small>`;
const names = l => l.length > 5 ? `${l.slice(0,5).map(c=>c.name).join(', ')} et ${fmtN(l.length-5)} autre(s)` : l.map(c=>c.name).join(', ');

/* 1 · Connexion mensuelle : grille clients × mois */
const CCOL = ['#2563EB','#DC2626','#059669','#D97706','#7C3AED','#0891B2','#DB2777','#65A30D','#475569'];
const colOf = c => CCOL[CLIENTS.indexOf(c) % CCOL.length];
const mShort = k => MOIS_C[+k.slice(5)-1].replace('.','');
// Courbe SVG : une ligne par client (ou une seule), clic sur une ligne / un point = sélection
function lineChart(clients, months, sel, opts={}){
  const W = opts.w || 640, H = opts.h || 230, L = 34, R = 12, T = 14, B = 28;
  const max = Math.max(4, ...clients.flatMap(c=>months.filter(k=>k <= mk(TODAY)).map(k=>c.logm[k]||0)));
  const unit = opts.unit || ' connexion(s)', top = opts.top || Math.ceil(max/4/(max > 400 ? 100 : 1))*4*(max > 400 ? 100 : 1), x = i => L + i*(W-L-R)/(months.length-1), y = v => T + (H-T-B)*(1 - v/top);
  const grid = [0, .25, .5, .75, 1].map(f=>{ const v = Math.round(top*f); return `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="lc-g"/><text x="${L-6}" y="${y(v)+4}" class="lc-y">${v}${opts.top ? '%' : ''}</text>`; }).join('');
  const xl = months.map((k,i)=>`<text x="${x(i)}" y="${H-8}" class="lc-x${k > mk(TODAY) ? ' fut' : ''}">${mShort(k)}</text>`).join('');
  const lines = clients.map(c=>{ const on = !sel || sel===c.id, col = c.col || colOf(c);
    const pts = months.map((k,i)=>[x(i), y(c.logm[k]||0), c.logm[k]||0, k]).filter(p=>p[3] <= mk(TODAY));
    return `<g class="lc-l${on?' on':''}${sel===c.id?' sel':''}" data-lc="${c.id}" style="--c:${col}">
      <polyline points="${pts.map(p=>p[0]+','+p[1]).join(' ')}" fill="none" stroke="${col}"${c.dash ? ' stroke-dasharray="5 4"' : ''}/>
      <polyline points="${pts.map(p=>p[0]+','+p[1]).join(' ')}" fill="none" stroke="transparent" stroke-width="12"/>
      ${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="${sel===c.id?3.5:2.5}" fill="${col}"><title>${c.name} · ${mLabel(p[3])} : ${fmtN(p[2])}${unit}</title></circle>`).join('')}</g>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="lc" role="img" aria-label="Connexions par mois">${grid}${xl}${lines}</svg>`;
}

/* 1 · Connexion mensuelle : une courbe totale (et Tunav seul en pointillé côté super admin) ;
   la recherche d'un client affiche ses courbes et sa fiche résumée à droite */
function renderLog(){
  const act30 = CLIENTS.filter(c=>isActive(c) && c.last && daysSince(c.last) <= 30).length;
  const no30 = CLIENTS.filter(c=>isActive(c) && (!c.last || daysSince(c.last) > 30)).length;
  $('#logSub').innerHTML = `Nombre de connexions par mois, de janvier à décembre ${TODAY.getFullYear()} · ${fmtN(act30)} client(s) actif(s) connecté(s) dans les 30 derniers jours · ${fmtN(no30)} sans connexion · cherchez un client pour voir sa courbe`;
  const q = LOGQ.trim().toLowerCase();
  $('#logQx').classList.toggle('hidden', !q); $('#logMode').classList.toggle('hidden', !!q);   // recherche : courbes par client, en nombre
  if (q) return renderLogClients(q);
  // courbes agrégées : total des clients visibles, et Tunav (direct) seul pour le super admin sans filtre
  $$('#logMode [data-lmode]').forEach(b=>b.classList.toggle('on', b.dataset.lmode===LOGMODE));
  // mode « % » : part des clients (déjà clients ce mois-là) avec au moins une connexion dans le mois
  const sum = (list, k) => list.reduce((t,c)=>t+(c.logm[k]||0),0), isP = LOGMODE==='p';
  const pctOn = (list, k) => { const l = list.filter(c=>!c.since || c.since.slice(0,7) <= k); return l.length ? Math.round(l.filter(c=>(c.logm[k]||0) > 0).length*100/l.length) : 0; };
  const logOf = list => Object.fromEntries(MONTHS12.map(k=>[k, isP ? pctOn(list,k) : sum(list,k)]));
  // clients finaux d'un propriétaire (Tunav = ses clients directs, sans les revendeurs)
  const ownCl = name => CLIENTS.filter(c=>!c.rev && c.reseller===name), byOwn = !VIEW && !OWNER;
  if (!byOwn) LOGO.clear();
  // propriétaires cochés à droite : une courbe chacun ; sinon total réseau + Tunav (direct) en pointillé
  const series = LOGO.size ? NET.filter(o=>LOGO.has(o.name)).map(o=>({id:'o:'+o.name, name:o.name, col:o.col, logm:logOf(ownCl(o.name))}))
    : [{id:'tot', name: VIEW ? `Clients de ${VIEW}` : OWNER ? `Clients de ${OWNER}` : 'Total réseau', col:'#2563EB', logm:logOf(CLIENTS)}];
  if (byOwn && !LOGO.size) series.push({id:'tun', name:'Tunav (direct)', col:'#64748B', dash:true, logm:logOf(ownCl('Tunav'))});
  if (!SEL.logM || !ELAPSED.includes(SEL.logM)) SEL.logM = ELAPSED[ELAPSED.length-1];
  $('#logChart').innerHTML = lineChart(series, MONTHS12, null, isP ? {top:100, unit:' % de clients connectés'} : {});
  // légende : total de l'année (nombre) ou moyenne des mois écoulés (%)
  $('#logLeg').innerHTML = series.map(s=>{ const t = ELAPSED.reduce((t,k)=>t+(s.logm[k]||0),0);
    return `<span class="lg"><i class="dot" style="background:${s.col}"></i>${s.name} <span class="lg-t">${isP ? `moy. ${Math.round(t/ELAPSED.length)} %` : fmtN(t)}</span></span>`; }).join('');
  // détail du mois choisi : par propriétaire (super admin) ou clients les plus actifs
  const k = SEL.logM, on = CLIENTS.filter(c=>(c.logm[k]||0) > 0);
  // seuls comptent les clients déjà clients ce mois-là (un client arrivé en juin n'est pas « non connecté » en avril)
  const inK = c => !c.since || c.since.slice(0,7) <= k;
  // par propriétaire : clients connectés ce mois / clients du propriétaire → les non connectés sautent aux yeux
  const rows = byOwn
    ? NET.map(o=>{ const all = ownCl(o.name).filter(inK), l = all.filter(c=>(c.logm[k]||0) > 0); return {name:o.name, col:o.col, n:l.length, t:all.length, s:sum(l,k)}; }).filter(r=>r.t)
    : on.map(c=>({c, n:1, s:c.logm[k]})).sort((a,b)=>b.s-a.s);
  // clients sans connexion le mois choisi (mêmes clients que « non connecté(s) » ci-dessus ; propriétaires cochés seulement s'il y en a)
  const offM = CLIENTS.filter(c=>!c.rev && inK(c) && !(c.logm[k]||0) && (!LOGO.size || LOGO.has(c.reseller)));
  const ownRow = r => { const sel = LOGO.has(r.name), off = r.t - r.n, p = pct(r.n, r.t);
    return `<li class="lo-r${sel ? ' on' : ''}" data-lo="${r.name}" title="${sel ? 'Retirer' : 'Afficher'} la courbe de ${r.name}" style="--c:${r.col}">
      <span><i class="lo-ck"></i>${r.name}</span>
      <b>${fmtN(r.n)} / ${fmtN(r.t)} connectés · ${off ? `<button class="lo-off" data-lmoff-o="${r.name}" title="Voir les clients de ${r.name} sans connexion ce mois-ci">${fmtN(off)} non connecté(s) →</button>` : '<span style="color:var(--green)">0 non connecté</span>'} · ${fmtN(r.s)} connexion(s)
        <span class="st-bar" style="width:60px;margin:0 0 0 8px"><i style="width:${p}%;background:${p < 70 ? 'var(--amber)' : 'var(--green)'}"></i></span></b></li>`; };
  $('#logDet').innerHTML = `<div class="d-h"><b>${mLabel(k)}</b><span class="note"><b style="color:var(--ink)">${fmtN(sum(CLIENTS,k))}</b> connexion(s) · ${fmtN(on.length)} client(s)</span></div><div class="d-b">
    <div class="d-months m12">${MONTHS12.map(m=>m > mk(TODAY) ? `<span class="fut">${mShort(m)}<b></b></span>` : `<button class="${m===k?'on':''}" data-lm="${m}" title="${mLabel(m)}">${mShort(m)}<b>${fmtN(sum(CLIENTS,m))}</b></button>`).join('')}</div>
    <h4 class="dh">${byOwn ? `Par propriétaire <span class="note" style="text-transform:none;letter-spacing:0;font-weight:400">· cliquez pour afficher sa courbe (plusieurs possibles)</span>${LOGO.size ? ` <button class="lnk" data-lo-x style="border:0;background:none;padding:0;font:inherit;font-size:11px;color:var(--blue);cursor:pointer;text-transform:none;letter-spacing:0">revenir au total réseau ×</button>` : ''}` : 'Clients les plus actifs'}</h4>
    ${dpList('log', rows, r=> r.c ? li2(cLink(r.c), `${r.s} connexion(s)`) : ownRow(r), renderLog)}
    ${offM.length ? `<div class="d-dec relance"><span>${mLabel(k)}${LOGO.size ? ` · ${[...LOGO].join(', ')}` : ''} : <b>${fmtN(offM.length)} client(s)</b> sans aucune connexion ce mois-ci.</span><button class="relance-b" data-lmoff>Voir la liste →</button></div>` : ''}</div>`;
  $$('#logDet [data-lm]').forEach(b=>b.onclick=()=>{ SEL.logM = b.dataset.lm; DP.log = 0; renderLog(); });
  $$('#logDet [data-lmoff]').forEach(b=>b.onclick=()=>openMonthOff(k, offM));
  // « N non connecté(s) » d'un propriétaire : ses clients sans connexion ce mois (sans cocher sa courbe)
  $$('#logDet [data-lmoff-o]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); const o = b.dataset.lmoffO;
    openMonthOff(k, CLIENTS.filter(c=>!c.rev && c.reseller===o && inK(c) && !(c.logm[k]||0)), o); });
  $$('#logDet [data-lo]').forEach(b=>b.onclick=()=>{ const o = b.dataset.lo; LOGO.has(o) ? LOGO.delete(o) : LOGO.add(o); renderLog(); });
  $$('#logDet [data-lo-x]').forEach(b=>b.onclick=()=>{ LOGO.clear(); renderLog(); });
}
// dernière connexion d'un client avant le mois k et nombre de jours sans connexion à la fin de ce mois
// (aujourd'hui pour le mois en cours). Date exacte si sa dernière connexion est avant k, sinon fin du dernier mois actif.
function offSince(c, k){
  const [y, m] = k.split('-').map(Number), start = new Date(y, m-1, 1), ref = k === mk(TODAY) ? TODAY : new Date(y, m, 0);
  let d = null, exact = false;
  if (c.last && new Date(c.last) < start){ d = new Date(c.last); exact = true; }
  else { const pm = Object.keys(c.logm).filter(x=>x < k && c.logm[x] > 0).sort().pop();
    if (pm){ const [py, pmo] = pm.split('-').map(Number); d = new Date(py, pmo, 0); } }
  return d ? {d, exact, days: Math.max(0, Math.round((d0(ref) - d0(d)) / DAY))} : null;
}
// liste des clients sans connexion pendant le mois k : jamais connectés puis les plus longtemps sans connexion en tête
function openMonthOff(k, list, who){
  const rows = list.map(c=>({c, o:offSince(c,k)})).sort((a,b)=>(b.o ? b.o.days : 1e9) - (a.o ? a.o.days : 1e9) || a.c.name.localeCompare(b.c.name));
  const never = rows.filter(r=>!r.o).length;
  modal(`Sans connexion en ${mLabel(k)}${who ? ` <span class="tag blue" style="vertical-align:middle;margin-left:6px">${who}</span>` : ''}`, `
    <p class="dl" style="margin-top:0"><b>${fmtN(rows.length)} client(s)</b> sans aucune connexion ce mois-ci${never ? ` · dont <b style="color:var(--red)">${fmtN(never)} jamais connecté(s)</b>` : ''}${!who && splitOwners(rows.map(r=>r.c)) ? ` · ${splitOwners(rows.map(r=>r.c))}` : ''} · triés du plus long au plus court sans connexion · cliquez sur un client pour ouvrir sa fiche</p>
    <table class="ft-t al-t"><thead><tr><th>Client</th><th>Sans connexion depuis</th><th>Dernière connexion avant ${mShort(k)}</th><th>Statut</th></tr></thead><tbody>
      ${rows.map(({c,o})=>`<tr data-oc="${c.id}"><td><b>${c.name}${who ? '' : ownSmall(c)}</b></td>
        <td>${o ? `<b style="color:${o.days > 60 ? 'var(--red)' : 'var(--amber)'}">${o.exact ? '' : '≈ '}${fmtN(o.days)} j</b>` : '<b style="color:var(--red)">jamais connecté</b>'}</td>
        <td>${o ? (o.exact ? fmtD(o.d) : `en ${mLabel(mk(o.d))}`) : '—'}</td><td>${stHtml(!isActive(c))}</td></tr>`).join('')}</tbody></table>`, 'C-01', 680);
}
// recherche : courbes des clients trouvés (8 au plus) et résumé du client choisi
function renderLogClients(q){
  const found = CLIENTS.filter(c=>c.name.toLowerCase().includes(q)), shownC = found.slice(0, 8);
  if (!shownC.length){ $('#logChart').innerHTML = `<p class="note" style="text-align:center;padding:40px 0">Aucun client ne correspond à « ${LOGQ.replace(/</g,'&lt;')} ».</p>`; $('#logLeg').innerHTML = ''; $('#logDet').innerHTML = ''; return; }
  if (!SEL.log || !shownC.some(c=>c.id===SEL.log)) SEL.log = shownC[0].id;
  $('#logChart').innerHTML = lineChart(shownC, MONTHS12, SEL.log);
  $('#logLeg').innerHTML = `<span class="note" style="align-self:center">${found.length > 8 ? `8 premiers sur ${fmtN(found.length)}` : `${found.length} client(s)`}</span>` + shownC.map(c=>{ const tot = ELAPSED.reduce((n,k)=>n+(c.logm[k]||0),0);
    return `<button class="lg${SEL.log===c.id?' on':''}" data-lc="${c.id}"><i class="dot" style="background:${colOf(c)}"></i>${c.name} <span class="lg-t">${tot}</span></button>`; }).join('');
  $$('#logChart [data-lc], #logLeg [data-lc]').forEach(b=>b.onclick=()=>{ SEL.log = +b.dataset.lc; renderLog(); });
  const c = CLIENTS.find(x=>x.id===SEL.log), n = ELAPSED.filter(k=>(c.logm[k]||0) > 0).length, tot = ELAPSED.reduce((t,k)=>t+(c.logm[k]||0),0);
  $('#logDet').innerHTML = `<div class="d-h"><b><i class="dot" style="background:${colOf(c)}"></i>${c.name}</b>${statusHtml(c)}</div><div class="d-b">
    <div class="d-kv"><span>Mois avec connexion</span><b>${n} / ${ELAPSED.length}</b></div>
    <div class="d-kv"><span>Connexions depuis janvier</span><b>${tot}</b></div>
    <div class="d-kv"><span>Dernière connexion</span><b>${c.last ? fmtD(c.last) : 'jamais'}${c.ch && c.last ? ` · ${c.ch}` : ''}</b></div>
    <div class="d-kv"><span>Depuis</span><b class="${!c.last || daysSince(c.last) > P.inact ? 'bad' : 'ok'}">${c.last ? daysSince(c.last)+' j' : '—'}</b></div>
    <div class="d-kv"><span>Pack${c.packs.length>1?'s':''}</span><b>${packsHtml(c)}</b></div>
    <div class="d-months m12">${MONTHS12.map(k=>k > mk(TODAY) ? `<span class="fut" title="${mLabel(k)} : à venir">${mShort(k)}<b></b></span>` : `<span class="${(c.logm[k]||0)?'on':''}" title="${mLabel(k)} : ${c.logm[k]||0} connexion(s)">${mShort(k)}<b>${c.logm[k]||''}</b></span>`).join('')}</div>
    <button class="btn sm" data-eye="${c.id}" style="margin-top:10px">Voir la fiche du client →</button></div>`;
  $$('#logDet [data-eye]').forEach(b=>b.onclick=()=>openClient(+b.dataset.eye));
}

/* ---------- Fiche « Détails du client » (œil du tableau), uniquement avec les KPI v3 ---------- */
let FICHE_TAB = 'syn';
function priority(c){
  const r = [], du = c.exp ? daysUntil(c.exp) : null, off = c.eq.length - connCount(c), never = c.eq.filter(neverSent).length;
  if (!isActive(c)) r.push(['crit', c.blocked ? 'Client bloqué' : 'Abonnement expiré']);
  if (inGrace(c)) r.push(['crit', `Abonnement expiré : ${W.grace(c).toLowerCase()} (le ${blockDate(c).toLocaleDateString('fr-FR')})`]);
  if (du !== null && du >= 0 && du <= 10) r.push(['crit', W.exp(du), 'Valider le paiement']);
  if (never) r.push(['crit', `${never} équipement(s) affecté(s) jamais connecté(s)`, 'Vérifier l’installation (facturé sans usage)']);
  if (isActive(c) && (!c.last || daysSince(c.last) > P.inact)) r.push(['risk', W.login(c), 'Appeler le client']);
  if (c.eq.length && off * 100 / c.eq.length > P.pctOff) r.push(['risk', W.eqOff(c), 'Ouvrir un ticket SAV']);
  if (du !== null && du > 10 && du <= P.renew) r.push(['watch', W.exp(du), 'Préparer le renouvellement']);
  const lvl = r.some(x=>x[0]==='crit') ? 'crit' : r.some(x=>x[0]==='risk') ? 'risk' : r.length ? 'watch' : 'ok';
  return { lvl, reasons:r, label:{crit:'Critique', risk:'À risque', watch:'À surveiller', ok:'OK'}[lvl] };
}
function openClient(id){
  const c = CLIENTS.find(x=>x.id===id); if (!c) return;
  const pr = priority(c), du = c.exp ? daysUntil(c.exp) : null, on = connCount(c), never = c.eq.filter(neverSent).length;
  const tot = ELAPSED.reduce((t,k)=>t+(c.logm[k]||0),0), nm = ELAPSED.filter(k=>(c.logm[k]||0)>0).length;
  const tile = (t, v, sub, cls='') => `<div class="ft-k ${cls}"><span>${t}</span><b>${v}</b><small>${sub}</small></div>`;
  const tabs = { syn:'Synthèse', eq:`Équipements (${c.eq.length})`, act:'Activité' };
  const body = {
    syn: `<div class="ft-grid">
        ${tile('Abonnement', du===null ? '—' : du < 0 ? (inGrace(c) ? `bloqué dans ${blockIn(c)} j` : `expiré`) : `J-${du}`, c.exp ? (du < 0 ? (inGrace(c) ? `expiré le ${fmtD(c.exp)} · blocage le ${blockDate(c).toLocaleDateString('fr-FR')}` : `depuis le ${fmtD(c.exp)}`) : `échéance le ${fmtD(c.exp)}`) : 'sans échéance', du!==null && du < 0 ? 'bad' : du!==null && du <= P.renew ? 'warn' : '')}
        ${tile('Équipements connectés', `${on} / ${c.eq.length}`, c.eq.length ? `${pct(on,c.eq.length)} % · position < 24 h` : 'aucun équipement', c.eq.length && on < c.eq.length ? 'warn' : '')}
        ${tile('Jamais connectés', never, never ? 'affectés donc facturés' : 'aucun', never ? 'bad' : '')}
        ${tile('Dernière connexion', c.last ? `${daysSince(c.last)} j` : 'jamais', c.last ? `${fmtD(c.last)}${c.ch ? ' · '+c.ch : ''}` : 'aucun utilisateur connecté', !c.last || daysSince(c.last) > P.inact ? 'bad' : '')}
        ${tile(`Activité ${TODAY.getFullYear()}`, `${nm} / ${ELAPSED.length}`, `mois avec connexion · ${tot} connexion(s)`)}
        ${tile('Client depuis', c.since ? fmtD(c.since) : '—', c.blockedOn ? `bloqué le ${fmtD(c.blockedOn)}` : c.rev ? 'revendeur' : 'client final')}
      </div>
      <h4 class="dh">Pourquoi « ${pr.label} »</h4>
      <ul class="ft-why">${pr.reasons.map(r=>`<li class="${r[0]}"><span>${r[1]}</span></li>`).join('') || '<li class="ok"><span>Aucun signal d’alerte</span></li>'}</ul>
      <div class="ft-mini"><h4 class="dh">Connexions par mois (${TODAY.getFullYear()})</h4>${lineChart([c], MONTHS12, c.id, {w:620, h:150})}</div>`,
    eq: c.eq.length ? `<table class="ft-t"><thead><tr><th>N° série</th><th>Pack</th><th>Affecté le</th><th>1er envoi</th><th>Dernière position</th><th>Connexion</th></tr></thead><tbody>${c.eq.map(e=>{
        const st = !e[2] ? '<span class="st off"><i></i>Jamais connecté</span>' : eqConnected(e) ? '<span class="st on"><i></i>Connecté</span>' : `<span class="st off"><i></i>Non connecté · ${daysSince(e[3])} j</span>`;
        return `<tr><td class="mono">${e[0]}</td><td>${badgeP(e[4])}</td><td>${fmtD(e[1])}</td><td>${fmtD(e[2])}</td><td>${fmtDT(e[3])}</td><td>${st}</td></tr>`; }).join('')}</tbody></table>`
      : '<p class="note" style="padding:20px;text-align:center">Aucun équipement affecté.</p>',
    act: `<div class="ft-mini">${lineChart([c], MONTHS12, c.id, {w:620, h:170})}</div>
      <div class="d-months m12">${MONTHS12.map(k=>k > mk(TODAY) ? `<span class="fut">${mShort(k)}<b></b></span>` : `<span class="${(c.logm[k]||0)?'on':''}">${mShort(k)}<b>${c.logm[k]||''}</b></span>`).join('')}</div>
      <div class="ft-grid" style="margin-top:12px">${tile('Mois avec connexion', `${nm} / ${ELAPSED.length}`, '')}${tile('Connexions', tot, 'depuis janvier')}${tile('Canal', c.ch || '—', 'de la dernière connexion')}</div>`,
  };
  $('#modal').innerHTML = `<div class="ov" id="ov"><div class="modal fiche" role="dialog" aria-modal="true">
    <div class="mh"><div class="ft-id"><span class="ft-av">${c.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</span><div><h3>${c.name}</h3>
      <div class="ft-tags"><span class="type ${c.rev?'rev':''}">${c.rev?'Revendeur':'Client final'}</span>${statusHtml(c)}<span class="note">Propriétaire : ${c.reseller}</span>${packsHtml(c)}</div></div></div>
      <div class="ft-pr ${pr.lvl}"><small>Priorité</small><b>${pr.label}</b></div>
      <button class="x" data-x aria-label="Fermer">×</button></div>
    <div class="ft-tabs">${Object.entries(tabs).map(([k,l])=>`<button data-ft="${k}" class="${FICHE_TAB===k?'on':''}">${l}</button>`).join('')}</div>
    <div class="mb">${body[FICHE_TAB]}</div>
    <div class="mf"><button class="btn primary" data-x>Fermer</button></div></div></div>`;
  $('#ov').onclick = e => { if (e.target.id==='ov' || e.target.closest('[data-x]')) $('#modal').innerHTML = ''; };
  $$('#modal [data-ft]').forEach(b=>b.onclick=()=>{ FICHE_TAB = b.dataset.ft; openClient(id); });
}

/* 2 · Pic du nombre de clients connectés */
function renderPeak(){
  const cnt = k => CLIENTS.filter(c=>c.act.includes(k)).length;
  const peakK = MONTHS6.reduce((a,k)=>cnt(k) > cnt(a) ? k : a, MONTHS6[0]);
  if (!SEL.peak) SEL.peak = peakK;
  const lastLog = CLIENTS.filter(c=>c.last && c.ch && daysSince(c.last) <= 180);
  $('#peakSub').innerHTML = `Pic : <b>${cnt(peakK)} clients</b> connectés en ${mLabel(peakK)} · dernière connexion via PC ${lastLog.filter(c=>c.ch==='PC').length} · Mobile ${lastLog.filter(c=>c.ch==='Mobile').length}`;
  colChart('#peak', MONTHS6, MONTHS6.map(k=>MOIS_C[+k.slice(5)-1] + (k===peakK?' · pic':'')), [{k:'n',l:'Connectés',c:'#93C5FD'}],
    (i)=>cnt(MONTHS6[i]), { chart:'peak', sel:SEL.peak, color:(i)=>MONTHS6[i]===peakK?'#1D4ED8':'#93C5FD', onPick:k=>{ SEL.peak = k; DP.pkOn = DP.pkOff = 0; renderPeak(); } });
  const k = SEL.peak, on = CLIENTS.filter(c=>c.act.includes(k)), off = CLIENTS.filter(c=>isActive(c) && !c.act.includes(k) && (!c.since || c.since.slice(0,7) <= k));
  $('#peakDet').innerHTML = `<div class="d-h"><b>${mLabel(k)}</b><span class="note"><b style="color:var(--ink)">${on.length}</b> connecté(s)${k===peakK?' · pic':''}</span></div><div class="d-b">
    <h4 class="dh">Connectés (${fmtN(on.length)})</h4>${dpList('pkOn', on, c=>li2(cLink(c) + ownSmall(c), inMonth(c.last,k) && c.ch ? c.ch : '✓'), renderPeak)}
    <h4 class="dh">Actifs sans connexion ce mois-ci (${fmtN(off.length)})</h4>${dpList('pkOff', off, c=>li2(cLink(c) + ownSmall(c), c.last ? `dernière : ${fmtD(c.last)}` : 'jamais'), renderPeak)}</div>`;
}

/* 3 · Nouveaux clients vs clients bloqués */
function renderFlow(){
  const SER = [{k:'new',l:'Nouveaux clients',c:'#2563EB'},{k:'blk',l:'Clients bloqués',c:'#DC2626'}];
  const v = (i,k) => CLIENTS.filter(c=> k==='new' ? inMonth(c.since, MONTHS6[i]) : inMonth(c.blockedOn, MONTHS6[i])).length;
  if (!SEL.flow) SEL.flow = [...MONTHS6].reverse().find((k,j)=>v(5-j,'new')+v(5-j,'blk')) || MONTHS6[5];
  colChart('#flow', MONTHS6, MONTHS6.map(k=>MOIS_C[+k.slice(5)-1]), SER, v, { chart:'flow', group:true, sel:SEL.flow, onPick:k=>{ SEL.flow = k; DP.flNew = DP.flBlk = 0; renderFlow(); } });
  legend('#flowLeg', 'flow', SER);
  const k = SEL.flow, nw = CLIENTS.filter(c=>inMonth(c.since,k)), bl = CLIENTS.filter(c=>inMonth(c.blockedOn,k));
  $('#flowDet').innerHTML = `<div class="d-h"><b>${mLabel(k)}</b><span class="note">+${nw.length} / −${bl.length}</span></div><div class="d-b">
    ${shown('flow','new') ? `<h4 class="dh">Nouveaux clients (${nw.length})</h4>${dpList('flNew', nw, c=>li2(cLink(c) + ownSmall(c), `créé le ${fmtD(c.since)} · ${packNames(c)}`), renderFlow)}` : ''}
    ${shown('flow','blk') ? `<h4 class="dh">Clients bloqués (${bl.length})</h4>${dpList('flBlk', bl, c=>li2(cLink(c) + ownSmall(c), `${W.block(c)} · Échéance ${fmtD(c.exp)}`), renderFlow)}` : ''}</div>`;
}

/* 4 · Échéances des packs par mois */
let ECH_Y = null, ECH_CMP = 0;   // ECH_CMP : 0 = pas de comparaison, n = comparer avec l'année choisie - n
const ECHO = new Set();          // propriétaires filtrés (vide = tous)
// échéance d'un client dans l'année y (packs annuels) : son échéance actuelle, ou la même date une année
// antérieure s'il était déjà client (échéance passée et renouvelée). null s'il n'en a pas cette année-là.
function expIn(c, y){
  if (!c.exp) return null;
  const ey = +c.exp.slice(0,4); if (y > ey) return null;
  const d = y === ey ? c.exp : `${y}${c.exp.slice(4)}`;
  return c.since && c.since > d ? null : d;
}
function renderEch(){
  const SER = [{k:'ren',l:'Renouvelé',c:'#059669'},{k:'past',l:'Déjà expiré',c:'#DC2626'},{k:'soon',l:`Dans ${P.renew} j`,c:'#D97706'},{k:'later',l:'Plus tard',c:'#2563EB'}];
  const lvl = c => daysUntil(c.exp) < 0 ? 'past' : daysUntil(c.exp) <= P.renew ? 'soon' : 'later';
  // échéance de l'année y : date + état (renouvelée si ce n'est pas l'échéance actuelle du client)
  // (une échéance antérieure n'est « renouvelée » que si sa date est déjà passée)
  const at = (c, y) => { const d = expIn(c, y); return d && (d === c.exp || daysUntil(d) < 0) && {c, d, l: d === c.exp ? lvl(c) : 'ren'}; };
  // filtre propriétaires (super admin) : Tunav = ses clients directs et l'abonnement des revendeurs
  const byOwn = !VIEW && !OWNER; if (!byOwn) ECHO.clear();
  const pool = CLIENTS.filter(c=>!ECHO.size || ECHO.has(c.reseller));
  const yearOf = y => pool.map(c=>at(c,y)).filter(Boolean);
  // janvier → décembre de l'année choisie (année de « État au » à l'ouverture, ‹ › pour changer d'année)
  if (!ECH_Y) ECH_Y = TODAY.getFullYear();
  const keys = Array.from({length:12}, (_,i)=>`${ECH_Y}-${String(i+1).padStart(2,'0')}`), cur = yearOf(ECH_Y);
  const v = (i,k) => cur.filter(e=>e.d.slice(0,7)===keys[i] && e.l===k).length;
  const cy = ECH_CMP ? ECH_Y - ECH_CMP : null, cmpE = cy ? yearOf(cy) : [];
  const cv = i => cmpE.filter(e=>e.d.slice(5,7)===keys[i].slice(5,7)).length;
  // taux du jour : clients du filtre ayant une échéance, déjà expirés / à échéance sous P.renew jours
  const wE = pool.filter(c=>c.exp), past = wE.filter(c=>lvl(c)==='past').length, soon = wE.filter(c=>lvl(c)==='soon').length;
  const renRate = l => { const r = l.filter(e=>e.l==='ren').length, p = l.filter(e=>e.l==='past').length; return r+p ? pct(r, r+p) : null; };
  $('#echSub').innerHTML = `<span class="ynav"><button data-ey="-1" aria-label="Année précédente">‹</button><b>${ECH_Y}</b><button data-ey="1" aria-label="Année suivante">›</button></span> · ${past} déjà expiré(s) · ${soon} expirent dans les ${P.renew} prochains jours${cy ? ` · <span class="note">barres hachurées : ${cy}</span>` : ''}`;
  $$('#echSub [data-ey]').forEach(b=>b.onclick=()=>{ ECH_Y += +b.dataset.ey; SEL.ech = null; DP.ech = 0; renderEch(); });
  $('#echCtl').innerHTML = (byOwn ? `<button class="oc${ECHO.size ? '' : ' on'}" data-eo="">Tous</button>${NET.map(o=>`<button class="oc${ECHO.has(o.name) ? ' on' : ''}" data-eo="${o.name}"><i class="dot" style="background:${o.col}"></i>${o.name}</button>`).join('')}` : '')
    + `<select id="echCmp" aria-label="Comparer avec"><option value="0">Sans comparaison</option>${[1,2,3].map(n=>`<option value="${n}"${ECH_CMP===n?' selected':''}>Comparer avec ${ECH_Y-n}${n===1?' (année précédente)':''}</option>`).join('')}</select>`;
  $$('#echCtl [data-eo]').forEach(b=>b.onclick=()=>{ const o = b.dataset.eo; if (!o) ECHO.clear(); else ECHO.has(o) ? ECHO.delete(o) : ECHO.add(o); DP.ech = 0; renderEch(); });
  $('#echCmp').onchange = e=>{ ECH_CMP = +e.target.value; renderEch(); };
  const rC = renRate(cur), rP = cy ? renRate(cmpE) : null;
  $('#echK').innerHTML = `<div><b style="color:var(--red)">${pct(past, wE.length)} %</b> <small>clients expirés · ${fmtN(past)} / ${fmtN(wE.length)}</small></div>
    <div><b style="color:var(--amber)">${pct(soon, wE.length)} %</b> <small>échéance ≤ ${P.renew} j · ${fmtN(soon)} / ${fmtN(wE.length)}</small></div>
    ${rC !== null ? `<div><b style="color:var(--green)">${rC} %</b> <small>renouvelés en ${ECH_Y} (échéances passées)${rP !== null ? ` · ${cy} : <b style="font-size:11.5px;color:${rC>=rP?'var(--green)':'var(--red)'}">${rP} %</b>` : ''}</small></div>` : ''}`;
  if (!SEL.ech || !keys.includes(SEL.ech)) SEL.ech = keys.includes(mk(TODAY)) ? mk(TODAY) : keys.find(k=>cur.some(e=>e.d.slice(0,7)===k)) || keys[0];
  colChart('#ech', keys, keys.map((k,i)=>`${MOIS_C[i].replace('.','')}${i===0?` ${String(ECH_Y).slice(2)}`:''}`), SER, v,
    { chart:'ech', sel:SEL.ech, cmp: cy ? cv : null, cmpL: cy, onPick:k=>{ SEL.ech = k; DP.ech = 0; renderEch(); } });
  legend('#echLeg', 'ech', SER);
  if (cy) $('#echLeg').insertAdjacentHTML('beforeend', `<span class="lg"><i class="dot" style="background:#CBD5E1"></i>${cy}</span>`);
  const list = cur.filter(e=>e.d.slice(0,7)===SEL.ech && shown('ech', e.l)).sort((a,b)=>a.d.localeCompare(b.d));
  const nPrev = cy ? cv(keys.indexOf(SEL.ech)) : null;
  $('#echDet').innerHTML = `<div class="d-h"><b>Échéances ${mLabel(SEL.ech)}</b><span class="note">${list.length} client(s)${nPrev !== null ? ` · ${cy} : ${nPrev}` : ''}</span></div><div class="d-b">
    ${dpList('ech', list, ({c,d,l})=>{ const du = daysUntil(d);
      return li2(`${cLink(c)} ${statusHtml(c)}${ownSmall(c)}`, `${packNames(c)} · ${fmtD(d)} ${l==='ren' ? `<span class="ago ok">renouvelé</span>` : `<span class="ago ${du<0?'bad':du<=P.renew?'warn':'ok'}">${du<0?'expiré':'J-'+du}</span>`}`); }, renderEch)}</div>`;
}
let LOGQ = '';
const LOGO = new Set();   // propriétaires cochés dans « Par propriétaire » (une courbe chacun)
let LOGMODE = 'n';        // courbes : 'n' nombre de connexions · 'p' % de clients connectés
$$('#logMode [data-lmode]').forEach(b=>b.onclick=()=>{ LOGMODE = b.dataset.lmode; renderLog(); });
$('#logQL').innerHTML = CLIENTS.map(c=>`<option value="${c.name}">`).join('');
$('#logQ').addEventListener('input', e=>{ LOGQ = e.target.value; renderLog(); });
$('#logQx').onclick = e=>{ e.preventDefault(); LOGQ = ''; $('#logQ').value = ''; renderLog(); };
function renderActivity(){ renderLog(); renderPeak(); renderFlow(); renderEch(); }

/* Carte « Statut des clients » : détail avec la répartition par statut */
// Super admin : tout le réseau (Tunav + revendeurs et leurs clients) · revendeur : ses clients. Bloqués en tête, paginé.
function openStatus(){
  const pool = statusPool(), net = netData(), tot = pool.length, blk = pool.filter(c=>c.off).length, warn = pool.filter(c=>stRank(c)===1).length, a = pct(tot-blk, tot);
  Object.assign(TT, {q:'', own:'', p:{}, render:stRender});
  const owners = VIEW ? [] : net.map(o=>{ const l = pool.filter(c=>c.owner===o.name), b = l.filter(c=>c.off).length; return {o, n:l.length, b}; });
  modal(`Statut des clients${VIEW ? ` <span class="tag blue" style="vertical-align:middle;margin-left:6px">${VIEW}</span>` : ''}`, `<div id="stW">
    <div class="donut-w"><div class="donut" style="background:conic-gradient(var(--green) 0 ${a}%, var(--red) ${a}% 100%)"><div><b>${fmtN(tot)}</b><small>clients</small></div></div>
      <div class="dleg"><div><i class="dot" style="background:var(--green)"></i>Actifs <b>${fmtN(tot-blk)}</b> (${a} %)</div><div><i class="dot" style="background:var(--red)"></i>Bloqués <b>${fmtN(blk)}</b> (${100-a} %)</div>
      <p class="note">${fmtN(warn)} actif(s) avec un signal d'alerte</p></div></div>
    ${VIEW ? '' : `<h4 class="dh">Par propriétaire</h4>
    <table class="ft-t st-own"><thead><tr><th>Propriétaire</th><th>Actifs</th><th>Bloqués</th><th style="width:34%">Part bloquée</th></tr></thead><tbody>
      ${owners.map(({o,n,b})=>`<tr data-sto="${o.name}"><td><i class="dot" style="background:${o.col}"></i><b>${o.name}</b>${o.direct ? ' <small class="note">direct + revendeurs</small>' : ''}</td><td style="color:var(--green)">${fmtN(n-b)}</td><td style="color:var(--red)">${fmtN(b)}</td>
        <td><span class="st-bar"><i style="width:${Math.max(pct(b,n), b ? 2 : 0)}%"></i></span><small class="note">${pct(b,n)} %</small></td></tr>`).join('')}</tbody></table>
    ${ownTabs(net)}`}
    <input class="tt-q" id="ttQ" type="search" placeholder="Rechercher un client…" aria-label="Rechercher un client">
    <div id="stL"></div></div>`, 'K-02', 720);
  $('#ttQ').oninput = e => { TT.q = e.target.value.trim(); TT.p.d = 0; stRender(); };
  if (!VIEW) $('#stRv').onchange = e => stOwn(e.target.value);
  stRender();
}
// filtre propriétaire commun aux détails Statut et Équipements (TT.render = rendu de la liste ouverte)
function stOwn(v){
  TT.own = v; TT.p.d = 0;
  $$('[data-stt]').forEach(b=>b.classList.toggle('on', b.dataset.stt===v));
  const rvSel = v && v!=='Tunav'; $('#stRv').classList.toggle('on', rvSel); $('#stRv').value = rvSel ? v : '';
  $$('[data-sto]').forEach(r=>r.classList.toggle('sel', r.dataset.sto===v));
  TT.render();
}
const ownOk = c => !TT.own || (TT.own==='*rv' ? c.owner!=='Tunav' : c.owner===TT.own);
const ownTabs = net => `<div class="st-tabs"><button data-stt="" class="on">Tous</button><button data-stt="Tunav">Clients Tunav</button>
  <select id="stRv" aria-label="Clients des revendeurs"><option value="" hidden>Clients revendeurs</option><option value="*rv">Tous les revendeurs</option>${net.slice(1).map(o=>`<option value="${o.name}">${o.name}</option>`).join('')}</select></div>`;
const ownLbl = () => !TT.own ? 'Tous les clients' : TT.own==='Tunav' ? 'Clients Tunav' : TT.own==='*rv' ? 'Clients des revendeurs' : `Clients de ${TT.own}`;
const ownTag = c => VIEW ? '' : `<small class="note">${c.owner==='Tunav' ? 'Tunav' : `via ${c.owner}`}</small>`;

/* Équipements connectés (mode 'on') ou non connectés ('off') : réseau complet ou clients du revendeur, paginé */
function openEq(mode){
  const isOn = mode === 'on', net = netData(), pool = eqPool(), all = pool.reduce((t,c)=>t+c.n,0);
  const val = c => isOn ? c.n - c.offN : c.offN, n = pool.reduce((t,c)=>t+val(c),0), col = isOn ? 'var(--green)' : 'var(--red)';
  Object.assign(TT, {q:'', own:'', p:{}, render:()=>eqRender(isOn)});
  const owners = VIEW ? [] : net.map(o=>{ const l = o.clients, t = l.reduce((s,c)=>s+c.n,0), v = l.reduce((s,c)=>s+val(c),0); return {o, t, v}; });
  let acc = 0; const grad = VIEW ? `${col} 0 ${pct(n,all)}%, var(--line2) ${pct(n,all)}% 100%`
    : owners.map(({o,v})=>{ const p = n ? v*100/n : 0, s = `${o.col} ${acc}% ${acc+p}%`; acc += p; return s; }).join(',');
  modal(`Équipements ${isOn ? 'connectés' : 'non connectés'} <span class="tag ${isOn?'blue':'red'}" style="vertical-align:middle;margin-left:6px">${fmtN(n)} / ${fmtN(all)} · ${pct(n,all)} %</span>${VIEW ? ` <span class="tag blue" style="vertical-align:middle">${VIEW}</span>` : ''}`, `<div id="eqW">
    <div class="st-tabs" style="margin:0 0 12px"><button data-eqm="on" class="${isOn?'on':''}">Connectés</button><button data-eqm="off" class="${isOn?'':'on'}">Non connectés</button></div>
    <div class="donut-w"><div class="donut" style="background:conic-gradient(${grad})"><div><b>${fmtN(n)}</b><small>sur ${fmtN(all)}</small></div></div>
      <div class="dleg">${VIEW ? `<div><i class="dot" style="background:${col}"></i>${isOn ? 'Connectés' : 'Non connectés'} <b>${pct(n,all)} %</b></div>`
        : owners.map(({o,v})=>`<div><i class="dot" style="background:${o.col}"></i>${o.name} <b>${fmtN(v)}</b> (${pct(v,n)} %)</div>`).join('')}
      <p class="note">${isOn ? `Position reçue il y a moins de ${P.hours} h` : `Aucune position depuis plus de ${P.hours} h`} · cliquez sur un client pour voir ses équipements</p></div></div>
    ${VIEW ? '' : `<h4 class="dh">Par propriétaire</h4>
    <table class="ft-t st-own"><thead><tr><th>Propriétaire</th><th>${isOn ? 'Connectés' : 'Non connectés'}</th><th>Parc</th><th style="width:34%">Part du parc</th></tr></thead><tbody>
      ${owners.map(({o,t,v})=>`<tr data-sto="${o.name}"><td><i class="dot" style="background:${o.col}"></i><b>${o.name}</b>${o.direct ? ' <small class="note">direct</small>' : ''}</td><td style="color:${col}">${fmtN(v)}</td><td>${fmtN(t)}</td>
        <td><span class="st-bar"><i style="width:${pct(v,t)}%;background:${col}"></i></span><small class="note">${pct(v,t)} %</small></td></tr>`).join('')}</tbody></table>
    ${ownTabs(net)}`}
    <input class="tt-q" id="ttQ" type="search" placeholder="Rechercher un client…" aria-label="Rechercher un client">
    <div id="stL"></div></div>`, isOn ? 'K-04' : 'K-05', 720);
  $('#ttQ').oninput = e => { TT.q = e.target.value.trim(); TT.p.d = 0; eqRender(isOn); };
  if (!VIEW) $('#stRv').onchange = e => stOwn(e.target.value);
  eqRender(isOn);
}
// clients triés par nombre d'équipements dans ce mode (les plus touchés en tête)
function eqRender(isOn){
  const el = $('#stL'); if (!el) return;
  const q = TT.q.toLowerCase(), val = c => isOn ? c.n - c.offN : c.offN, col = isOn ? 'var(--green)' : 'var(--red)';
  const list = eqPool().filter(c=>val(c) > 0 && ownOk(c) && (!q || c.name.toLowerCase().includes(q))).sort((a,b)=>val(b)-val(a) || a.name.localeCompare(b.name));
  const tot = list.reduce((t,c)=>t+val(c),0);
  const row = c => `<li><span>${c.id ? cLink(c).replace('data-oc', 'data-tab="eq" data-oc') : `<span>${c.name}</span>`} ${stHtml(c.off)}${ownTag(c)}${c.packs}</span>
    <b><span style="color:${col}">${fmtN(val(c))}</span> / ${fmtN(c.n)} équip.<span class="st-bar" style="width:70px;margin:0 0 0 8px"><i style="width:${pct(val(c),c.n)}%;background:${col}"></i></span></b></li>`;
  el.innerHTML = `<h4 class="dh">${q ? 'Résultats' : ownLbl()} (${fmtN(list.length)}) · ${fmtN(tot)} équip. ${isOn ? 'connectés' : 'non connectés'}</h4><ul class="dlist">${ttSlice('d',list).map(row).join('') || li2('Aucun client')}</ul>${ttPager('d',list.length)}`;
}
function stRender(){
  const el = $('#stL'); if (!el) return;
  const q = TT.q.toLowerCase(), lbl = ownLbl();
  const list = stSort(statusPool().filter(c=>ownOk(c) && (!q || c.name.toLowerCase().includes(q))));
  // client : statut, pack(s) et équipements connectés / affectés
  const eqCell = c => { if (!c.n) return '<span class="note">Aucun équipement</span>';
    const on = c.n - c.offN, ok = on === c.n;
    return `<span style="color:${ok ? 'var(--green)' : 'var(--red)'}">${fmtN(on)}</span> / ${fmtN(c.n)} équip. conn.<span class="st-bar" style="width:60px;margin:0 0 0 8px"><i style="width:${pct(on,c.n)}%;background:${ok ? 'var(--green)' : 'var(--amber)'}"></i></span>`; };
  const row = c => `<li><span>${c.id ? cLink(c) : `<span>${c.name}</span>`} ${stHtml(c.off)}${c.rv ? '<span class="tag blue">Revendeur</span>' : ''}${ownTag(c)}${c.packs}</span>
    <b>${eqCell(c)}<br>${c.off ? `<span style="color:var(--red)">${c.blk}</span>${c.exp ? ` <span class="note">· Échéance ${fmtD(c.exp)}</span>` : ''}` : c.sig ? `<span style="color:var(--amber)">${c.sig}</span>` : '<span style="color:var(--green)">OK</span>'}</b></li>`;
  const b = list.filter(c=>c.off).length;
  el.innerHTML = `<h4 class="dh">${q ? 'Résultats' : lbl} (${fmtN(list.length)}) · ${fmtN(b)} bloqué(s)</h4><ul class="dlist">${ttSlice('d',list).map(row).join('') || li2('Aucun client')}</ul>${ttPager('d',list.length)}`;
}
__on('click', e=>{
  if (!e.target.closest('#stW, #eqW') || e.target.closest('[data-oc]')) return;
  const m = e.target.closest('[data-eqm]'); if (m) return openEq(m.dataset.eqm);
  const pg = e.target.closest('[data-pg]'), t = e.target.closest('[data-stt]'), o = e.target.closest('[data-sto]');
  if (pg){ const [k,i] = pg.dataset.pg.split(':'); TT.p[k] = +i; TT.render(); return; }
  if (t) return stOwn(t.dataset.stt);
  if (o){ stOwn(TT.own===o.dataset.sto ? '' : o.dataset.sto); $('#stL').scrollIntoView({behavior:'smooth', block:'nearest'}); }
});
$('#kStatus').onclick = openStatus;
$('#kTotal').onclick = () => VIEW ? openTotalRev() : openTotal();
$('#kParc').onclick = () => openEq('off');
__on('keydown', e=>{ if (e.key==='Escape') $('#modal').innerHTML = ''; });
__on('keydown', e=>{
  if (e.key!=='Enter' && e.key!==' ') return;
  const row=e.target.closest?.('#packBars [data-pk], #connBars [data-cb], #connBars [data-cbo]');
  if (!row || !__root.contains(row)) return;
  e.preventDefault(); row.click();
});

function renderAll(){
  $('#todayTxt').textContent = fmtD(REAL_TODAY);
  $('#pVs').innerHTML = `État au <b>${fmtD(TODAY)}</b>${+d0(TODAY) === +d0(REAL_TODAY) ? ' (aujourd’hui)' : ''} · alertes, échéances et connexions calculées à cette date` + (CMPC.on ? ` · comparé au <b>${fmtD(refDate())}</b>` : '')
    + (OWNER ? ` <span class="own-chip">Propriétaire : <b>${OWNER}</b><button data-own-x aria-label="Retirer le filtre propriétaire">×</button></span>` : '');
  renderKpis(); renderResellers(); renderActivity(); renderTable(); renderBell(); }
// « État au » : aujourd'hui par défaut ; une autre date recalcule toute la page à cette date
const isoC = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
$('#pAu').value = isoC(REAL_TODAY); $('#pAu').max = isoC(REAL_TODAY);
const setAu = v => { TODAY = new Date(v+'T12:00:00'); setMonths(); Object.keys(SEL).forEach(k=>SEL[k]=null); ECH_Y = null; renderAll(); };
$('#pAu').onchange = e=>{ if (e.target.value) setAu(e.target.value); };
$('#cmpOn').onclick = ()=>{ CMPC.on = !CMPC.on; $('#cmpOn').setAttribute('aria-pressed', CMPC.on);
  $('#cmpModeW').classList.toggle('hidden', !CMPC.on); $('#cmpCustW').classList.toggle('hidden', !CMPC.on || CMPC.mode!=='custom'); renderAll(); };
$('#cmpMode').onchange = e=>{ CMPC.mode = e.target.value; $('#cmpCustW').classList.toggle('hidden', CMPC.mode!=='custom');
  if (CMPC.mode==='custom' && !CMPC.date){ CMPC.date = isoC(new Date(TODAY.getTime() - 90*DAY)); $('#cDate').value = CMPC.date; } renderAll(); };
$('#cDate').onchange = e=>{ CMPC.date = e.target.value; renderAll(); };
$('#pAuToday').onclick = ()=>{ $('#pAu').value = isoC(REAL_TODAY); setAu(isoC(REAL_TODAY)); };
// clients visibles : compte connecté (super admin = tout le réseau, revendeur = ses clients) puis filtre propriétaire
// propriétaire « Tunav » = clients directs + revendeurs ; un revendeur = ses clients finaux
const setScope = () => { CLIENTS = ALL_CLIENTS.filter(c=>(VIEW ? !c.rev && c.reseller===VIEW : true) && (!OWNER || c.reseller===OWNER));
  Object.keys(SEL).forEach(k=>SEL[k]=null); Object.keys(DP).forEach(k=>DP[k]=0); LOGQ = ''; $('#logQ').value = ''; PG.page = 1; $('#modal').innerHTML = '';
  $('#fOwner').value = OWNER; $('#logQL').innerHTML = CLIENTS.map(c=>`<option value="${c.name}">`).join(''); renderAll(); };
const setOwner = v => { OWNER = v; setScope(); };
const setView = v => { VIEW = v; OWNER = ''; __root.classList.toggle('as-rev', !!v);
  if (v){ F.type = ''; $('#fType').value = ''; } setScope(); };
$('#pView').onchange = e => { try { localStorage.setItem('fa-view', e.target.value); } catch (x) {} setView(e.target.value); };
$('#fOwner').innerHTML = '<option value="">Tous les propriétaires</option>' + NET.map(o=>`<option value="${o.name}">${o.name}${o.direct ? ' (direct)' : ''}</option>`).join('');
$('#fOwner').onchange = e => setOwner(e.target.value);
__on('click', e=>{ if (e.target.closest('[data-own-x]')) setOwner(''); });

/* ---------------- Contrôles ---------------- */
$('#fPack').innerHTML += PACKS.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
[['#fSearch','search','input'],['#fType','type','change'],['#fStatus','status','change'],['#fPack','pack','change'],['#fConn','conn','change']]
  .forEach(([s,k,ev])=>$(s).addEventListener(ev,e=>{F[k]=e.target.value;PG.page=1;renderTable();}));
$('#pDelay').onchange = e=>{ P.renew = P.inact = +e.target.value; renderAll(); };

// compte gardé d'une page à l'autre (Tableau de bord, Équipements) ; le navigateur peut restaurer un autre choix du sélecteur
{ let v = ''; try { v = localStorage.getItem('fa-view') || ''; } catch (x) {} if (![...$('#pView').options].some(o => o.value === v)) v = ''; $('#pView').value = v; setView(v); }
function showTab(){}   // la documentation est dans Documentation-Clients-v3.html
__on('click',e=>{ const g=e.target.closest('[data-go]'); if(g){ e.preventDefault(); location.href = 'Documentation-Clients-v3.html#' + g.dataset.go; }});


  if (typeof opts.after === 'function') opts.after({ setView: typeof setView === 'function' ? setView : null });
  return () => {
    __listeners.forEach(([t, f, c]) => document.removeEventListener(t, f, c));
    __timers.forEach((id) => { window.clearTimeout(id); window.clearInterval(id); });
  };
}
