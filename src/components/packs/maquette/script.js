/* eslint-disable */
// @ts-nocheck
/**
 * Script de la maquette validée Packs-v3.html (FleetAdmin-maquettes v3), généré par scripts/port-maquette.py.
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
    get pathname() { return '/Packs-v3.html'; },
    get search() { return opts.search || ''; },
    get hash() { return ''; },
    set href(v) { if (opts.navigate) opts.navigate(v); },
    replace: (v) => { if (opts.navigate) opts.navigate(v); },
    reload: () => {}
  };

/* ===================== Référentiel des fonctionnalités (captures « Modifier un pack ») ===================== */
const CRUD = o => [`Créer un ${o}`,`Consulter et modifier un ${o}`,`Supprimer un ${o}`,`Afficher le nombre total des ${o}s`,`Exporter la liste des ${o}s`];
const TREE = [
 {n:'Suivie', c:[
   {n:'Suivi > Flotte', c:['Tri dynamique des véhicules','Visualisation cartographique et centrage','Indicateurs de maintenance']},
   {n:'Suivi > Citerne', c:['Visualisation des données citerne']},
   {n:'Suivi > UI Temps réel', c:['Fenêtre de suivi en temps réel']},
   {n:'Trajet', c:[{n:'Trajet > Trajectoire', c:['Trajectoire']},{n:'Trajet > Stop circulation', c:['Stop circulation']}]},
   {n:'Gestion des Cmd à distance', c:[{n:'Suivi des cmd envoyés', c:['Suivi d’état des cmd']}]},
   {n:'Menu click droit', c:['Shortcuts click droit','Menu click droit']},
 ]},
 {n:'Parc', c:[
   {n:'Exploitation du parc > Gestion des Chauffeurs', c:CRUD('chauffeur')},
   {n:'Exploitation du parc > Gestion des Clients', c:CRUD('client')},
   {n:'Gestion des Véhicules', c:CRUD('véhicule')},
 ]},
 {n:'Alerte', c:[
   {n:'Sécurité & Protection des Actifs', c:['Remorquage','Batterie gps faible/débranché','Système d’alarme actif','Etat porte arrière (camion)','GNSS signal Lost']},
   {n:'Sécurité du Conducteur & Urgences', c:['SOS','Collision','Qualité de conduite','Dépassement de vitesse']},
   {n:'État Mécanique & Maintenance', c:['DTC (Diagnostic Trouble Codes)','Batterie véhicule faible','Pression des pneus faible','Niveau de carburant faible']},
   {n:'Geofencing', c:['Entrée/Sortie de Zone','Déviation d’Itinéraire','Arrivée sur Site Client','Alerte de Proximité']},
   {n:'Paramétrage des Alertes', c:['Définition des Seuils','Ciblage et Assignation','Gestion des Destinataires et des Canaux']},
 ]},
 {n:'Rapport', c:[
   {n:'Rapports de Suivi des Véhicules', c:[
     {n:'Rapport Détaillé', c:['Consultation du rapport détaillé','Filtrage avancé du rapport','Export du rapport détaillé']},
     {n:'Rapport des Trajets', c:['Liste des trajets effectués','Détail d’un trajet','Rapport mensuel des trajets','Export des trajets']},
     {n:'Rapport de Vitesse', c:['Visualisation des données de vitesse','Rapport des excès de vitesse','Classement des infractions de vitesse','Alerte et notification d’excès']},
   ]},
 ]},
 {n:'Dashboard', c:[
   {n:'Etat de parc (Opérationnel)', c:['Statut de la Flotte','Filtres Rapides','Flux d’Alertes en Direct']},
   {n:'Éco-Conduite (Comportement)', c:['Score de Conduite','Classement (Leaderboard)','Analyse du Ralenti']},
   {n:'Exécutif (Résumé)', c:['Kpis de Performance','Tendance Hebdomadaire/Mensuelle']},
 ]},
 {n:'Administration', c:[
   {n:'Gestion des comptes', c:['Lister et rechercher les comptes','Créer un compte utilisateur','Modifier un compte (droits + périmètre)','Réinitialiser le mot de passe / Supprimer un compte']},
   {n:'Gestion des départements & affectations', c:['Visualiser l’arborescence des départements','Rechercher un département dans l’arbre','Ajouter / modifier un département','Supprimer un département avec option de transfert']},
 ]},
];
// normalise : chaque nœud reçoit un id ; chaque feuille un id f1…f72 + son module
const LEAVES = []; let nid = 0;
(function norm(nodes, mod, path){
  nodes.forEach((x,i)=>{
    if (typeof x === 'string'){ const leaf = {id:'f'+(LEAVES.length+1), n:x, mod, path}; LEAVES.push(leaf); nodes[i] = leaf; }
    else { x.id = 'g'+(++nid); norm(x.c, mod || x.n, mod ? [...path, x.n] : []); }
  });
})(TREE, null, []);
const MODULES = TREE.map(m=>m.n);
const leafIds = node => node.c ? node.c.flatMap(leafIds) : [node.id];
const byName = n => LEAVES.find(l=>l.n===n).id;
const EQ_TYPES = ['ETX','MiniTrace','MedWatch','ETBLE','ET8','ET6','EasyCAN','ET8+CAN','ET6+CAN','Dashcam'];
const COLORS = {
  blue:   {fg:'#1d4ed8', bg:'#dbeafe', solid:'#3b82f6'},
  indigo: {fg:'#4338ca', bg:'#e0e7ff', solid:'#6366f1'},
  amber:  {fg:'#b45309', bg:'#fef3c7', solid:'#f59e0b'},
  emerald:{fg:'#047857', bg:'#d1fae5', solid:'#10b981'},
  slate:  {fg:'#334155', bg:'#e2e8f0', solid:'#64748b'},
};

/* ===================== Packs (captures) ===================== */
const PACKS = [
  {id:1, name:'FleetIQ Secure', desc:'Pack orienté sécurité et alertes.', color:'blue',
   types:new Set(['ETX','ETBLE','Dashcam']),
   features:new Set(['Remorquage','SOS','Entrée/Sortie de Zone','Gestion des Destinataires et des Canaux'].map(byName))},
  {id:2, name:'FleetIQ Pro', desc:'Pack standard avec suivi et rapports essentiels.', color:'indigo',
   types:new Set(EQ_TYPES),
   features:new Set(['Tri dynamique des véhicules','Visualisation cartographique et centrage','Trajectoire','Consultation du rapport détaillé'].map(byName))},
  {id:3, name:'FleetIQ Mechanic', desc:'Pack orienté maintenance et parc.', color:'amber',
   types:new Set(EQ_TYPES),
   features:new Set(['Consulter et modifier un véhicule','Afficher le nombre total des véhicules','DTC (Diagnostic Trouble Codes)','Pression des pneus faible'].map(byName))},
  {id:4, name:'FleetIQ Vision', desc:'Pack premium avec dashboard exécutif.', color:'emerald',
   types:new Set(EQ_TYPES),
   features:new Set(['Statut de la Flotte','Kpis de Performance','Tendance Hebdomadaire/Mensuelle'].map(byName))},
];

/* ===================== Clients (fictifs) ===================== */
// Les données fictives ont été écrites pour le 21/10/2026 ; à l'ouverture, elles sont recalées sur la date du jour
const DATA_DATE = new Date('2026-10-21T12:00:00');
let TODAY = new Date(); TODAY.setHours(12,0,0,0);
const REAL_TODAY = new Date(TODAY);
const ON = '2026-10-21T08:00';            // position récente = connecté
// eq : [type, dateAffectation, dernièrePosition | null (jamais connecté)]
let SER = 863719061234500;
const ALL_CLIENTS = [
  {id:12, name:'Distribution Nord',     mail:'info@dist-nord.fr',        packs:[[2,'2025-12-10']], blocked:true,  exp:'2026-09-30', eq:[['ET8','2025-12-10',null]]},
  {id:14, name:'Fret International',    mail:'contact@fret-intl.tn',     packs:[[1,'2026-02-01']], blocked:false, exp:'2026-10-28', eq:[['ETX','2026-02-01',ON],['MedWatch','2026-06-15','2026-10-02T17:05']]},
  {id:15, name:'Livraison Rapide',      mail:'contact@livraison-rapide.tn', packs:[[2,'2026-02-10']], blocked:true,  exp:'2026-08-15', eq:[['ET6','2026-02-10','2026-08-14T10:00']]},
  {id:16, name:'Logistique Sud',        mail:'admin@logsud.tn',          packs:[[2,'2026-03-20']], blocked:false, exp:'2027-03-31', eq:[['ET6','2026-03-20',ON]]},
  {id:17, name:'MyCom',                 mail:'admin@mycom.tn',           packs:[[1,'2026-01-12'],[2,'2026-05-03']], blocked:false, exp:'2026-12-31', eq:[['ETX','2026-01-12',ON],['ETBLE','2026-01-12',ON],['ET8','2026-05-03',ON]]},
  {id:18, name:'Société Médicale ABC',  mail:'contact@medicale-abc.fr',  packs:[[3,'2025-03-01']], blocked:false, exp:'2026-12-05', eq:[['MedWatch','2025-03-01',ON],['MedWatch','2025-03-01','2026-07-28T11:45']]},
  {id:19, name:'Agri Transport Béja',   mail:'contact@agri-beja.tn',     packs:[[4,'2026-10-01']], blocked:false, exp:'2027-09-30', eq:[['EasyCAN','2026-10-01',ON],['EasyCAN','2026-10-01',ON],['EasyCAN','2026-10-01',ON]]},
  {id:20, name:'Transport Sahel',       mail:'contact@tsahel.tn',        packs:[[1,'2026-08-25']], blocked:false, exp:'2026-11-08', eq:[['ET8','2026-08-25',null],['ET8','2026-08-25',null]]},
  {id:21, name:'BTP Carthage',          mail:'parc@btp-carthage.tn',     packs:[[2,'2026-04-11'],[3,'2026-10-06']], blocked:false, exp:'2027-02-28', eq:[['ET8+CAN','2026-04-11',ON],['ET8+CAN','2026-04-11',ON]]},
  {id:22, name:'Transport Express',     mail:'contact@texpress.fr',      packs:[[2,'2025-11-15'],[3,'2026-09-10']], blocked:false, exp:'2026-10-29', eq:[['ET6','2025-11-15',ON],['ET6+CAN','2026-09-10',ON],['ETX','2025-11-15','2026-09-30T10:00']]},
  {id:23, name:'Transport Urbain Tunis',mail:'admin@tut.tn',             packs:[[1,'2025-06-30']], blocked:false, exp:'2027-06-30', eq:[['ETX','2025-06-30',ON],['ETX','2025-06-30',ON],['ETX','2025-06-30',ON],['Dashcam','2025-07-15',ON]]},
  {id:24, name:'Cimenterie du Nord',    mail:'flotte@cimnord.tn',        packs:[[3,'2026-10-14']], blocked:false, exp:'2027-10-14', eq:[['ET6+CAN','2026-10-14',ON],['ET6+CAN','2026-10-14',ON],['ET6+CAN','2026-10-14',null]]},
  {id:25, name:'Pharma Distribution',   mail:'logistique@pharmadist.tn', packs:[[4,'2026-07-20']], blocked:false, exp:'2026-11-30', eq:[['ET8','2026-07-20',ON],['ET8','2026-07-20',ON],['Dashcam','2026-07-20','2026-10-11T09:00']]},
  {id:26, name:'Bus Côtier',            mail:'exploitation@buscotier.tn',packs:[[1,'2026-09-18']], blocked:false, exp:'2027-09-18', eq:[['Dashcam','2026-09-18',ON],['Dashcam','2026-09-18',ON],['ETBLE','2026-09-18',ON]]},
  {id:27, name:'Location Auto Plus',    mail:'contact@locauto.tn',       packs:[[2,'2026-10-09']], blocked:false, exp:'2027-10-09', eq:[['ETX','2026-10-09',ON],['ETX','2026-10-09',ON],['MiniTrace','2026-10-09',ON]]},
  {id:28, name:'Frigo Express',         mail:'contact@frigo-express.tn', packs:[[3,'2026-06-02']], blocked:false, exp:'2026-10-25', eq:[['EasyCAN','2026-06-02',ON],['EasyCAN','2026-06-02','2026-10-08T14:00']]},
  {id:29, name:'Taxi Sfax',             mail:'admin@taxisfax.tn',        packs:[[2,'2026-09-25']], blocked:false, exp:'2027-03-25', eq:[['MiniTrace','2026-09-25','2026-10-01T08:00'],['MiniTrace','2026-09-25',null]]},
  {id:30, name:'Sotra Bâtiment',        mail:'parc@sotra.tn',            packs:[[4,'2025-10-20']], blocked:false, exp:'2026-12-20', eq:[['ET8+CAN','2025-10-20',ON],['ET8+CAN','2025-10-20',ON]]},
];
ALL_CLIENTS.forEach(c=>c.eq.forEach(e=>e.unshift(String(++SER))));   // [serial, type, dateAff, lastPos]
// Réseau : Tunav (clients directs) puis les revendeurs ; MyCom est aussi un client de Tunav (compte revendeur)
const OWNERS = [
  {name:'Tunav',         col:'#64748B', direct:true},
  {name:'MyCom',         col:'#2563eb'},
  {name:'Comafrique',    col:'#d97706'},
  {name:'Côte d’Ivoire', col:'#059669'},
  {name:'Mali',          col:'#db2777'},
  {name:'Sénégal',       col:'#7c3aed'},
  {name:'Cameroun',      col:'#0891b2'},
  {name:'Burkina Faso',  col:'#65a30d'},
];
const OWN_OF = {15:'MyCom', 16:'MyCom', 20:'MyCom', 24:'MyCom', 22:'Comafrique', 25:'Comafrique', 26:'Côte d’Ivoire', 27:'Mali', 28:'Sénégal', 29:'Cameroun', 30:'Burkina Faso'};
ALL_CLIENTS.forEach(c=>{ c.own = OWN_OF[c.id] || 'Tunav'; c.rev = c.id===17; });
// VIEW : '' = super admin Tunav, sinon nom du revendeur connecté (il ne voit que ses clients)
let VIEW = '', CLIENTS = ALL_CLIENTS;
// Affectations remplacées (lignes plus anciennes de PackCustomerAssignment)
const HIST = [
  {c:22, p:1, d:'2025-06-01'}, {c:25, p:2, d:'2025-12-01'}, {c:29, p:1, d:'2025-09-12'},
  {c:12, p:1, d:'2025-10-05'}, {c:26, p:2, d:'2025-10-28'}, {c:16, p:1, d:'2025-11-20'},
  {c:28, p:2, d:'2026-01-15'}, {c:19, p:2, d:'2026-02-18'}, {c:24, p:2, d:'2026-05-06'},
];
// Recalage : toutes les dates des données sont décalées du nombre de jours entre le 21/10/2026 et aujourd'hui
const SHIFT = Math.round((new Date(TODAY).setHours(0,0,0,0) - new Date(DATA_DATE).setHours(0,0,0,0)) / 864e5);
const shiftD = s => { if (!s || !SHIFT) return s;
  const d = new Date(s.length===10 ? s+'T12:00:00' : s); d.setDate(d.getDate()+SHIFT);
  const day = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return s.length===10 ? day : day + s.slice(10); };
ALL_CLIENTS.forEach(c=>{ c.exp = shiftD(c.exp); c.packs.forEach(x=>x[1] = shiftD(x[1])); c.eq.forEach(e=>{ e[2] = shiftD(e[2]); e[3] = shiftD(e[3]); }); });
HIST.forEach(h=>h.d = shiftD(h.d));

/* ===================== Helpers ===================== */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const DAY = 864e5;
const d0 = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const iso = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };
const fmtD = s => s ? new Date(s).toLocaleDateString('fr-FR') : '—';
const daysUntil = s => Math.round((d0(s) - d0(TODAY)) / DAY);
const daysSince = s => Math.floor((d0(TODAY) - d0(s)) / DAY);
const pct = (a,b) => b ? Math.round(a*100/b) : 0;
const packOf = id => PACKS.find(p=>p.id===id);
const MOIS = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const esc = s => String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const badge = p => { const k = COLORS[p.color]; return `<span class="pk" style="background:${k.bg};color:${k.fg}">${esc(p.name)}</span>`; };

const P = { renew:60, crit:10, hours:24, minConn:60 };
// Blocage 30 j après la date d'expiration (même règle que Gestion Clients)
const GRACE = 30;
const isActive = c => !c.blocked && (!c.exp || daysUntil(c.exp) >= -GRACE);
const eqConnected = e => !!e[3] && (TODAY - new Date(e[3])) <= P.hours * 36e5;
const holders = p => CLIENTS.filter(c=>c.packs.some(x=>x[0]===p.id));
const supported = c => new Set(c.packs.flatMap(([id])=>[...packOf(id).types]));
const incoherent = c => c.packs.length ? c.eq.filter(e=>!supported(c).has(e[1])) : [];
const ASSIGN = () => [...CLIENTS.flatMap(c=>c.packs.map(([p,d])=>({c:c.id,p,d}))), ...HIST.filter(h=>CLIENTS.some(c=>c.id===h.c))];
// pack d'un équipement : celui affecté le même jour, sinon le premier pack du client qui couvre son type
const eqPack = (c, e) => (c.packs.find(([,d])=>d===e[2]) || c.packs.find(([p])=>packOf(p).types.has(e[1])) || c.packs[0] || [])[0];
const packEq = p => CLIENTS.flatMap(c=>c.eq.filter(e=>eqPack(c,e)===p.id));
const ownTag = c => VIEW ? '' : ` <small class="note">${c.own==='Tunav' ? 'Tunav' : `via ${esc(c.own)}`}</small>`;

/* ===================== Période ===================== */
// Période : 7 jours, 30 jours, 3 mois (jusqu'à la date « Au », aujourd'hui par défaut) ou personnalisée (1 an max)
const PER = { mode:'30', au:iso(TODAY), from:iso(new Date(TODAY.getFullYear(), TODAY.getMonth()-2, 1)), to:iso(TODAY) };
let RANGE;
function baseRange(){
  let from, to;
  if (PER.mode==='custom'){ from = d0(PER.from); to = d0(PER.to); }
  else { to = d0(PER.au);
    from = PER.mode==='3m' ? new Date(to.getFullYear(), to.getMonth()-3, to.getDate()+1) : new Date(to - (+PER.mode-1)*DAY); }
  if (isNaN(from) || isNaN(to) || to < from) return {err:'La date de fin doit être après la date de début.'};
  const len = Math.round((to-from)/DAY)+1;
  if (len > 366) return {err:'Période personnalisée limitée à 1 an maximum.'};
  const short = {'7':'7 j','30':'30 j','3m':'3 mois'}[PER.mode];
  return {from, to, len, label:`${fmtD(from)} → ${fmtD(to)}`, short: short || `${fmtD(from).slice(0,5)} → ${fmtD(to).slice(0,5)}`};
}
// Comparaison optionnelle (bouton « Comparer », désactivé à l'ouverture) : période précédente, même période l'an dernier ou personnalisée
const CMP = { on:false, mode:'prev', from:'', to:'' };
const computeRange = () => {
  const r = baseRange(); if (r.err) return r;
  if (CMP.mode==='year'){ const y = d => new Date(d.getFullYear()-1, d.getMonth(), d.getDate()); r.pf = y(r.from); r.pt = y(r.to); }
  else if (CMP.mode==='custom'){
    r.pf = d0(CMP.from); r.pt = d0(CMP.to);
    if (isNaN(r.pf) || isNaN(r.pt) || r.pt < r.pf) return {err:'Période de comparaison : la date de fin doit être après la date de début.'};
  }
  else { r.pt = new Date(r.from - DAY); r.pf = new Date(r.from - r.len*DAY); }
  r.plabel = `${fmtD(r.pf)} → ${fmtD(r.pt)}`;
  return r;
};
const inR = (d,a,b) => { const x = d0(d); return x >= a && x <= b; };
const deltaHtml = (n, prev) => {
  if (!CMP.on) return '';
  if (!prev && !n) return `<span class="delta eq">= 0</span>`;
  if (!prev) return `<span class="delta up">nouveau</span>`;
  const v = Math.round((n-prev)*100/prev);
  return `<span class="delta ${v>0?'up':v<0?'down':'eq'}">${v>0?'↗ +':v<0?'↘ ':'= '}${v} %</span>`;
};

/* ===================== Alertes ===================== */
const F = { alert:'', search:'', pack:'' };
const critList = () => CLIENTS.filter(c=>isActive(c) && c.exp && daysUntil(c.exp)>=0 && daysUntil(c.exp)<=P.crit).sort((a,b)=>daysUntil(a.exp)-daysUntil(b.exp));
const ALERTS = [
  { id:'crit', ref:'A-10', cls:'crit', tag:['Critique','red'], title:()=>`Expire dans ${P.crit} j ou moins`,
    test:c => isActive(c) && c.exp && daysUntil(c.exp)>=0 && daysUntil(c.exp)<=P.crit,
    desc:l => l.length ? `valider le paiement avant J-0` : 'aucune échéance critique', unit:'client(s)', who:c=>`${c.name} (J-${daysUntil(c.exp)})` },
  { id:'renew', ref:'A-11', cls:'warn', tag:['À anticiper','amber'], title:()=>`Expire dans ${P.crit+1} à ${P.renew} j`,
    test:c => isActive(c) && c.exp && daysUntil(c.exp)>P.crit && daysUntil(c.exp)<=P.renew,
    desc:() => 'préparer le renouvellement', unit:'client(s)', who:c=>`${c.name} (J-${daysUntil(c.exp)})` },
  { id:'incoh', ref:'A-12', cls:'', tag:['Cohérence','red'], title:()=>'Équipement non couvert par le pack',
    test:c => incoherent(c).length>0, count:l=>l.reduce((n,c)=>n+incoherent(c).length,0),
    desc:l => `chez ${l.length} client(s) · type non supporté`, unit:'équipement(s)', who:c=>`${c.name} (${[...new Set(incoherent(c).map(e=>e[1]))].join(', ')})` },
  { id:'blocked', ref:'A-13', cls:'', tag:['Paiement','slate'], title:()=>'Bloqués ou expirés',
    test:c => !isActive(c), desc:() => 'en attente de régularisation', unit:'client(s)', who:c=>c.name },
];
const lowPacks = () => PACKS.map(p=>{ const eq = packEq(p); return {p, n:eq.length, on:eq.filter(eqConnected).length}; })
  .filter(r=>r.n && pct(r.on,r.n) < P.minConn);

/* ===================== Rendu ===================== */
let sortKey = 'clients', heatSel = 1, heatMod = null, bannerClosed = false;
const MCOL = ['#3b82f6','#8b5cf6','#ef4444','#f59e0b','#10b981','#64748b'];   // Suivie, Parc, Alerte, Rapport, Dashboard, Administration

function renderPeriod(){
  const r = computeRange();
  $('#pErr').textContent = r.err || '';
  if (r.err) return false;
  RANGE = r;
  $('#pVs').innerHTML = `Période : <b>${r.label}</b> (${r.len} j)` + (CMP.on ? ` · comparée à <b>${r.plabel}</b>` : ' · sans comparaison');
  $('#todayTxt').textContent = fmtD(REAL_TODAY);
  return true;
}

/* ---- Cartes du haut : un chiffre simple ---- */
const connRows = () => PACKS.map(p=>{ const eq = packEq(p); return {p, n:eq.length, on:eq.filter(eqConnected).length}; });
const allEq = () => CLIENTS.flatMap(c=>c.eq);
const salesIn = (a,b) => ASSIGN().filter(x=>inR(x.d,a,b));
function renderKpis(){
  $('#k2t').textContent = `Packs vendus (${RANGE.short})`;
  const cur = salesIn(RANGE.from,RANGE.to).length, prev = salesIn(RANGE.pf,RANGE.pt).length;
  $('#k2').innerHTML = `${cur} ${deltaHtml(cur, prev)}`;
  const rk = rankRows().sort((a,b)=>b.clients-a.clients||b.eq-a.eq)[0];
  $('#k3').innerHTML = rk ? `${badge(rk.p)} <small class="of">${rk.clients} clients</small>` : '—';
  const eq = allEq(), on = eq.filter(eqConnected).length;
  $('#k4').innerHTML = `${pct(on,eq.length)} % <small class="of">connectés</small> <small class="of" style="color:var(--red)">${eq.length ? 100-pct(on,eq.length) : 0} % non</small>`;
  $('#k4m').style.width = pct(on,eq.length) + '%';
}

/* ---- Détail d'une carte (au clic) ---- */
const li = (a,b='') => `<li><span>${a}</span><b>${b}</b></li>`;
// nom de client cliquable (ouvre « Packs d'un client ») et statut court
const cName = (c, cls='') => `<button class="lnk ${cls}" data-cpk="${c.id}" style="${cls?'':'color:var(--ink);font-size:13px;font-weight:500'}">${esc(c.name)}</button>`;
const statusTxt = c => isActive(c) ? '<span class="st on"><i></i>Actif</span>' : `<span class="st off"><i></i>${c.blocked?'Bloqué':'Expiré'}</span>`;
__on('click', e=>{ const t = e.target.closest('[data-cpk]'); if (t){ e.preventDefault(); openClientPacks(+t.dataset.cpk); } });
function openDetail(kind){
  let title, body, doc, w = 460;
  if (kind==='ventes'){
    const cur = salesIn(RANGE.from,RANGE.to).sort((a,b)=>d0(a.d)-d0(b.d)), prev = salesIn(RANGE.pf,RANGE.pt).length;
    const name = id => CLIENTS.find(c=>c.id===id)?.name || '—';
    title = `Packs vendus · ${RANGE.label}`; doc = 'P-02';
    body = `<p class="dl"><b>${cur.length} pack(s)</b> affecté(s) à un client sur la période${CMP.on?`, contre <b>${prev}</b> en ${RANGE.plabel}`:''}.</p>
      <ul class="dlist">${cur.map(a=>li(`${badge(packOf(a.p))} ${esc(name(a.c))}`, fmtD(a.d))).join('') || li('Aucune vente sur la période')}</ul>`;
  } else if (kind==='top'){
    const rows = rankRows().sort((a,b)=>b.clients-a.clients||b.eq-a.eq);
    title = 'Pack le plus choisi'; doc = 'P-03';
    body = `<p class="dl">Classement par nombre de clients. Un client qui a deux packs compte dans les deux.</p>
      <ul class="dlist">${rows.map((r,i)=>li(`<span class="rk">${i+1}</span>${badge(r.p)}`, `${r.clients} clients · ${r.eq} équip.`)).join('')}</ul>`;
  } else {
    title = 'Équipements connectés par pack'; doc = 'P-05'; w = 960;
    body = `<div id="cdW"></div>`;
  }
  modal(w, title, body, `<button class="btn primary" data-x>Fermer</button>`);
  if (kind==='conn') drawConnDetail();
}

/* ---- Packs vendus aux revendeurs : revendeur × pack (super admin) ; Tunav direct en ligne de référence ---- */
let RS_MODE = 'all', RS_SEL = null;   // 'all' = packs en cours · 'period' = vendus sur la période ; RS_SEL = {o, p} (p = 0 : tous les packs)
function renderResell(){
  $('#rsSec').classList.toggle('hidden', !!VIEW); $('#rsPanel').classList.toggle('hidden', !!VIEW);
  if (VIEW) return;
  const byId = id => CLIENTS.find(c=>c.id===id);
  const sales = (a,b) => (RS_MODE==='all' ? CLIENTS.flatMap(c=>c.packs.map(([p,d])=>({c:c.id,p,d}))) : ASSIGN().filter(x=>inR(x.d,a,b)))
    .map(x=>({...x, cl:byId(x.c)})).filter(x=>x.cl);
  const cur = sales(RANGE.from, RANGE.to), prev = RS_MODE==='period' && CMP.on ? sales(RANGE.pf, RANGE.pt) : null;
  const n = (l,o,p) => l.filter(x=>(o===null ? x.cl.own!=='Tunav' : x.cl.own===o) && (!p || x.p===p)).length;
  const revs = OWNERS.filter(o=>!o.direct), totR = n(cur,null), totD = n(cur,'Tunav');
  const topP = PACKS.map(p=>({p, k:n(cur,null,p.id)})).sort((a,b)=>b.k-a.k)[0], topR = revs.map(o=>({o, k:n(cur,o.name)})).sort((a,b)=>b.k-a.k)[0];
  if (!RS_SEL) RS_SEL = {o:topR.o.name, p:0};
  const dl = (o,p) => { if (!prev) return ''; const d = n(cur,o,p) - n(prev,o,p); return ` <span class="dlt ${d>0?'pos':d<0?'neg':'eq'}">${d>0?'↗ +':d<0?'↘ ':'= '}${d}</span>`; };
  const cell = (o,p) => { const k = n(cur,o,p), s = RS_SEL.o===o && RS_SEL.p===p;
    return `<td class="c${k?'':' z'}${s?' sel':''}" data-rs="${esc(o)}|${p}">${k || '—'}</td>`; };
  $('#rsK').innerHTML = `<b>${totR}</b> pack(s) ${RS_MODE==='all' ? 'vendus' : `vendus en ${RANGE.short}`} via les revendeurs${dl(null,0)} · <b>${pct(totR,totR+totD)} %</b> du total (vs ${totD} en direct Tunav)<br>
    Pack le plus revendu : ${topP.k ? `${badge(topP.p)} (${topP.k})` : '—'} · Revendeur n°1 : ${topR.k ? `<b style="font-family:inherit">${esc(topR.o.name)}</b> (${topR.k})` : '—'}`;
  const row = (o, name, cls='') => { const t = n(cur,o);
    return `<tr class="${cls}"><td>${name}</td>${PACKS.map(p=>cell(o,p.id)).join('')}<td class="c${RS_SEL.o===o && !RS_SEL.p?' sel':''}" data-rs="${esc(o)}|0"><b>${t}</b>${dl(o,0)}</td>
      <td><div class="rs-sh"><div class="sb2"><i style="width:${pct(t,totR+totD)}%;background:${OWNERS.find(x=>x.name===o).col}"></i></div>${pct(t,totR+totD)} %</div></td></tr>`; };
  // part du total = packs du propriétaire / tous les packs (Tunav direct + revendeurs)
  const totRow = (label, f, t) => `<tr class="tot"><td>${label}</td>${PACKS.map(p=>`<td class="c" style="cursor:default">${f(p.id) || '—'}</td>`).join('')}<td class="c" style="cursor:default">${t}</td><td><span class="rs-sh">${pct(t,totR+totD)} %</span></td></tr>`;
  $('#rsT').innerHTML = `<thead><tr><th>Propriétaire</th>${PACKS.map(p=>`<th class="c">${badge(p)}</th>`).join('')}<th class="c">Total</th><th style="min-width:120px">Part du total</th></tr></thead><tbody>
    ${row('Tunav', '<i class="dot" style="background:#64748B"></i><b>Tunav</b> <small class="note">direct</small>', 'ref')}
    ${revs.map(o=>row(o.name, `<i class="dot" style="background:${o.col}"></i><b>${esc(o.name)}</b>`)).join('')}
    ${totRow('Total revendeurs', p=>n(cur,null,p), totR)}
    ${totRow('Total (Tunav + revendeurs)', p=>n(cur,null,p) + n(cur,'Tunav',p), totR+totD)}</tbody>`;
  $('#rsCtl').innerHTML = `<span>Compter :</span><button data-rsm="all" class="${RS_MODE==='all'?'on':''}">Tous les packs en cours</button><button data-rsm="period" class="${RS_MODE==='period'?'on':''}">Vendus sur la période (${RANGE.short})</button>${RS_MODE==='period' && !CMP.on ? '<span>· activez « Comparer » pour voir l’évolution</span>' : ''}`;
  // détail à droite : clients du revendeur pour la case choisie
  const list = cur.filter(x=>x.cl.own===RS_SEL.o && (!RS_SEL.p || x.p===RS_SEL.p)).sort((a,b)=>d0(b.d)-d0(a.d));
  $('#rsDet').innerHTML = `<div class="cd-h"><span><b>${esc(RS_SEL.o)}${RS_SEL.o==='Tunav' ? ' (direct)' : ''}</b> · ${RS_SEL.p ? badge(packOf(RS_SEL.p)) : 'Tous les packs'}</span><span class="note">${list.length} pack(s) vendu(s)</span></div>
    ${list.length ? `<div class="cd-t"><table><thead><tr><th>Client</th><th>Pack</th><th>Vendu le</th><th>Statut</th></tr></thead><tbody>${list.map(x=>`<tr><td>${cName(x.cl)}</td><td>${badge(packOf(x.p))}</td><td style="white-space:nowrap">${fmtD(x.d)}</td><td>${statusTxt(x.cl)}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="cd-empty">Aucun pack vendu</div>'}`;
  $$('#rsT [data-rs]').forEach(td=>td.onclick=()=>{ const [o,p] = td.dataset.rs.split('|'); RS_SEL = {o, p:+p}; renderResell(); });
  $$('#rsCtl [data-rsm]').forEach(b=>b.onclick=()=>{ RS_MODE = b.dataset.rsm; renderResell(); });
}

/* ---- Détail « Équipements connectés » : % connectés / non connectés de chaque pack, par propriétaire (Tunav en tête) ---- */
const CD_PK = new Set();   // packs choisis (vide = tous)
function drawConnDetail(){
  const inSel = (c,e) => !CD_PK.size || CD_PK.has(eqPack(c,e));
  const packs = PACKS.filter(p=>!CD_PK.size || CD_PK.has(p.id));
  // super admin : une ligne par propriétaire ; revendeur : une ligne par client
  const groups = VIEW ? CLIENTS.filter(c=>c.eq.length).map(c=>({name:esc(c.name), cl:[c]}))
    : OWNERS.map(o=>({name:`<i class="dot" style="background:${o.col}"></i><b>${esc(o.name)}</b>${o.direct ? ' <small class="note">direct</small>' : ''}`, cl:CLIENTS.filter(c=>c.own===o.name)})).filter(g=>g.cl.length);
  const cnt = (cl, test) => { const eq = cl.flatMap(c=>c.eq.filter(e=>test(c,e))); return {n:eq.length, on:eq.filter(eqConnected).length}; };
  const cell = r => r.n ? `<td class="cx"><b style="color:${pct(r.on,r.n)<P.minConn?'var(--red)':'var(--green)'}">${pct(r.on,r.n)} %</b>${r.on<r.n ? `<span>${100-pct(r.on,r.n)} % non conn.</span>` : '<span class="ok">tout connecté</span>'}<small>${r.on} / ${r.n}</small></td>` : '<td class="z">—</td>';
  const totCell = r => r.n ? `<td><b style="font-family:var(--mono)">${pct(r.on,r.n)} %</b> <small class="note">connectés · ${r.n-r.on} non conn. sur ${r.n}</small>
      <div class="sb2"><i style="width:${pct(r.on,r.n)}%;background:var(--green)"></i><i style="width:${100-pct(r.on,r.n)}%;background:#fca5a5"></i></div></td>` : '<td class="z">—</td>';
  const row = (name, cl, cls='') => `<tr class="${cls}"><td>${name}</td>${packs.map(p=>cell(cnt(cl,(c,e)=>eqPack(c,e)===p.id))).join('')}${totCell(cnt(cl,inSel))}</tr>`;
  const all = cnt(CLIENTS, inSel);
  // clients avec des équipements non connectés (sur les packs choisis), les plus touchés en premier
  const cl = CLIENTS.map(c=>({c, eq:c.eq.filter(e=>inSel(c,e))})).filter(x=>x.eq.length).map(x=>({...x, on:x.eq.filter(eqConnected).length}))
    .sort((x,y)=>(y.eq.length-y.on)-(x.eq.length-x.on) || pct(x.on,x.eq.length)-pct(y.on,y.eq.length));
  const state = e => !e[3] ? '<span class="st off"><i></i>Jamais connecté</span>' : eqConnected(e) ? '<span class="st on"><i></i>Connecté</span>' : `<span class="st off"><i></i>Hors ligne · ${daysSince(e[3])} j</span>`;
  $('#cdW').innerHTML = `<div class="pkf"><span>Packs :</span><button data-cdp="" class="${CD_PK.size?'':'on'}">Tous</button>${PACKS.map(p=>`<button data-cdp="${p.id}" class="${CD_PK.has(p.id)?'on':''}">${esc(p.name)}</button>`).join('')}<span>· un ou plusieurs</span></div>
    <p class="dl"><b>${pct(all.on,all.n)} %</b> des équipements ${CD_PK.size ? 'des packs choisis ' : ''}sont connectés, <b style="color:var(--red)">${all.n ? 100-pct(all.on,all.n) : 0} %</b> non connectés (${all.n-all.on} sur ${all.n}) · connecté = position reçue il y a moins de ${P.hours} h · en rouge sous ${P.minConn} %</p>
    <div class="tw"><table class="cxt"><thead><tr><th>${VIEW ? `Client de ${esc(VIEW)}` : 'Propriétaire'}</th>${packs.map(p=>`<th>${badge(p)}</th>`).join('')}<th style="min-width:200px">${CD_PK.size ? 'Packs choisis' : 'Tous les packs'}</th></tr></thead>
      <tbody>${groups.filter(g=>cnt(g.cl,inSel).n).map(g=>row(g.name, g.cl)).join('')}${row(VIEW ? 'Total' : 'Total réseau', CLIENTS, 'tot')}</tbody></table></div>
    <h4 class="dh">Par client · cliquez pour voir les équipements</h4>
    ${cl.map(({c,eq,on:o},i)=>`<details class="eqg"${i===0?' open':''}><summary><b>${esc(c.name)}</b>${ownTag(c)}${c.packs.map(([p])=>badge(packOf(p))).join(' ')}
        <span class="sp">${o} / ${eq.length} · ${pct(o,eq.length)} %<span class="mbar"><i style="width:${pct(o,eq.length)}%;background:${o<eq.length?'var(--amber)':'var(--green)'}"></i></span></span></summary>
      <table><thead><tr><th>N° série</th><th>Type</th><th>Pack</th><th>Dernière position</th><th>État</th></tr></thead><tbody>
        ${eq.map(e=>`<tr><td style="font-family:var(--mono)">${e[0]}</td><td>${esc(e[1])}</td><td>${badge(packOf(eqPack(c,e)))}</td><td>${e[3] ? fmtD(e[3]) : '—'}</td><td>${state(e)}</td></tr>`).join('')}</tbody></table>
      <div style="padding:8px 12px;text-align:right"><button class="lnk" data-cpk="${c.id}">Voir les packs du client →</button></div></details>`).join('') || '<p class="note">Aucun équipement</p>'}`;
  $$('#cdW [data-cdp]').forEach(b=>b.onclick=()=>{ const id = +b.dataset.cdp;
    if (!id) CD_PK.clear(); else { CD_PK.has(id) ? CD_PK.delete(id) : CD_PK.add(id); if (CD_PK.size===PACKS.length) CD_PK.clear(); }
    drawConnDetail(); });
}

function renderAlerts(){
  // seule la carte « Expire dans 11 à 60 j » reste dans À traiter ; les autres alertes restent dans la cloche et le bandeau
  $('#alerts').innerHTML = ALERTS.filter(a=>a.id==='renew').map(a=>{
    const list = CLIENTS.filter(a.test), n = a.count ? a.count(list) : list.length;
    return `<button class="al ${a.cls}${F.alert===a.id?' on':''}" data-alert="${a.id}" title="${esc(list.map(a.who).join(', '))}">
      <div class="row1"><span class="t">${a.title()}</span><span class="tag ${a.tag[1]}">${a.tag[0]}</span></div>
      <div class="n">${n} <span class="d">${a.unit}</span></div></button>`;
  }).join('');
  $$('[data-alert]').forEach(b=>b.onclick=()=>openAlertDetail(b.dataset.alert));

  // cloche + bandeau
  const items = [];
  critList().forEach(c=>items.push({sv:'var(--red)', t:`${c.name} expire dans ${daysUntil(c.exp)} j`, s:`Échéance ${fmtD(c.exp)} · ${c.packs.map(([id])=>packOf(id).name).join(' + ')}`, go:'Paiement', act:()=>openPay(c.id)}));
  CLIENTS.filter(ALERTS[1].test).sort((a,b)=>daysUntil(a.exp)-daysUntil(b.exp)).forEach(c=>items.push({sv:'#f59e0b', t:`${c.name} : renouvellement dans ${daysUntil(c.exp)} j`, s:`Échéance ${fmtD(c.exp)}`, go:'Voir', act:()=>focusAlert('renew')}));
  CLIENTS.filter(c=>incoherent(c).length).forEach(c=>items.push({sv:'var(--red)', t:`${c.name} : ${incoherent(c).length} équipement(s) hors pack`, s:`Type(s) ${[...new Set(incoherent(c).map(e=>e[1]))].join(', ')} non supporté(s) par ${c.packs.map(([id])=>packOf(id).name).join(' + ')}`, go:'Modifier', act:()=>openClientPacks(c.id)}));
  lowPacks().forEach(r=>items.push({sv:'#f59e0b', t:`${r.p.name} : ${pct(r.on,r.n)} % d'équipements connectés`, s:`${r.on} / ${r.n} connectés · seuil ${P.minConn} %`, go:'Voir', act:()=>{ closeBell(); $('#connBars').scrollIntoView({behavior:'smooth',block:'center'}); }}));
  CLIENTS.filter(c=>!isActive(c)).forEach(c=>items.push({sv:'var(--faint)', t:`${c.name} ${c.blocked?'bloqué':'expiré'}`, s:`Expiré le ${fmtD(c.exp)} · depuis ${daysSince(c.exp)} j`, go:'Paiement', act:()=>openPay(c.id)}));
  BELL = items;
  $('#bellCnt').textContent = items.length;
  $('#bellCnt').classList.toggle('hidden', !items.length);
  $('#bell').classList.toggle('ring', critList().length>0);
  if (!$('#bpanel').classList.contains('hidden')) renderBell();

  const cl = critList();
  $('#banner').classList.toggle('hidden', !cl.length || bannerClosed);
  $('#banner').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/></svg>
    <span><b>${cl.length} abonnement(s) expirent dans ${P.crit} jours ou moins</b> : ${cl.map(c=>`${esc(c.name)} (J-${daysUntil(c.exp)})`).join(', ')}</span>
    <button class="bb" id="bannerGo">Voir les clients</button><button class="bx" id="bannerX" aria-label="Fermer">×</button>`;
  const g = $('#bannerGo'); if (g) g.onclick = ()=>focusAlert('crit');
  const x = $('#bannerX'); if (x) x.onclick = ()=>{ bannerClosed = true; $('#banner').classList.add('hidden'); };
}
/* ---- Détail d'une carte « À traiter » : ce que ça veut dire, qui est concerné, quoi faire ---- */
function openAlertDetail(id){
  const a = ALERTS.find(x=>x.id===id), list = CLIENTS.filter(a.test);
  const pk = c => c.packs.map(([p])=>badge(packOf(p))).join(' ');
  const jn = c => { const du = daysUntil(c.exp); return `${fmtD(c.exp)}<span class="ago ${du<=P.crit?'bad':'warn'}">J-${du}</span>`; };
  const D = {
    crit:   { what:`L’abonnement se termine dans <b>${P.crit} jours ou moins</b>. Sans paiement, le client sera bloqué ${GRACE} jours après cette date.`,
              h:['Client','Pack','Fin d’abonnement'], row:c=>[cName(c), pk(c), jn(c)], sort:(x,y)=>daysUntil(x.exp)-daysUntil(y.exp), dec:'Valider le paiement maintenant.' },
    renew:  { what:`L’abonnement se termine dans <b>${P.crit+1} à ${P.renew} jours</b>. Il reste du temps pour préparer le renouvellement.`,
              h:['Client','Pack','Fin d’abonnement'], row:c=>[cName(c), pk(c), jn(c)], sort:(x,y)=>daysUntil(x.exp)-daysUntil(y.exp), dec:'Appeler le client et envoyer l’offre de renouvellement.' },
    incoh:  { what:`Le client a un <b>boîtier GPS que son pack ne prend pas en charge</b> (ex. un MedWatch avec FleetIQ Secure, prévu pour ETX, ETBLE et Dashcam). Les fonctions du pack ne marchent pas sur ce boîtier.`,
              h:['Client','Pack','Boîtier non couvert'], row:c=>[cName(c), pk(c), incoherent(c).map(e=>`<b>${esc(e[1])}</b> <span class="note">${e[0]}</span>`).join('<br>')], sort:(x,y)=>incoherent(y).length-incoherent(x).length, dec:'Changer le pack du client ou remplacer le boîtier.' },
    blocked:{ what:`Le client est <b>bloqué</b> (paiement) ou son abonnement est <b>terminé depuis plus de ${GRACE} jours</b> : il n’a plus accès à la plateforme.`,
              h:['Client','Statut','Fin d’abonnement'], row:c=>[cName(c), statusTxt(c), `${fmtD(c.exp)}<span class="ago bad">depuis ${daysSince(c.exp)} j</span>`], sort:(x,y)=>daysSince(y.exp)-daysSince(x.exp), dec:'Relancer le paiement avec la Finance.' },
  }[id];
  const rows = list.slice().sort(D.sort), n = a.count ? a.count(list) : list.length;
  modal(640, `${a.title()} <span class="tag ${a.tag[1]}" style="vertical-align:middle;margin-left:6px">${a.tag[0]}</span>`,
    `<p class="what">${D.what}</p>
     <p class="dl"><b>${n} ${a.unit}</b>${id==='incoh' ? ` chez ${list.length} client(s)` : ''}</p>
     ${rows.length ? `<table class="ptab" style="width:100%;border-collapse:collapse"><thead><tr>${D.h.map(h=>`<th style="text-align:left;font-size:10px;padding:7px 10px;background:#F8FAFC">${h}</th>`).join('')}</tr></thead>
       <tbody>${rows.map(c=>`<tr>${D.row(c).map(v=>`<td style="padding:8px 10px;border-top:1px solid var(--line2);font-size:13px;vertical-align:top">${v}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<p class="note" style="text-align:center;padding:16px">Aucun client.</p>'}`,
    `<button class="btn" id="alFilt">Filtrer la liste des clients</button><button class="btn primary" data-x>Fermer</button>`);
  $('#alFilt').onclick = ()=>{ closeModal(); focusAlert(id); };
}
let BELL = [];
function renderBell(){
  $('#bpanel').innerHTML = `<div class="bh"><b>Alertes</b><span>${BELL.length} à traiter</span></div>` +
    (BELL.length ? `<ul>${BELL.map((it,i)=>`<li data-bi="${i}"><i class="sv" style="background:${it.sv}"></i><div><div class="lt">${esc(it.t)}</div><div class="ls">${esc(it.s)}</div></div><span class="go">${it.go} →</span></li>`).join('')}</ul>` : `<div class="empty">Aucune alerte</div>`);
  $$('[data-bi]').forEach(li=>li.onclick=()=>{ closeBell(); BELL[+li.dataset.bi].act(); });
}
function closeBell(){ $('#bpanel').classList.add('hidden'); }
function focusAlert(id){ closeBell(); showTab('dash'); F.alert = id; renderAlerts(); renderClients(); $('#clist').scrollIntoView({behavior:'smooth',block:'start'}); }

function rankRows(){
  const withP = CLIENTS.filter(c=>c.packs.length).length;
  const A = ASSIGN();
  return PACKS.map(p=>{
    const h = holders(p);
    return { p, clients:h.length, active:h.filter(isActive).length, eq:h.reduce((n,c)=>n+c.eq.length,0),
      share:pct(h.length, withP),
      per:A.filter(a=>a.p===p.id && inR(a.d,RANGE.from,RANGE.to)).length,
      prev:A.filter(a=>a.p===p.id && inR(a.d,RANGE.pf,RANGE.pt)).length };
  });
}
function renderRank(){
  const rows = rankRows().sort((a,b)=>b[sortKey]-a[sortKey] || b.clients-a.clients || b.eq-a.eq);
  const max = Math.max(1, ...rows.map(r=>r[sortKey]));
  const th = (k,l,al='') => `<th class="sort${sortKey===k?' on':''}" data-sort="${k}" style="${al}">${l}</th>`;
  // super admin : clients répartis Tunav (direct) / revendeurs ; la barre est découpée par propriétaire (Tunav en tête)
  const split = !VIEW, val = (h, o) => { const l = h.filter(c=>c.own===o); return sortKey==='eq' ? l.reduce((n,c)=>n+c.eq.length,0) : l.length; };
  const seg = r => { const h = holders(r.p);
    return OWNERS.map(o=>({o, v:val(h,o.name)})).filter(x=>x.v).map(x=>`<i class="rk-own" data-po="${r.p.id}|${esc(x.o.name)}" style="width:${x.v*100/max}%;background:${x.o.col}" title="${esc(x.o.name)} : ${x.v} ${sortKey==='eq'?'équip.':'client(s)'} · cliquer pour la liste"></i>`).join(''); };
  $('#rank').innerHTML = `<thead><tr><th>#</th><th>Pack</th>${th('clients','Clients','text-align:right')}${split ? '<th style="text-align:right">Tunav</th><th style="text-align:right">Revendeurs</th>' : ''}${th('eq','Équipements','text-align:right')}<th style="width:34%">${split ? `Par propriétaire (${sortKey==='eq'?'équipements':'clients'})` : ''}</th></tr></thead><tbody>` +
    rows.map((r,i)=>{ const h = holders(r.p), tv = h.filter(c=>c.own==='Tunav').length;
      return `<tr class="rk-row${i===0?' first':''}" data-rk="${r.p.id}" title="Voir les clients et leurs équipements"><td class="pos">${i+1}</td><td>${badge(r.p)}</td>
      <td class="num"><b>${r.clients}</b></td>${split ? `<td class="num"><button class="rk-lnk" data-po="${r.p.id}|Tunav">${tv}</button> <small class="note">${pct(tv,r.clients)} %</small></td><td class="num"><button class="rk-lnk" data-po="${r.p.id}|rev">${r.clients-tv}</button> <small class="note">${r.clients ? 100-pct(tv,r.clients) : 0} %</small></td>` : ''}<td class="num">${r.eq}</td>
      <td><div class="bar" style="display:flex">${split ? seg(r) : `<i style="width:${pct(r[sortKey],max)}%;background:${COLORS[r.p.color].solid}"></i>`}</div></td></tr>`; }).join('') + '</tbody>';
  $('#rankLeg').innerHTML = split ? OWNERS.map(o=>`<span><i class="dot" style="background:${o.col}"></i>${esc(o.name)}${o.direct ? ' (direct)' : ''}</span>`).join('') : '';
  $$('[data-sort]').forEach(t=>t.onclick=()=>{ sortKey = t.dataset.sort; renderRank(); });
  $$('[data-rk]').forEach(t=>t.onclick=()=>openPackClients(+t.dataset.rk));
  $$('#rank [data-po]').forEach(t=>t.onclick=e=>{ e.stopPropagation(); const [p,o] = t.dataset.po.split('|'); openPackOwner(+p, o); });
}

/* ---- Clients d'un pack pour Tunav (direct), les revendeurs ou un propriétaire précis ---- */
function openPackOwner(pid, who){
  const p = packOf(pid), all = holders(p);
  const inW = (c, w) => w==='rev' ? c.own!=='Tunav' : c.own===w;
  const tabs = [['Tunav','Tunav (direct)'], ['rev','Revendeurs'], ...(who!=='Tunav' && who!=='rev' ? [[who, who]] : [])];
  const list = all.filter(c=>inW(c,who)).sort((a,b)=>OWNERS.findIndex(o=>o.name===a.own)-OWNERS.findIndex(o=>o.name===b.own) || a.name.localeCompare(b.name));
  const date = c => fmtD((c.packs.find(([x])=>x===pid) || [])[1]);
  const conn = c => { const on = c.eq.filter(eqConnected).length; return `<span style="color:${on<c.eq.length?'var(--red)':'var(--green)'};font-family:var(--mono)">${on} / ${c.eq.length}</span>`; };
  const showOwn = who!=='Tunav';
  modal(640, `${badge(p)} &nbsp;${who==='Tunav' ? 'Clients Tunav (direct)' : who==='rev' ? 'Clients des revendeurs' : `Clients de ${esc(who)}`} · ${list.length}`,
    `<div class="pkf">${tabs.map(([k,l])=>`<button data-pw="${esc(k)}" class="${k===who?'on':''}">${esc(l)} · ${all.filter(c=>inW(c,k)).length}</button>`).join('')}</div>
    ${list.length ? `<div class="tw"><table class="cxt"><thead><tr><th>Client</th>${showOwn ? '<th>Revendeur</th>' : ''}<th>Affecté le</th><th>Équip. connectés</th><th>Statut</th></tr></thead><tbody>
      ${list.map(c=>`<tr><td>${cName(c)}</td>${showOwn ? `<td><i class="dot" style="background:${OWNERS.find(o=>o.name===c.own).col}"></i>${esc(c.own)}</td>` : ''}<td>${date(c)}</td><td>${conn(c)}</td><td>${statusTxt(c)}</td></tr>`).join('')}</tbody></table></div>`
      : '<p class="note">Aucun client</p>'}`,
    `<button class="btn" id="poAll">Tous les clients du pack</button><button class="btn primary" data-x>Fermer</button>`);
  $$('#modal [data-pw]').forEach(b=>b.onclick=()=>openPackOwner(pid, b.dataset.pw));
  $('#poAll').onclick = ()=>openPackClients(pid);
}

function monthsFor(){
  // janvier → décembre de l'année de la date de fin de période (les mois à venir restent vides)
  const y = RANGE.to.getFullYear();
  return Array.from({length:12}, (_,i)=>new Date(y, i, 1));
}
function renderEvo(){
  const A = ASSIGN(), months = monthsFor();
  const data = months.map(m=>PACKS.map(p=>!shown('evo', p.id) ? 0 : A.filter(a=>a.p===p.id && new Date(a.d).getFullYear()===m.getFullYear() && new Date(a.d).getMonth()===m.getMonth()).length));
  const max = Math.max(1, ...data.map(r=>r.reduce((a,b)=>a+b,0)));
  // mois affiché à droite : celui cliqué, sinon le dernier mois de la plage
  const key = m => `${m.getFullYear()}-${m.getMonth()}`;
  const endM = new Date(RANGE.to.getFullYear(), RANGE.to.getMonth(), 1), fut = m => m > endM;
  if (!EVO_SEL || !months.some(m=>key(m)===EVO_SEL && !fut(m))) EVO_SEL = key(endM);
  $('#evo').innerHTML = data.map((r,i)=>{ const t = r.reduce((a,b)=>a+b,0), m = months[i];
    return `<div class="c ec${key(m)===EVO_SEL?' sel':''}${fut(m)?' fut':''}" ${fut(m) ? '' : `data-em="${key(m)}"`} title="${MOIS[m.getMonth()]} ${m.getFullYear()} : ${fut(m) ? 'à venir' : `${t} pack(s) vendu(s) · cliquer pour le détail`}">
      ${t?`<span class="lab" style="top:${100 - t/max*88 - 9}%">${t}</span>`:''}
      <div class="stk" style="height:${t/max*88}%">${r.map((v,j)=>v?`<i style="height:${v/t*100}%;background:${COLORS[PACKS[j].color].solid}"></i>`:'').join('')}</div></div>`; }).join('');
  $('#evoX').innerHTML = months.map((m,i)=>`<span class="${key(m)===EVO_SEL?'sel':''}${fut(m)?' fut':''}">${MOIS[m.getMonth()].replace('.','')}${i===0?` ${String(m.getFullYear()).slice(2)}`:''}</span>`).join('');
  $$('#evo [data-em]').forEach(c=>c.onclick=()=>{ EVO_SEL = c.dataset.em; renderEvo(); });
  renderEvoDet(months.find(m=>key(m)===EVO_SEL));
  legend('#evoLeg', 'evo', PACKS.map(p=>({k:p.id, l:esc(p.name), c:COLORS[p.color].solid})));
  $('#evoSub').innerHTML = `Janvier → décembre ${RANGE.to.getFullYear()}` + ` · cliquez sur un mois pour le détail`;
}

/* ---- Détail à droite : packs vendus dans le mois cliqué ---- */
let EVO_SEL = null;
function renderEvoDet(m){
  const sales = ASSIGN().filter(a=>{ const d = new Date(a.d); return d.getFullYear()===m.getFullYear() && d.getMonth()===m.getMonth() && shown('evo', a.p); });
  const name = id => CLIENTS.find(c=>c.id===id)?.name || '—';
  const rows = PACKS.map(p=>({p, s:sales.filter(a=>a.p===p.id)})).filter(r=>r.s.length).sort((a,b)=>b.s.length-a.s.length);
  $('#evoDet').innerHTML = `<div class="cd-h"><b>${MOIS[m.getMonth()]} ${m.getFullYear()}</b><span class="note"><b style="color:var(--ink)">${sales.length}</b> pack(s) vendu(s)</span></div>` +
    (rows.length ? `<div class="cd-t"><table><thead><tr><th>Pack</th><th style="text-align:right">Vendus</th><th style="text-align:right">Part</th><th style="text-align:right">Fonctionnalités</th></tr></thead><tbody>${rows.map(r=>`
      <tr><td>${badge(r.p)}<div class="cd-cl">${r.s.map(a=>`${esc(name(a.c))} <span>· ${fmtD(a.d).slice(0,5)}</span>`).join('<br>')}</div></td>
        <td class="num-r">${r.s.length}</td><td class="num-r"><b>${pct(r.s.length, sales.length)} %</b></td>
        <td class="num-r">${r.p.features.size}<span class="of2"> / ${LEAVES.length}</span></td></tr>`).join('')}</tbody></table></div>`
      : `<div class="cd-empty">Aucun pack vendu ce mois-ci</div>`);
}

/* ---- Fonctionnalités vendues : classement par nombre de clients qui ont la fonctionnalité ---- */
// mode 'top' = les plus vendues, 'low' = les moins vendues (au moins 1 client), 'none' = jamais vendues
const FEAT = { mode:'top', sel:null, all:false };
function featStats(){
  return LEAVES.map(l=>{ const packs = PACKS.filter(p=>p.features.has(l.id)), ids = new Set(packs.map(p=>p.id));
    const cl = CLIENTS.filter(c=>isActive(c) && c.packs.some(([p])=>ids.has(p)));
    return { l, packs, cl, eq:cl.reduce((t,c)=>t+c.eq.length,0), mi:MODULES.indexOf(l.mod) }; });
}
function renderHeat(){
  const all = featStats().filter(s=>shown('feat', s.l.mod)), sold = all.filter(s=>s.cl.length), never = all.filter(s=>!s.cl.length);
  const nAct = CLIENTS.filter(c=>isActive(c) && c.packs.length).length;
  $('#fMode').innerHTML = [['top','Les plus vendues'],['low','Les moins vendues'],['none',`Jamais vendues (${never.length})`]]
    .map(([k,l])=>`<button data-fm="${k}" class="${FEAT.mode===k?'on':''}">${l}</button>`).join('');
  $$('#fMode [data-fm]').forEach(b=>b.onclick=()=>{ FEAT.mode = b.dataset.fm; FEAT.sel = null; FEAT.all = false; renderHeat(); });
  const byName = (a,b)=>a.l.n.localeCompare(b.l.n);
  let list = FEAT.mode==='top' ? sold.slice().sort((a,b)=>b.cl.length-a.cl.length||b.eq-a.eq||byName(a,b))
           : FEAT.mode==='low' ? sold.slice().sort((a,b)=>a.cl.length-b.cl.length||a.eq-b.eq||byName(a,b))
           : never.slice().sort((a,b)=>a.mi-b.mi||byName(a,b));
  const more = list.length > 10 && !FEAT.all; if (more) list = list.slice(0, 10);
  if (!FEAT.sel || !list.some(s=>s.l.id===FEAT.sel)) FEAT.sel = list[0]?.l.id || null;
  const max = Math.max(1, ...sold.map(s=>s.cl.length));
  $('#heat').innerHTML = list.map((s,i)=>`<button class="fr${FEAT.sel===s.l.id?' on':''}" data-fid="${s.l.id}">
      <span class="fr-n">${i+1}</span><span class="fr-l"><i class="dot" style="background:${MCOL[s.mi]}"></i>${esc(s.l.n)}</span>
      <span class="fr-b"><i style="width:${s.cl.length/max*100}%;background:${MCOL[s.mi]}"></i></span>
      <span class="fr-v">${s.cl.length ? `<b>${s.cl.length}</b> client(s) · ${pct(s.cl.length,nAct)} %` : `<span class="note">${s.packs.length ? 'dans un pack sans client' : 'dans aucun pack'}</span>`}</span></button>`).join('')
    + (more ? `<button class="fmore" data-fall>Afficher les ${FEAT.mode==='none' ? never.length : sold.length} fonctionnalités</button>` : '')
    || '<p class="note" style="padding:12px">Aucune fonctionnalité.</p>';
  $$('#heat [data-fid]').forEach(b=>b.onclick=()=>{ FEAT.sel = b.dataset.fid; renderHeat(); });
  const fa = $('#heat [data-fall]'); if (fa) fa.onclick = ()=>{ FEAT.all = true; renderHeat(); };
  legend('#featLeg', 'feat', MODULES.map((m,i)=>({k:m, l:m, c:MCOL[i]})));

  // détail de la fonctionnalité choisie : packs qui l'incluent, clients qui l'ont
  const s = all.find(x=>x.l.id===FEAT.sel);
  $('#fdet').innerHTML = !s ? '' : `<div class="fh"><i class="dot" style="background:${MCOL[s.mi]}"></i><b>${esc(s.l.n)}</b><span class="note">${esc(s.l.mod)}${s.l.path.length ? ' › '+s.l.path.map(esc).join(' › ') : ''}</span>
      <span class="note" style="margin-left:auto"><b style="color:var(--ink)">${s.cl.length}</b> client(s) · ${s.eq} équip.</span></div>
    <div class="fm"><b>Dans les packs</b><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${s.packs.map(p=>`<button class="lnk" data-edit="${p.id}" title="Modifier le pack">${badge(p)}</button>`).join('') || '<span class="note">Aucun pack : à ajouter dans un pack pour pouvoir la vendre.</span>'}</div></div>
    <div class="fm"><b>Clients qui l’ont (${s.cl.length})</b>${s.cl.length ? `<ul>${s.cl.map(c=>`<li>${cName(c)} <small>· ${c.packs.filter(([p])=>s.packs.some(q=>q.id===p)).map(([p])=>packOf(p).name).join(' + ')} · ${c.eq.length} équip.</small></li>`).join('')}</ul>`
      : `<p class="note" style="margin:6px 0 0">${s.packs.length ? 'Aucun client actif n’a un pack qui la contient.' : 'Elle n’est dans aucun pack.'}</p>`}</div>`;
  $$('#fdet [data-edit]').forEach(b=>b.onclick=()=>openPack(+b.dataset.edit));
}

/* ---- Classement : clic sur un pack → ses clients et leurs équipements ---- */
function openPackClients(pid){
  const p = packOf(pid), list = holders(p);
  const body = list.map(c=>{ const on = c.eq.filter(eqConnected).length;
    return `<details class="pc" ${list.length<=3?'open':''}><summary><b>${esc(c.name)}</b>
        <span class="note">${c.eq.length} équip. · <span style="color:${on<c.eq.length?'var(--red)':'var(--green)'}">${on} connecté(s)</span></span>
        ${isActive(c)?'<span class="st on"><i></i>Actif</span>':'<span class="st off"><i></i>Bloqué</span>'}</summary>
      ${c.eq.length ? `<table class="pct"><thead><tr><th>N° série</th><th>Type</th><th>Affecté le</th><th>Connexion</th></tr></thead><tbody>${c.eq.map(e=>`<tr>
        <td class="mono">${e[0]}</td><td>${e[1]}${p.types.has(e[1])?'':' <span class="lowflag">hors pack</span>'}</td><td>${fmtD(e[2])}</td>
        <td>${!e[3]?'<span class="st off"><i></i>Jamais</span>':eqConnected(e)?'<span class="st on"><i></i>Connecté</span>':`<span class="st off"><i></i>${daysSince(e[3])} j</span>`}</td></tr>`).join('')}</tbody></table>`
        : '<p class="note" style="margin:8px 0 0">Aucun équipement</p>'}</details>`; }).join('');
  modal(640, `${badge(p)} &nbsp;${list.length} client(s)`, `<p class="dl">Cliquez sur un client pour voir ses équipements.</p>${body}`,
    `<button class="btn primary" data-x>Fermer</button>`);
}

/* ---- Légendes cliquables : un clic = n'afficher que cette série, re-clic = tout ---- */
const SOLO = {};
const shown = (chart, k) => !SOLO[chart] || SOLO[chart] === String(k);
function legend(el, chart, items){
  $(el).innerHTML = items.map(it=>`<button class="lg${SOLO[chart]===String(it.k)?' on':''}${SOLO[chart] && SOLO[chart]!==String(it.k)?' off':''}" data-lg="${chart}" data-k="${it.k}"><i class="dot" style="background:${it.c}"></i>${it.l}</button>`).join('')
    + (SOLO[chart] ? `<button class="lg reset" data-lg="${chart}" data-k="">Tout afficher</button>` : '');
}
const LG_RENDER = { conn:()=>renderConn(), evo:()=>renderEvo(), pipe:()=>renderPipe(), feat:()=>renderHeat() };
__on('click', e=>{ const b = e.target.closest('[data-lg]'); if (!b) return;
  const ch = b.dataset.lg, k = b.dataset.k; SOLO[ch] = (!k || SOLO[ch]===k) ? null : k; LG_RENDER[ch](); });

function renderConn(){
  const rows = connRows().filter(r=>r.n), s = SOLO.conn;   // packs sans équipement (ex. chez un revendeur) masqués
  const max = Math.max(1, ...rows.map(r=>r.n));
  const val = r => s==='off' ? r.n-r.on : r.on;     // valeur affichée selon la série choisie
  const sorted = rows.sort((a,b)=> s==='off' ? pct(val(b),b.n)-pct(val(a),a.n) : pct(a.on,a.n)-pct(b.on,b.n));
  if (!CONN_SEL.p && sorted.length) CONN_SEL = {p:sorted[0].p.id, k:'off'};   // par défaut : non connectés du pack le plus bas
  const segCls = (r,k) => `cseg${CONN_SEL.p===r.p.id && CONN_SEL.k===k ? ' sel' : ''}`;
  $('#connBars').innerHTML = sorted.map(r=>`
    <div class="b${CONN_SEL.p===r.p.id?' cur':''}"><span>${badge(r.p)}</span>
      <div class="track" style="width:${pct(r.n,max)}%">${shown('conn','on')?`<i class="${segCls(r,'on')}" data-cs="${r.p.id}:on" title="${r.on} connecté(s) · cliquer pour la liste" style="width:${pct(r.on,r.n)}%;background:var(--green)"></i>`:''}${shown('conn','off')?`<i class="${segCls(r,'off')}" data-cs="${r.p.id}:off" title="${r.n-r.on} non connecté(s) · cliquer pour la liste" style="width:${pct(r.n-r.on,r.n)}%;background:#fca5a5"></i>`:''}</div>
      <span class="num">${s==='off' ? `${pct(r.n-r.on,r.n)} % · ${r.n-r.on}/${r.n}` : `${pct(r.on,r.n)} % · ${r.on}/${r.n}`}${!s && r.n && pct(r.on,r.n)<P.minConn?'<span class="lowflag">BAS</span>':''}</span></div>`).join('');
  legend('#connLeg', 'conn', [{k:'on',l:'Connectés',c:'var(--green)'},{k:'off',l:'Non connectés',c:'#fca5a5'}]);
  $$('#connBars [data-cs]').forEach(el=>el.onclick=()=>{ const [p,k] = el.dataset.cs.split(':'); CONN_SEL = {p:+p, k}; renderConn(); });
  renderConnDet();
}

/* ---- Détail à droite : équipements connectés / non connectés du pack choisi ---- */
let CONN_SEL = {p:null, k:'off'};
function renderConnDet(){
  const p = packOf(CONN_SEL.p); if (!p) return;
  const eqs = CLIENTS.flatMap(c=>c.eq.filter(e=>eqPack(c,e)===p.id).map(e=>({c, e})));
  const on = eqs.filter(x=>eqConnected(x.e)), off = eqs.filter(x=>!eqConnected(x.e));
  const list = CONN_SEL.k==='on' ? on : off;
  const row = ({c,e}) => `<tr><td><b>${esc(c.name)}</b>${ownTag(c)}<div class="mono" style="color:var(--muted)">${e[0]}</div></td><td>${e[1]}</td>
    <td>${!e[3] ? '<span class="st off"><i></i>Jamais connecté</span>' : eqConnected(e) ? `<span class="st on"><i></i>${fmtD(e[3])}</span>` : `<span class="st off"><i></i>il y a ${daysSince(e[3])} j</span>`}</td></tr>`;
  $('#connDet').innerHTML = `<div class="cd-h">${badge(p)}
      <div class="cd-tabs"><button data-ck="on" class="${CONN_SEL.k==='on'?'on g':''}">Connectés <b>${on.length}</b></button><button data-ck="off" class="${CONN_SEL.k==='off'?'on r':''}">Non connectés <b>${off.length}</b></button></div></div>
    ${list.length ? `<div class="cd-t"><table><thead><tr><th>Client · n° série</th><th>Type</th><th>${CONN_SEL.k==='on'?'Dernière position':'Connexion'}</th></tr></thead><tbody>${list.map(row).join('')}</tbody></table></div>`
      : `<div class="cd-empty">${CONN_SEL.k==='on'?'Aucun équipement connecté':'Tous les équipements sont connectés ✓'}</div>`}`;
  $$('#connDet [data-ck]').forEach(b=>b.onclick=()=>{ CONN_SEL.k = b.dataset.ck; renderConn(); });
}

// janvier → décembre de l'année choisie (année en cours à l'ouverture, ‹ › pour changer d'année)
let PIPE_Y = null;
function renderPipe(){
  if (!PIPE_Y) PIPE_Y = TODAY.getFullYear();
  const months = Array.from({length:12}, (_,i)=>new Date(PIPE_Y, i, 1));
  const withExp = CLIENTS.filter(c=>c.exp);
  const SER = [{k:'past',l:'Déjà expiré',c:'#94a3b8'},{k:'crit',l:`Critique ≤ ${P.crit} j`,c:'var(--red)'},{k:'warn',l:'À anticiper',c:'#f59e0b'},{k:'later',l:'Plus tard',c:'#cbd5e1'}];
  const level = c => daysUntil(c.exp)<0 || !isActive(c) ? 'past' : daysUntil(c.exp)<=P.crit ? 'crit' : daysUntil(c.exp)<=P.renew ? 'warn' : 'later';
  const data = months.map(m=>{ const l = withExp.filter(c=>{ const e = new Date(c.exp); return e.getFullYear()===m.getFullYear() && e.getMonth()===m.getMonth() && shown('pipe', level(c)); });
    const d = { names:l.map(c=>c.name) }; SER.forEach(s=>d[s.k] = l.filter(c=>level(c)===s.k).length); return d; });
  const tot = d => SER.reduce((n,s)=>n+d[s.k],0), max = Math.max(1, ...data.map(tot));
  const cur = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  $('#pipe').innerHTML = data.map((d,i)=>{ const t = tot(d);
    return `<div class="c" title="${MOIS[months[i].getMonth()]} ${PIPE_Y} : ${d.names.join(', ') || 'aucune échéance'}">${t?`<span class="lab" style="top:${100 - t/max*85 - 10}%">${t}</span>`:''}
      <div class="stk" style="height:${t/max*85}%">${SER.map(s=>d[s.k]?`<i style="height:${d[s.k]/t*100}%;background:${s.c}"></i>`:'').join('')}</div></div>`; }).join('');
  legend('#pipeLeg', 'pipe', SER);
  $('#pipeX').innerHTML = months.map((m,i)=>`<span class="${+m===+cur?'sel':''}">${MOIS[m.getMonth()].replace('.','')}${i===0?` ${String(PIPE_Y).slice(2)}`:''}</span>`).join('');
  $('#pipeSub').innerHTML = `Clients par mois d'expiration · <span class="ynav"><button data-py="-1" aria-label="Année précédente">‹</button><b>${PIPE_Y}</b><button data-py="1" aria-label="Année suivante">›</button></span>`;
  $$('#pipeSub [data-py]').forEach(b=>b.onclick=()=>{ PIPE_Y += +b.dataset.py; renderPipe(); });
}

const ICON_EDIT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>`;
const ICON_PAY  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`;
function renderPacks(){
  const q = $('#qPack').value.trim().toLowerCase();
  $('#plist').innerHTML = PACKS.filter(p=>!q || p.name.toLowerCase().includes(q)).map(p=>`
    <div class="pitem"><div class="pm">
      <div class="meta">${badge(p)}<span class="fc">☷ ${p.features.size} fonctionnalité(s)</span><span class="fc">· ${holders(p).length} client(s)</span></div>
      <p>${esc(p.desc)}</p>
      <div class="tys">Équipements : ${p.types.size===EQ_TYPES.length?'tous les types':[...p.types].join(', ')}</div></div>
      <button class="ibtn" data-edit="${p.id}" aria-label="Modifier">${ICON_EDIT}</button></div>`).join('') || `<div class="pitem note">Aucun pack</div>`;
  $$('#plist [data-edit]').forEach(b=>b.onclick=()=>openPack(+b.dataset.edit));
  const cur = $('#fPack').value;
  $('#fPack').innerHTML = `<option value="">Tous les packs</option>` + PACKS.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  $('#fPack').value = cur;
}

const openRows = new Set();
let clientPage = 0;
function renderClients(){
  const a = ALERTS.find(x=>x.id===F.alert);
  const list = CLIENTS.filter(c=>{
    if (F.search && !(c.name+' '+c.mail).toLowerCase().includes(F.search)) return false;
    if (F.pack && !c.packs.some(x=>String(x[0])===F.pack)) return false;
    if (a && !a.test(c)) return false;
    return true;
  }).sort((x,y)=>(isActive(y)-isActive(x)) || daysUntil(x.exp)-daysUntil(y.exp));
  const pageSize = 10, pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  clientPage = Math.min(clientPage, pageCount - 1);
  const pageList = list.slice(clientPage * pageSize, (clientPage + 1) * pageSize);
  $('#clist').innerHTML = `<thead><tr><th>Client</th><th>Pack</th><th>Parc</th><th>Expiration</th><th>Statut</th><th style="text-align:right">Actions</th></tr></thead><tbody>` +
    pageList.map(c=>{
      const du = daysUntil(c.exp), inc = incoherent(c);
      const tag = !isActive(c) ? '' : du<=P.crit ? `<span class="ago bad">J-${du}</span>` : du<=P.renew ? `<span class="ago warn">J-${du}</span>` : '';
      let h = `<tr class="r"><td><div class="cname">${esc(c.name)}${ownTag(c)}</div><div class="cmail">${esc(c.mail)}</div></td>
        <td><div class="pks">${c.packs.map(([id])=>badge(packOf(id))).join('')}</div></td>
        <td><button class="incoh" style="color:var(--ink2);font-weight:500" data-open="${c.id}">${c.eq.length} équip. ${c.eq.length?(openRows.has(c.id)?'▴':'▾'):''}</button>
          ${inc.length?`<div><button class="incoh" data-open="${c.id}">⚠ ${inc.length} hors pack</button></div>`:''}</td>
        <td style="white-space:nowrap">${fmtD(c.exp)} ${tag}</td>
        <td>${isActive(c)?'<span class="st on"><i></i>Actif</span>':'<span class="st off"><i></i>Bloqué</span>'}</td>
        <td><div class="acts"><button class="ibtn" data-cp="${c.id}" title="Modifier les packs">${ICON_EDIT}</button><button class="ibtn" data-pay="${c.id}" title="Paiement">${ICON_PAY}</button></div></td></tr>`;
      if (openRows.has(c.id) && c.eq.length){
        const sup = supported(c);
        h += `<tr class="det"><td colspan="6"><div class="det-in"><table><thead><tr><th>N° série</th><th>Type</th><th>Affecté le</th><th>Connexion</th><th>Couvert par</th></tr></thead><tbody>${c.eq.map(e=>{
          const cov = c.packs.filter(([id])=>packOf(id).types.has(e[1])).map(([id])=>packOf(id).name);
          return `<tr><td class="mono">${e[0]}</td><td>${e[1]}</td><td>${fmtD(e[2])}</td>
            <td>${!e[3]?'<span class="st off"><i></i>Jamais</span>':eqConnected(e)?'<span class="st on"><i></i>Connecté</span>':`<span class="st off"><i></i>${daysSince(e[3])} j</span>`}</td>
            <td>${!c.packs.length?'—':sup.has(e[1])?cov.join(', '):'<b style="color:var(--red)">Aucun pack du client</b>'}</td></tr>`; }).join('')}</tbody></table></div></td></tr>`;
      }
      return h;
    }).join('') + (list.length?'':`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:28px">Aucun client</td></tr>`) + '</tbody>';
  $$('#clist [data-open]').forEach(b=>b.onclick=()=>{ const id=+b.dataset.open; openRows.has(id)?openRows.delete(id):openRows.add(id); renderClients(); });
  $$('#clist [data-cp]').forEach(b=>b.onclick=()=>openClientPacks(+b.dataset.cp));
  $$('#clist [data-pay]').forEach(b=>b.onclick=()=>openPay(+b.dataset.pay));
  $('#chips').innerHTML = `<span>${list.length} client(s)</span>` + (a ? `<span class="chip">${a.ref} · ${a.title()} <button data-clr>×</button></span>` : '');
  const clr = $('[data-clr]'); if (clr) clr.onclick = ()=>{ F.alert=''; renderAlerts(); renderClients(); };
  $('#clientPager').innerHTML = pageCount > 1 ? `<span>${clientPage * pageSize + 1}–${Math.min(list.length, (clientPage + 1) * pageSize)} sur ${list.length} clients</span><button data-client-page="${clientPage - 1}" ${clientPage === 0 ? 'disabled' : ''} aria-label="Page précédente">‹</button>${Array.from({length:pageCount}, (_,i)=>`<button data-client-page="${i}" ${i === clientPage ? 'aria-current="page"' : ''} aria-label="Page ${i + 1}">${i + 1}</button>`).join('')}<button data-client-page="${clientPage + 1}" ${clientPage === pageCount - 1 ? 'disabled' : ''} aria-label="Page suivante">›</button>` : '';
  $$('#clientPager [data-client-page]').forEach(b=>b.onclick=()=>{ clientPage = +b.dataset.clientPage; renderClients(); });
}

function renderAll(){
  if (!renderPeriod()) return;
  renderKpis(); renderResell(); renderAlerts(); renderRank(); renderEvo(); renderHeat(); renderConn(); renderPipe(); renderPacks(); renderClients();
}

/* ===================== Modales ===================== */
const closeModal = () => { $('#modal').innerHTML = ''; };
function modal(w, title, body, foot){
  $('#modal').innerHTML = `<div class="ov" id="ov"><div class="modal" style="max-width:${w}px" role="dialog" aria-modal="true">
    <div class="mh"><h3>${title}</h3><button class="ibtn" data-x aria-label="Fermer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
    <div class="mb">${body}</div><div class="mf">${foot}</div></div></div>`;
  $('#ov').onclick = e => { if (e.target.id==='ov' || e.target.closest('[data-x]')) closeModal(); };
}

/* --- Modifier / créer un pack (captures 2 et 3) --- */
let D, openNodes, tq = '';
function openPack(id){
  const p = packOf(id);
  D = p ? {id, name:p.name, desc:p.desc, color:p.color, types:new Set(p.types), features:new Set(p.features)}
        : {id:null, name:'', desc:'', color:'slate', types:new Set(), features:new Set()};
  openNodes = new Set(TREE.map(m=>m.id)); tq = '';
  modal(980, p ? 'Modifier un pack' : 'Nouveau pack', `<div class="pe">
    <div>
      <label class="fl">Nom du pack</label><input class="inp" id="mName" value="${esc(D.name)}">
      <label class="fl" style="margin-top:14px">Description</label><textarea class="inp" id="mDesc">${esc(D.desc)}</textarea>
      <label class="fl" style="margin-top:14px">Couleur</label><div class="colors" id="mCol"></div>
      <div class="tybox"><div class="th"><div><b>Types d'équipements supportés</b><p>Cochez les types supportés. Les quotas seront définis dans la modale d'affectation client.</p></div><button class="btn sm" id="mAllTy">Tout ajouter</button></div><div id="mTy"></div></div>
      <div class="selbox">☑ <b>Fonctionnalités sélectionnées</b><small id="mCnt"></small></div>
      <div style="display:flex;gap:8px;margin-top:12px"><button class="btn" style="flex:1;justify-content:center" id="mAll">Tout sélectionner</button><button class="btn" style="flex:1;justify-content:center" id="mNone">Tout retirer</button></div>
    </div>
    <div>
      <div class="tree-tools"><label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input id="mQ" placeholder="Rechercher une fonctionnalité…"></label><button class="btn" id="mExp">Déplier</button><button class="btn" id="mCol2">Réduire</button></div>
      <div class="tree" id="mTree"></div>
    </div></div>`,
    `<button class="btn" data-x>Annuler</button><button class="btn primary" id="mSave">Enregistrer</button>`);
  const col = () => { $('#mCol').innerHTML = Object.keys(COLORS).map(k=>`<button data-c="${k}" class="${D.color===k?'on':''}" style="${D.color===k?`background:${COLORS[k].bg};color:${COLORS[k].fg};border-color:${COLORS[k].solid}`:''}">${k}</button>`).join('');
    $$('#mCol [data-c]').forEach(b=>b.onclick=()=>{ D.color=b.dataset.c; col(); }); };
  const ty = () => { $('#mTy').innerHTML = EQ_TYPES.map(t=>`<label class="ck"><input type="checkbox" data-t="${t}" ${D.types.has(t)?'checked':''}>${t}</label>`).join('');
    $$('#mTy [data-t]').forEach(b=>b.onchange=()=>{ b.checked?D.types.add(b.dataset.t):D.types.delete(b.dataset.t); }); };
  col(); ty(); drawTree();
  $('#mAllTy').onclick = ()=>{ EQ_TYPES.forEach(t=>D.types.add(t)); ty(); };
  $('#mAll').onclick = ()=>{ LEAVES.forEach(l=>D.features.add(l.id)); drawTree(); };
  $('#mNone').onclick = ()=>{ D.features.clear(); drawTree(); };
  $('#mExp').onclick = ()=>{ (function all(n){ n.forEach(x=>{ if(x.c){ openNodes.add(x.id); all(x.c); } }); })(TREE); drawTree(); };
  $('#mCol2').onclick = ()=>{ openNodes.clear(); drawTree(); };
  $('#mQ').oninput = e=>{ tq = e.target.value.trim().toLowerCase(); drawTree(); };
  $('#mSave').onclick = ()=>{
    const name = $('#mName').value.trim(); if (!name){ $('#mName').focus(); $('#mName').style.borderColor='var(--red)'; return; }
    const v = {name, desc:$('#mDesc').value.trim(), color:D.color, types:D.types, features:D.features};
    if (D.id) Object.assign(packOf(D.id), v); else { const id = Math.max(...PACKS.map(p=>p.id))+1; PACKS.push({id, ...v}); heatSel = id; }
    closeModal(); renderAll();
  };
}
function drawTree(){
  const match = n => !tq || (n.c ? n.n.toLowerCase().includes(tq) || n.c.some(match) : n.n.toLowerCase().includes(tq));
  const hl = s => { if (!tq) return esc(s); const i = s.toLowerCase().indexOf(tq); return i<0 ? esc(s) : esc(s.slice(0,i))+'<mark>'+esc(s.slice(i,i+tq.length))+'</mark>'+esc(s.slice(i+tq.length)); };
  const row = (n, depth) => {
    if (!match(n)) return '';
    const pad = `padding-left:${6+depth*20}px`;
    if (!n.c) return `<div class="tn" style="${pad}"><span class="sp"></span><input type="checkbox" data-leaf="${n.id}" ${D.features.has(n.id)?'checked':''} id="cb${n.id}"><label class="lb" for="cb${n.id}">${hl(n.n)}</label></div>`;
    const ids = leafIds(n), k = ids.filter(i=>D.features.has(i)).length, open = openNodes.has(n.id) || !!tq;
    return `<div class="tn" style="${pad}"><button class="car${open?' open':''}" data-tog="${n.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg></button>
      <input type="checkbox" data-grp="${n.id}" ${k===ids.length?'checked':''} ${k&&k<ids.length?'data-ind="1"':''}><span class="lb grp" data-tog="${n.id}">${hl(n.n)}</span><span class="ct">${k}/${ids.length}</span></div>` +
      (open ? n.c.map(x=>row(x, depth+1)).join('') : '');
  };
  $('#mTree').innerHTML = TREE.map(m=>row(m,0)).join('') || `<div class="note" style="padding:12px">Aucun résultat</div>`;
  $$('#mTree [data-ind]').forEach(i=>i.indeterminate = true);
  $('#mCnt').textContent = `${D.features.size}/${LEAVES.length} sélectionnées`;
  const find = (id, ns=TREE) => { for (const x of ns){ if (x.id===id) return x; if (x.c){ const r = find(id, x.c); if (r) return r; } } };
  $$('#mTree [data-tog]').forEach(b=>b.onclick=()=>{ const id=b.dataset.tog; openNodes.has(id)?openNodes.delete(id):openNodes.add(id); drawTree(); });
  $$('#mTree [data-leaf]').forEach(b=>b.onchange=()=>{ b.checked?D.features.add(b.dataset.leaf):D.features.delete(b.dataset.leaf); drawTree(); });
  $$('#mTree [data-grp]').forEach(b=>b.onchange=()=>{ leafIds(find(b.dataset.grp)).forEach(i=>b.checked?D.features.add(i):D.features.delete(i)); drawTree(); });
}

/* --- Packs d'un client (capture 4 : modifier / ajouter des packs) --- */
function openClientPacks(id){
  const c = CLIENTS.find(x=>x.id===id);
  const sel = new Map(c.packs.map(([p,d])=>[p,d]));
  const draw = () => {
    const types = new Set([...sel.keys()].flatMap(p=>[...packOf(p).types]));
    const miss = sel.size ? c.eq.filter(e=>!types.has(e[1])) : [];
    $('#cpBody').innerHTML = PACKS.map(p=>`<label class="ck" style="padding:8px 0;border-bottom:1px solid var(--line2)"><input type="checkbox" data-p="${p.id}" ${sel.has(p.id)?'checked':''}>${badge(p)}
        <span class="note" style="margin-left:auto">${sel.has(p.id)?`affecté le ${fmtD(sel.get(p.id))}`:`${p.features.size} fonct. · ${p.types.size===EQ_TYPES.length?'tous types':[...p.types].join(', ')}`}</span></label>`).join('') +
      `<div class="note" style="margin-top:12px">Parc : ${c.eq.map(e=>e[1]).join(', ') || 'aucun équipement'}</div>` +
      (miss.length ? `<div class="pay"><div class="warn1">⚠ ${miss.length} équipement(s) non couvert(s) par ces packs : ${[...new Set(miss.map(e=>e[1]))].join(', ')}.</div></div>` : '');
    $$('#cpBody [data-p]').forEach(b=>b.onchange=()=>{ const p=+b.dataset.p; b.checked?sel.set(p, iso(TODAY)):sel.delete(p); draw(); });
  };
  modal(520, `Packs — ${esc(c.name)}`, `<div id="cpBody"></div>`, `<button class="btn" data-x>Annuler</button><button class="btn primary" id="cpSave">Enregistrer</button>`);
  draw();
  $('#cpSave').onclick = ()=>{
    c.packs.filter(([p])=>!sel.has(p)).forEach(([p,d])=>HIST.push({c:c.id,p,d}));      // l'ancienne ligne reste dans l'historique
    c.packs = [...sel.entries()]; closeModal(); renderAll();
  };
}

/* --- Paiement (capture 5) --- */
function openPay(id){
  closeBell();
  const c = CLIENTS.find(x=>x.id===id), du = daysUntil(c.exp);
  modal(440, `Paiement — ${esc(c.name)}`, `<div class="pay">
    <div class="box1">📅 Date d'expiration actuelle : <b>${fmtD(c.exp)}</b>${isActive(c)&&du<=P.renew?` <span class="ago ${du<=P.crit?'bad':'warn'}">J-${du}</span>`:''}</div>
    <div class="kv">Statut actuel : ${isActive(c)?'<span class="st on"><i></i>Actif</span>':'<span class="st off"><i></i>Bloqué</span>'}</div>
    <div class="kv">Pack : ${c.packs.map(([p])=>badge(packOf(p))).join(' ')}</div>
    <div class="warn1">La validation du paiement met à jour l'expiration et réactive le client. Le blocage empêche l'accès jusqu'à régularisation.</div>
    <label class="fl">Nouvelle date d'expiration</label><input type="date" class="inp" id="payDate" value="${iso(new Date(Math.max(d0(c.exp), d0(TODAY)) + 365*DAY))}"></div>`,
    `<button class="btn danger" id="payBlock" style="margin-right:auto">⦸ Bloquer</button><button class="btn" data-x>Annuler</button><button class="btn primary" id="payOk">Valider le paiement</button>`);
  $('#payBlock').onclick = ()=>{ c.blocked = true; closeModal(); renderAll(); };
  $('#payOk').onclick = ()=>{ const v = $('#payDate').value; if (!v) return; c.exp = v; c.blocked = false; closeModal(); renderAll(); };
}

/* ===================== Contrôles ===================== */
// Barre d'outils : période, date « Au » (aujourd'hui par défaut), comparaison
$('#pAu').value = PER.au; $('#pAu').max = iso(REAL_TODAY);
$('#pFrom').value = PER.from; $('#pTo').value = PER.to; $('#pFrom').max = $('#pTo').max = iso(REAL_TODAY);
$$('#pMode button').forEach(b=>b.onclick=()=>{ PER.mode = b.dataset.m; $$('#pMode button').forEach(x=>x.classList.toggle('on', x===b));
  $('#pAuW').classList.toggle('hidden', PER.mode==='custom'); $('#pCustW').classList.toggle('hidden', PER.mode!=='custom'); EVO_SEL = null; renderAll(); });
$('#pAu').onchange = e=>{ if (!e.target.value) return; PER.au = e.target.value; TODAY = new Date(PER.au+'T12:00:00'); EVO_SEL = null; renderAll(); };
$('#pFrom').onchange = e=>{ PER.from = e.target.value; EVO_SEL = null; renderAll(); };
$('#pTo').onchange = e=>{ PER.to = e.target.value; EVO_SEL = null; renderAll(); };
$('#cmpOn').onclick = ()=>{ CMP.on = !CMP.on; $('#cmpOn').setAttribute('aria-pressed', CMP.on);
  $('#cmpModeW').classList.toggle('hidden', !CMP.on); $('#cmpCustW').classList.toggle('hidden', !CMP.on || CMP.mode!=='custom'); renderAll(); };
$('#cmpMode').onchange = e=>{ CMP.mode = e.target.value; $('#cmpCustW').classList.toggle('hidden', CMP.mode!=='custom');
  if (CMP.mode==='custom' && !CMP.from){ const r = baseRange(); CMP.from = iso(new Date(r.from.getFullYear()-1, r.from.getMonth(), r.from.getDate())); CMP.to = iso(new Date(r.to.getFullYear()-1, r.to.getMonth(), r.to.getDate())); $('#cFrom').value = CMP.from; $('#cTo').value = CMP.to; }
  renderAll(); };
$('#cFrom').onchange = e=>{ CMP.from = e.target.value; renderAll(); };
$('#cTo').onchange = e=>{ CMP.to = e.target.value; renderAll(); };
$('#qPack').oninput = renderPacks;
$('#qClient').oninput = e=>{ F.search = e.target.value.trim().toLowerCase(); clientPage = 0; renderClients(); };
$('#fPack').onchange = e=>{ F.pack = e.target.value; clientPage = 0; renderClients(); };
$('#newPack').onclick = ()=>openPack(null);
// compte connecté : super admin = tout le réseau, revendeur = ses clients uniquement (le catalogue reste géré par Tunav)
const setView = v => { VIEW = v; __root.classList.toggle('as-rev', !!v);
  CLIENTS = v ? ALL_CLIENTS.filter(c=>!c.rev && c.own===v) : ALL_CLIENTS;
  CONN_SEL = {p:null, k:'off'}; openRows.clear(); F.alert = ''; CD_PK.clear(); EVO_SEL = null; closeModal(); renderAll(); };
$('#pView').onchange = e => setView(e.target.value);
$('#pView').value = '';   // le navigateur peut restaurer l'ancien choix du sélecteur
$$('[data-kd]').forEach(b=>b.onclick=()=>openDetail(b.dataset.kd));
$('#bell').onclick = e=>{ e.stopPropagation(); const h = $('#bpanel').classList.toggle('hidden'); if (!h) renderBell(); };
__on('click', e=>{ if (!e.target.closest('#bpanel') && !e.target.closest('#bell')) closeBell(); });
__on('keydown', e=>{ if (e.key==='Escape'){ closeModal(); closeBell(); } });


function showTab(){}   // la documentation est dans Documentation-Packs-v3.html
__on('click',e=>{ const g=e.target.closest('[data-go]'); if(g){ e.preventDefault(); location.href = 'Documentation-Packs-v3.html#' + g.dataset.go; }});

renderAll();


  if (typeof opts.after === 'function') opts.after({ setView: typeof setView === 'function' ? setView : null });
  return () => {
    __listeners.forEach(([t, f, c]) => document.removeEventListener(t, f, c));
    __timers.forEach((id) => { window.clearTimeout(id); window.clearInterval(id); });
  };
}
