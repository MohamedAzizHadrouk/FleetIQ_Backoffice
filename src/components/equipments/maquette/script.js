/* eslint-disable */
// @ts-nocheck
/**
 * Script de la maquette validée Equipements-v3.html (FleetAdmin-maquettes v3), généré par scripts/port-maquette.py.
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
    get pathname() { return '/Equipements-v3.html'; },
    get search() { return opts.search || ''; },
    get hash() { return ''; },
    set href(v) { if (opts.navigate) opts.navigate(v); },
    replace: (v) => { if (opts.navigate) opts.navigate(v); },
    reload: () => {}
  };

/* ===================== Données : lues dans le tableau « Équipements : propriétaire et connexion » ===================== */
// Le tableau reste la source : chaque chiffre du tableau de bord est recalculé à partir de ses lignes.
const REF = new Date('2026-10-01T12:00:00');          // date des données du tableau (« 30/09/2026 · il y a 1 j »)
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const MOIS = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const pct = (a,b) => b ? Math.round(a*100/b) : 0;
const parseD = s => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || ''); return m ? new Date(+m[3], +m[2]-1, +m[1], 12) : null; };
const fmtD = d => d ? d.toLocaleDateString('fr-FR') : '—';
const daysFrom = d => d ? Math.round((REF - d) / 864e5) : null;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// états d'un équipement : installé (connecté ou non connecté), non installé (affecté, jamais posé), stock
const ST = {
  on:   {l:'Connecté',              c:'#059669', bg:'#D1FAE5', fg:'#065F46'},
  off:  {l:'Non connecté',          c:'#DC2626', bg:'#FEE2E2', fg:'#991B1B'},
  wait: {l:'Non installé',          c:'#D97706', bg:'#FEF3C7', fg:'#92400E'},
  stock:{l:'Stock',                 c:'#94A3B8', bg:'#F1F5F9', fg:'#334155'},
};
const ORDER = ['on','off','wait','stock'];
const stHtml = k => `<span class="st" style="color:${ST[k].fg}"><i style="background:${ST[k].c}"></i>${ST[k].l}</span>`;

/* ===================== Parc élargi : lignes ajoutées au tableau, même format ===================== */
// compte connecté : '' = super admin Tunav, sinon le revendeur (il ne voit que ses clients ; pas de Packs ni de Puces)
const FA_VIEW = (() => { try { return localStorage.getItem('fa-view') || ''; } catch (e) { return ''; } })();
__root.classList.toggle('as-rev', !!FA_VIEW);
document.getElementById('who').value = FA_VIEW;
document.getElementById('who').onchange = e => { try { localStorage.setItem('fa-view', e.target.value); } catch (x) {} location.reload(); };
const RES = ['Tunav', 'MyCom', 'FleetPro Sfax', 'NavSud'].filter(r => !FA_VIEW || r === FA_VIEW);   // Tunav (clients directs) toujours en premier
const resName = r => r === 'Tunav' ? 'Tunav · clients directs' : r;
(function grow(){
  let x = 20261002; const rnd = () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = w => { let r = rnd() * w.reduce((a, p) => a + p[1], 0); for (const p of w) if ((r -= p[1]) < 0) return p; return w[0]; };
  const NET = [
    { r:'Tunav', inst:.88, conn:.84, cl:[['Transport Express',22],['Transport Urbain Tunis',30],['Société Médicale ABC',14],['Fret International',20],['Distribution Nord',12],['BTP Carthage',26],['Agri Transport Béja',16],['Cimenterie du Nord',24],['Pharma Distribution',18],['Sotra Bâtiment',28]] },
    { r:'MyCom', inst:.74, conn:.66, cl:[['MyCom',30],['Livraison Rapide',26],['Logistique Sud',34],['Transport Sahel',28],['Bus Côtier',36]] },
    { r:'FleetPro Sfax', inst:.82, conn:.78, cl:[['Taxi Sfax',40],['Frigo Express',24],['Location Auto Plus',30],['Sfax Logistique',22],['Huilerie Sahel',18]] },
    { r:'NavSud', inst:.68, conn:.72, cl:[['Gabès Transport',32],['Djerba Tours',26],['Sud Carburants',22],['Médenine BTP',20],['Oasis Express',28]] },
  ];
  const SOLD = [['FMB920',30],['FMC130',24],['ETX',17],['FMB120',13],['ET6',9],['FMC003',4],['FMB140',3]];
  const STOCK = [['FMB140',26],['FMC003',22],['ET6',18],['FMC130',14],['FMB120',10],['FMB920',6],['ETX',4]];
  const PACK = [['FleetIQ Secure',40,'p-blue'],['FleetIQ Pro',28,'p-indigo'],['FleetIQ Mechanic',14,'p-amber'],['FleetIQ Vision',10,'p-green'],['Aucun pack',8]];
  const OFFER = [['Data 1 Go · Orange',3],['Data 5 Go + SMS · Télécom',3],['Data 2 Go · Ooredoo',2],['Data 500 Mo · Orange',2]];
  const dt = d => { const t = new Date(REF - d * 864e5); return [t.getDate(), t.getMonth() + 1].map(v => String(v).padStart(2, '0')).join('/') + '/' + t.getFullYear(); };
  const sim = () => `+216 ${int(20, 99)} ${int(10, 99)} ${int(10, 99)} ${int(10, 99)}`;
  const red = 'style="color: #B91C1C"', none = '<td style="color: #475569">—</td>';
  let seq = 1001, stk = 5; const rows = [];
  NET.forEach(n => n.cl.forEach(([client, cnt]) => {
    const pI = Math.min(.97, Math.max(.4, n.inst + (rnd() - .5) * .24)), pC = Math.min(.97, Math.max(.35, n.conn + (rnd() - .5) * .3));
    for (let k = 0; k < cnt; k++) {
      const type = pick(SOLD)[0], pk = pick(PACK), st = rnd() > pI ? 'wait' : rnd() < pC ? 'on' : 'off';
      let aff = st === 'wait' ? (rnd() < .5 ? int(3, 30) : int(31, 420)) : int(30, 1000);
      const ad = new Date(REF - aff * 864e5), imei = `EQ-${ad.getFullYear()}-${seq++}`;
      const pack = pk[0] === 'Aucun pack' ? '<td style="color: #475569">Aucun pack</td>' : `<td><span class="pill ${pk[2]}">${pk[0]}</span></td>`;
      const simC = `<td class="num">${sim()}<span class="sub">${pick(OFFER)[0]}</span></td>`;
      let last, conn, stat, inst, bg = '';
      if (st === 'wait') { last = '<td>—</td>'; conn = none; stat = '<td><span class="pill p-amber">Non installé</span></td>'; inst = `<td style="color: #B45309">En attente depuis ${aff} j</td>`; bg = ' style="background: #FFFBEB"'; }
      else {
        const ago = st === 'on' ? (rnd() < .7 ? int(1, 2) : int(3, 7)) : Math.min(aff - 5, rnd() < .25 ? int(8, 14) : int(15, 600));
        const act = st === 'on' ? int(16, 30) : ago < 30 ? int(0, 30 - ago) : 0;
        last = st === 'on' ? `<td class="num">${dt(ago)}<span class="sub">il y a ${ago} j</span></td>` : `<td class="num" ${red}>${dt(ago)}<span class="sub" style="color: #B91C1C; font-weight: 600">il y a ${ago} j</span></td>`;
        conn = st === 'on' ? `<td><span class="pill p-green">Connecté</span><span class="sub">${act} / 30 j</span></td>` : `<td><span class="pill p-red">Non connecté</span><span class="sub">${act} / 30 j</span></td>`;
        stat = '<td><span class="pill p-green">Installé</span></td>'; inst = `<td class="num">${dt(aff - int(1, 4))}</td>`;
        if (st === 'off') bg = ' style="background: #FEF2F2"';
      }
      rows.push(`<tr${bg}><td style="font-weight: 600">${client}<span class="sub">${n.r}</span></td><td>${type}<span class="sub num">${imei}</span></td>${pack}<td class="num">${dt(aff)}</td>${last}${conn}${stat}${simC}<td class="num">${dt(aff)}</td>${inst}</tr>`);
    }
  }));
  for (let k = 0; k < 86; k++) rows.push(`<tr><td style="font-weight: 600">Tunav_Stock<span class="sub">Tunav</span></td><td>${pick(STOCK)[0]}<span class="sub num">STK-2026-${String(stk++).padStart(3, '0')}</span></td><td>—</td><td>—</td><td>—</td><td>—</td><td><span class="pill p-gray">Stock · ${int(5, 400)} j</span></td><td class="num">${sim()}<span class="sub">Aucune offre</span></td><td>—</td><td>—</td></tr>`);
  const tb = $('#eq-list tbody'); tb.insertAdjacentHTML('beforeend', rows.join(''));
  // compte revendeur : seules les lignes de ses clients (pas le stock Tunav)
  if (FA_VIEW) [...tb.rows].forEach(tr => { if ((tr.cells[0].querySelector('.sub')?.textContent || '').trim() !== FA_VIEW || tr.cells[6].textContent.startsWith('Stock')) tr.remove(); });
  // tri : Tunav, puis chaque revendeur ; par client ; connecté → non connecté → non installé ; le stock à la fin
  const key = tr => { const td = tr.querySelectorAll('td'), stat = td[6].textContent, conn = td[5].textContent;
    const stock = stat.startsWith('Stock'), r = (td[0].querySelector('.sub')?.textContent || '').trim();
    return [stock ? 9 : RES.indexOf(r), stock ? '' : td[0].childNodes[0].textContent.trim(), stock ? 3 : stat.includes('Non installé') ? 2 : conn.startsWith('Connecté') ? 0 : 1]; };
  [...tb.rows].map(tr => [key(tr), tr]).sort((a, b) => a[0][0] - b[0][0] || a[0][1].localeCompare(b[0][1], 'fr') || a[0][2] - b[0][2]).forEach(([, tr]) => tb.appendChild(tr));
})();

const EQ = $$('#eq-list tbody tr').map((tr, i) => {
  const td = tr.querySelectorAll('td');
  const main = n => (td[n].childNodes[0]?.textContent || '').trim(), sub = n => (td[n].querySelector('.sub')?.textContent || '').trim();
  const statut = td[6].textContent.trim(), conn = td[5].textContent.trim();
  const st = statut.startsWith('Stock') ? 'stock' : statut === 'Non installé' ? 'wait' : conn.startsWith('Connecté') ? 'on' : 'off';
  const ago = /(\d+)\s*j/.exec(sub(4)), act = /(\d+)\s*\/\s*30/.exec(sub(5));
  return { i, tr, st, client: main(0), reseller: sub(0), type: main(1), imei: sub(1),
    pack: td[2].textContent.trim().replace(/^—$/, ''), packHtml: td[2].querySelector('.pill')?.outerHTML || `<span style="color:#475569">${st==='stock' ? '—' : 'Aucun pack'}</span>`,
    aff: parseD(main(3)), last: parseD(main(4)), ago: ago ? +ago[1] : null, act: act ? +act[1] : null,
    sim: main(7), simOffer: sub(7), sale: td[8].textContent.trim(), install: td[9].textContent.trim() };
});
const isClient = e => e.st !== 'stock', isInst = e => e.st === 'on' || e.st === 'off';
// les 4 états lus par l'utilisateur : installé / non installé (sur les vendus), connecté / non connecté (sur les installés)
const KS = {
  inst:{ l:'Installés',     c:'#2563EB', bg:'#DBEAFE', fg:'#1E40AF', test:isInst,                base:isClient, of:'des équipements vendus' },
  wait:{ l:'Non installés', c:'#D97706', bg:'#FEF3C7', fg:'#92400E', test:e => e.st === 'wait',  base:isClient, of:'des équipements vendus' },
  on:  { l:'Connectés',     c:'#059669', bg:'#D1FAE5', fg:'#065F46', test:e => e.st === 'on',    base:isInst,   of:'des équipements installés' },
  off: { l:'Non connectés', c:'#DC2626', bg:'#FEE2E2', fg:'#991B1B', test:e => e.st === 'off',   base:isInst,   of:'des équipements installés' },
};
const stat = l => { const a = l.filter(isClient), i = a.filter(isInst), on = i.filter(e => e.st === 'on').length; return { a:a.length, inst:i.length, wait:a.length - i.length, on, off:i.length - on }; };
// tuiles des 4 états (en % ) ; btn = cliquables
const q4 = (l, btn, cls = '') => { const t = stat(l), tag = btn ? 'button' : 'div';
  return `<div class="q4 ${cls}">${[['inst', t.inst, t.a, 'vendus'], ['wait', t.wait, t.a, 'vendus'], ['on', t.on, t.inst, 'installés'], ['off', t.off, t.inst, 'installés']]
    .map(([k, v, b, of]) => `<${tag} class="q"${btn ? ` data-ks="${k}"` : ''}><span>${KS[k].l}</span><b style="color:${KS[k].c}">${pct(v, b)} %</b><small>${v} / ${b} ${of}</small></${tag}>`).join('')}</div>`; };
const by = (k, list = EQ) => ORDER.reduce((o, s) => (o[s] = list.filter(e => e.st === s).length, o), {});

/* ===================== Fenêtre ===================== */
function modal(title, body, w = 720){
  $('#md3').innerHTML = `<div class="ov3" id="ov3"><div class="md3" role="dialog" aria-modal="true" style="max-width:${w}px">
    <div class="md3-h"><h3>${title}</h3><button data-x aria-label="Fermer">×</button></div>
    <div class="md3-b">${body}</div>
    <div class="md3-f"><button data-x>Fermer</button></div></div></div>`;
  $('#ov3').onclick = e => { if (e.target.id === 'ov3' || e.target.closest('[data-x]')) $('#md3').innerHTML = ''; };
}
__on('keydown', e => { if (e.key === 'Escape') $('#md3').innerHTML = ''; });
// tout élément portant data-eq (une ligne de liste) ouvre la fiche de l'équipement
__on('click', e => { const t = e.target.closest('[data-eq]'); if (t){ e.preventDefault(); openEq(EQ[+t.dataset.eq]); } });

const when = e => e.st === 'stock' ? 'en stock' : e.st === 'wait' ? `en attente depuis ${daysFrom(e.aff)} j` : e.ago === null ? '—' : e.ago <= 1 ? 'il y a 1 j' : `dernier envoi il y a ${e.ago} j`;
const eqLi = e => `<li data-eq="${e.i}"><span><span class="mono">${esc(e.imei)}</span> · ${esc(e.type)}<small>${esc(e.client)}${e.pack ? ' · '+esc(e.pack) : ''}</small></span><span style="text-align:right">${stHtml(e.st)}<small>${when(e)}</small></span></li>`;
const eqList = l => l.length ? `<ul class="el">${l.map(eqLi).join('')}</ul>` : '<div class="empty">Aucun équipement</div>';
const tree = (l, base, open = true) => RES.filter(r => l.some(e => e.reseller === r)).map((r, j) => {
  const g = l.filter(e => e.reseller === r), b = base ? EQ.filter(e => e.reseller === r && base(e)).length : 0;
  const cl = [...new Set(g.map(e => e.client))].map(c => ({ c, g:g.filter(e => e.client === c) })).sort((x, y) => y.g.length - x.g.length);
  return `<details class="grp rvg"${open && j === 0 ? ' open' : ''}><summary><b>${esc(resName(r))}</b><span style="color:#475569;font-size:12px">${cl.length} client(s)</span><span class="sp">${g.length} équip.${base ? ` · <b>${pct(g.length, b)} %</b>` : ''}</span></summary><div class="rvb">${cl.map(({ c, g:gc }) => {
    const bc = base ? EQ.filter(e => e.client === c && base(e)).length : 0;
    return `<details class="grp"><summary>${esc(c)}<span class="sp">${gc.length}${base ? ` · ${pct(gc.length, bc)} %` : ''}</span></summary>${eqList(gc)}</details>`; }).join('')}</div></details>`; }).join('');
const groupByClient = (l, open = true) => [...new Set(l.map(e => e.client))].map((c, j) => { const g = l.filter(e => e.client === c);
  return `<details class="grp"${open && j === 0 ? ' open' : ''}><summary><b>${esc(c)}</b><span style="color:#475569;font-size:12px">${esc(g[0].reseller)}</span><span class="sp">${g.length} équip.</span></summary>${eqList(g)}</details>`; }).join('');

/* ===================== Cartes du haut ===================== */
function renderKpis(){
  const n = by(), tot = EQ.length, t = stat(EQ);
  $('#refTxt').textContent = fmtD(REF);
  $('#kParc').innerHTML = `${tot}`;
  $('#kParcS').textContent = FA_VIEW ? `équipements de vos clients` : `${t.a} vendus · ${n.stock} en stock`;
  $('#kParcM').innerHTML = ORDER.map(s => `<i style="flex:${n[s]};background:${ST[s].c}"></i>`).join('');
  [['inst', t.inst, t.a, 'vendus'], ['wait', t.wait, t.a, 'vendus'], ['on', t.on, t.inst, 'installés'], ['off', t.off, t.inst, 'installés']].forEach(([k, v, b, of]) => {
    $(`#k_${k}`).innerHTML = `${v} <small style="color:${KS[k].c};font-weight:600;font-size:15px">${pct(v, b)} %</small>`;
    $(`#k_${k}S`).textContent = `sur ${b} ${of}`;
    $(`#k_${k}M`).style.cssText = `width:${pct(v, b)}%;background:${KS[k].c}`; });
  $('#stLeg').innerHTML = ORDER.filter(s => n[s]).map(s => `<span><span class="key" style="background:${ST[s].c}"></span>${ST[s].l} <b>${n[s]}</b></span>`).join('') + '<span style="color:#475569">Installé = connecté + non connecté · connecté = un envoi depuis 7 jours ou moins</span>';
}
const WHAT = {
  on:   'Installé et a envoyé des données depuis 7 jours ou moins.',
  off:  'Installé chez le client (donc facturé) mais aucun envoi depuis plus de 7 jours.',
  wait: 'Vendu (affecté à un client) mais jamais installé : il n’a jamais envoyé de données.',
  stock:'Boîtier chez Tunav, affecté à aucun client.',
  inst: 'Posé chez le client : il a déjà envoyé des données (connecté ou non connecté).',
};
const TODO = { off:'SAV : contrôler alimentation, SIM et antenne ; prévenir le client.', wait:'SAV : planifier l’installation ; Finance : vérifier la facturation.', stock:'Affecter ou réapprovisionner selon les types qui s’installent.' };
// Clic sur une carte : le % en haut, puis la liste par revendeur (Tunav en premier) → client → équipements
function openState(k){
  const K = KS[k], l = EQ.filter(K.test).sort((a, b) => (b.ago ?? daysFrom(b.aff) ?? 0) - (a.ago ?? daysFrom(a.aff) ?? 0)), b = EQ.filter(K.base).length;
  modal(`${K.l} <span class="tg" style="background:${K.bg};color:${K.fg};vertical-align:middle;margin-left:6px">${l.length} équip.</span>`,
    `<div class="pbig"><b style="color:${K.c}">${pct(l.length, b)} %</b><span>${l.length} sur ${b} ${K.of}</span></div>
    <p class="what">${WHAT[k]} Le % de chaque revendeur et de chaque client est calculé sur ses propres équipements.</p>
    ${tree(l, K.base)}`);
}
function openParc(){
  const n = by(), tot = EQ.length, ord = ORDER.filter(s => n[s]); let acc = 0;
  const grad = ord.map(s => { const p = n[s] * 100 / tot, g = `${ST[s].c} ${acc}% ${acc + p}%`; acc += p; return g; }).join(',');
  const types = [...new Set(EQ.map(e => e.type))].map(t => ({ t, l: EQ.filter(e => e.type === t) })).sort((a, b) => b.l.length - a.l.length);
  const cell = (v, b) => `<td class="num">${v} <span style="color:#475569;font-size:11.5px">${pct(v, b)} %</span></td>`;
  const row = (nm, l) => { const t = stat(l); return `<tr><td style="font-weight:600">${nm}</td><td class="num">${t.a}</td>${cell(t.inst, t.a)}${cell(t.wait, t.a)}${cell(t.on, t.inst)}${cell(t.off, t.inst)}</tr>`; };
  modal('Parc', `<div class="donut-w"><div class="donut" style="background:conic-gradient(${grad})"><div><b>${tot}</b><small>équipements</small></div></div>
      <div class="dleg">${ord.map(s => `<div><span class="key" style="background:${ST[s].c}"></span>${ST[s].l} <b>${n[s]}</b> (${pct(n[s], tot)} %)</div>`).join('')}</div></div>
    <h4 class="lbl" style="margin:6px 0 0">Les 4 états · cliquez pour la liste</h4>${q4(EQ, true, 'box')}
    <h4 class="lbl" style="margin:14px 0 6px">Par revendeur</h4>
    <div style="overflow-x:auto;border:1px solid #E2E8F0;border-radius:10px"><table class="tbl"><thead><tr><th>Revendeur</th><th>Vendus</th><th>Installés <small style="text-transform:none;letter-spacing:0;font-weight:500">% vendus</small></th><th>Non installés</th><th>Connectés <small style="text-transform:none;letter-spacing:0;font-weight:500">% installés</small></th><th>Non connectés</th></tr></thead>
      <tbody>${RES.map(r => row(esc(resName(r)), EQ.filter(e => e.reseller === r))).join('')}${n.stock ? `<tr><td style="font-weight:600;color:#475569">Stock Tunav</td><td class="num" colspan="5" style="color:#475569">${n.stock} en stock</td></tr>` : ''}</tbody></table></div>
    <h4 class="lbl" style="margin:14px 0 6px">Par type</h4>
    ${types.map(({ t, l }) => `<details class="grp"><summary><b>${esc(t)}</b><span class="sp">${l.length} · ${ORDER.filter(s => l.some(e => e.st === s)).map(s => `<span style="color:${ST[s].c}">${l.filter(e => e.st === s).length}</span>`).join(' / ')}</span></summary>${eqList(l)}</details>`).join('')}`, 780);
}
$$('[data-k]').forEach(b => b.onclick = () => b.dataset.k === 'parc' ? openParc() : openState(b.dataset.k));
__on('click', e => { const t = e.target.closest('[data-ks]'); if (t) openState(t.dataset.ks); });

/* ===================== Alerte : équipement installé sans données depuis plus de 1 jour ===================== */
// l'alerte part dès qu'un équipement installé n'a rien envoyé depuis plus de 1 jour (24 h) ;
// il reste « Connecté » jusqu'à 7 jours, puis passe « Non connecté ». La cloche garde les alertes des 7 derniers jours.
const DECO_D = 1;
const DECO = () => EQ.filter(e => isInst(e) && e.ago > DECO_D && e.ago <= DECO_D + 7).sort((a, b) => a.ago - b.ago);
const decoTxt = e => `aucune donnée depuis ${e.ago} j${e.st === 'off' ? ' · passé « Non connecté »' : ''}`;
function openDeco(){
  const l = DECO(), b = EQ.filter(isInst).length;
  modal(`Déconnectés depuis plus de ${DECO_D} j <span class="tg" style="background:#FEF3C7;color:#92400E;vertical-align:middle;margin-left:6px">${l.length} équip.</span>`,
    `<div class="pbig"><b style="color:#B45309">${pct(l.length, b)} %</b><span>${l.length} sur ${b} équipements installés : alerte envoyée ces 7 derniers jours</span></div>
    <p class="what">L’alerte part dès qu’un équipement installé n’a envoyé aucune donnée depuis plus de ${DECO_D} jour. Il reste « Connecté » jusqu’à 7 jours sans données, puis il passe « Non connecté ».</p>${tree(l, isInst)}`);
}
function renderBell(){
  const l = DECO(), MAX = 30;
  $('#bellCnt').textContent = l.length > 99 ? '99+' : l.length;
  $('#bpanel').innerHTML = `<div class="bh"><b>Déconnectés depuis plus de ${DECO_D} j</b><small>${l.length} équipement(s) installé(s) sans données · alertes des 7 derniers jours</small></div>${eqList(l.slice(0, MAX))}
    <div class="bf"><a href="#" data-deco>${l.length > MAX ? `Voir les ${l.length} alertes` : 'Voir le détail'} →</a></div>`;
  $('#bpanel [data-deco]').onclick = ev => { ev.preventDefault(); $('#bpanel').classList.add('hidden'); openDeco(); };
}
function liveAlert(){
  const l = DECO(), e = l[0]; if (!e) return;
  $('#toast').innerHTML = `<div class="toast" role="status"><span class="live">En direct</span><div><b>${esc(e.imei)} · ${esc(e.type)} ne répond plus depuis plus de ${DECO_D} j</b><small>${esc(e.client)} · ${esc(resName(e.reseller))} · ${decoTxt(e)}${l.length > 1 ? ` · ${l.length - 1} autre(s) cette semaine` : ''}</small></div><button class="btn" data-t="see">Voir</button><button class="x" data-t="x" aria-label="Fermer">×</button></div>`;
  $('#toast [data-t=see]').onclick = () => { $('#toast').innerHTML = ''; openEq(e); };
  $('#toast [data-t=x]').onclick = () => { $('#toast').innerHTML = ''; };
}
$('#bell').onclick = e => { e.stopPropagation(); $('#bpanel').classList.toggle('hidden'); };
__on('click', e => { if (!e.target.closest('#bpanel') && !e.target.closest('#bell')) $('#bpanel').classList.add('hidden'); else if (e.target.closest('#bpanel [data-eq], #bpanel [data-ks]')) $('#bpanel').classList.add('hidden'); });

/* ===================== À traiter ===================== */
const ALERTS = [
  { id:'deco', t:'Déconnectés depuis plus de 1 j', tag:['SAV','amber'], test:e => DECO().includes(e),
    what:'Installés chez le client et aucune donnée depuis plus de 1 jour (alertes envoyées ces 7 derniers jours). Au-delà de 7 jours, ils passent « Non connecté ».' },
  { id:'mute', t:'Non connectés > 30 j', tag:['SAV','red'], test:e => e.st === 'off' && e.ago > 30,
    what:'Installés chez le client mais muets depuis plus de 30 jours : le client paie un boîtier qui ne sert pas.', todo:'Ouvrir un ticket SAV et appeler le client.' },
  { id:'late', t:'Installation en attente > 30 j', tag:['Installation','amber'], test:e => e.st === 'wait' && daysFrom(e.aff) > 30,
    what:'Affectés depuis plus de 30 jours et toujours pas installés.', todo:'Planifier l’installation ; suspendre la facturation si le boîtier n’est pas posé.' },
];
function renderTodo(){
  $('#todo').innerHTML = ALERTS.map(a => { const l = EQ.filter(a.test);
    return `<button class="card al" data-al="${a.id}" title="${esc([...new Set(l.map(e => e.client))].join(', '))}"><span class="h"><span class="t">${a.t}</span><span class="tg ${a.tag[1]}">${a.tag[0]}</span></span>
      <span class="n"><b style="color:${a.tag[1] === 'red' ? '#B91C1C' : '#B45309'}">${l.length}</b>équipement(s)</span></button>`; }).join('');
  $$('[data-al]').forEach(b => b.onclick = () => { const a = ALERTS.find(x => x.id === b.dataset.al), l = EQ.filter(a.test);
    modal(`${a.t} <span class="tg ${a.tag[1]}" style="vertical-align:middle;margin-left:6px">${a.tag[0]}</span>`, `<p class="what">${a.what}</p>${tree(l)}`); });
}

/* ===================== Graphiques ===================== */
const SEL = { client:null, type:null, last:null, month:null };
const detail = (id, head, list, extra = '') => { $(id).innerHTML = `<div class="dh">${head}</div><div class="db">${eqList(list)}${extra}</div>`; };
const hbars = (id, rows, key, max, onPick) => {
  $(id).innerHTML = rows.map(r => `<button class="hb${SEL[key] === r.k ? ' on' : ''}" data-hk="${esc(r.k)}"><span class="nm">${esc(r.k)}</span>
    <span class="bx" style="width:${r.l.length / max * 100}%">${ORDER.map(s => { const n = r.l.filter(e => e.st === s).length; return n ? `<i style="flex:${n};background:${ST[s].c}" title="${ST[s].l} : ${n}"></i>` : ''; }).join('')}</span>
    <span class="c">${r.l.length}</span></button>`).join('');
  $$(`${id} [data-hk]`).forEach(b => b.onclick = () => { SEL[key] = b.dataset.hk; onPick(); });
};

// 1 · Par revendeur et client : barre en % (connecté, non connecté, non installé) ; à droite, les non connectés et les non installés
let OPEN_R = RES[0];
function renderClient(){
  if (!SEL.client) SEL.client = 'r|' + RES[0];
  const bad = l => { const t = stat(l); return t.a ? (t.off + t.wait) / t.a : 0; }, rows = [];
  RES.forEach(r => { const l = EQ.filter(e => e.reseller === r && isClient(e));
    rows.push({ k:'r|' + r, nm:resName(r), l, lvl:'rv', open:OPEN_R === r });
    if (OPEN_R === r) [...new Set(l.map(e => e.client))].map(c => ({ c, l:l.filter(e => e.client === c) })).sort((a, b) => bad(b.l) - bad(a.l))
      .forEach(x => rows.push({ k:'c|' + x.c, nm:x.c, l:x.l, lvl:'cl' })); });
  $('#gClientLeg').innerHTML = ['on', 'off', 'wait'].map(k => `<span><span class="key" style="background:${ST[k].c}"></span>${ST[k].l}</span>`).join('') + '<span style="color:#475569">installé = vert + rouge</span>';
  $('#gClient').innerHTML = rows.map(r => { const t = stat(r.l);
    return `<button class="hb2 ${r.lvl}${SEL.client === r.k ? ' on' : ''}" data-ck="${esc(r.k)}" title="${esc(r.nm)} : ${pct(t.inst, t.a)} % installés · ${pct(t.on, t.inst)} % des installés connectés"><span class="nm">${r.lvl === 'rv' ? `<span class="chev" style="transform:rotate(${r.open ? 90 : 0}deg)">▸</span>` : ''}${esc(r.nm)}</span>
      <span class="bx">${[['on', t.on], ['off', t.off], ['wait', t.wait]].map(([k, v]) => v ? `<i style="flex:${v};background:${ST[k].c}" title="${ST[k].l} : ${v} (${pct(v, t.a)} %)">${pct(v, t.a) >= 9 ? pct(v, t.a) + ' %' : ''}</i>` : '').join('')}</span>
      <span class="c">${t.a}</span></button>`; }).join('');
  $$('#gClient [data-ck]').forEach(b => b.onclick = () => { const k = b.dataset.ck;
    if (k.startsWith('r|')) { const r = k.slice(2); OPEN_R = OPEN_R === r && SEL.client === k ? null : r; }
    SEL.client = k; renderClient(); });
  const [lv, nm] = [SEL.client.slice(0, 1), SEL.client.slice(2)];
  const l = EQ.filter(e => isClient(e) && (lv === 'r' ? e.reseller === nm : e.client === nm)), t = stat(l);
  const nc = l.filter(e => e.st === 'off').sort((a, b) => b.ago - a.ago), ni = l.filter(e => e.st === 'wait').sort((a, b) => daysFrom(b.aff) - daysFrom(a.aff));
  $('#dClient').innerHTML = `<div class="dh"><b>${esc(lv === 'r' ? resName(nm) : nm)}</b><span style="font-size:12px;color:#475569">${lv === 'c' ? esc(resName(l[0]?.reseller || '')) + ' · ' : ''}${t.a} équip. vendus</span></div>${q4(l)}
    <div class="db" style="max-height:420px"><div class="sh" style="color:#991B1B">Non connectés · ${nc.length}</div>${eqList(nc)}<div class="sh" style="color:#92400E">Non installés · ${ni.length}</div>${eqList(ni)}</div>`;
}
// 2 · Top 5 produits vendus (équipements affectés à un client), détail par revendeur à droite
function renderType(){
  const sold = EQ.filter(isClient), stock = EQ.filter(e => e.st === 'stock');
  const ty = [...new Set(EQ.map(e => e.type))].map(k => ({ k, l:sold.filter(e => e.type === k), s:stock.filter(e => e.type === k).length })).sort((a, b) => b.l.length - a.l.length);
  const top = ty.slice(0, 5), rest = ty.slice(5), max = top[0].l.length, most = [...ty].sort((a, b) => b.s - a.s)[0];
  if (!SEL.type || !top.some(t => t.k === SEL.type)) SEL.type = top[0].k;
  $('#gType').innerHTML = top.map((t, i) => `<button class="hb t5${SEL.type === t.k ? ' on' : ''}" data-tk="${t.k}"><span class="nm"><span class="rk">${i + 1}</span>${t.k}</span>
      <span class="bx" style="width:${t.l.length / max * 100}%"><i style="flex:1;background:#2563EB"></i></span><span class="c"><b>${t.l.length}</b> · ${pct(t.l.length, sold.length)} %</span></button>`).join('')
    + `<p class="t5n">${rest.length ? `Autres modèles : ${rest.map(t => `${t.k} ${t.l.length}`).join(' · ')}. ` : ''}${most.s ? `Le plus en stock : <b>${most.k}</b>, ${most.s} en stock pour ${most.l.length} vendus.` : ''}</p>`;
  $$('#gType [data-tk]').forEach(b => b.onclick = () => { SEL.type = b.dataset.tk; renderType(); });
  const t = ty.find(x => x.k === SEL.type);
  $('#dType').innerHTML = `<div class="dh"><b>${t.k}</b><span style="font-size:12px;color:#475569">${t.l.length} vendus · ${pct(t.l.length, sold.length)} % des ventes · ${t.s} en stock</span></div>${q4(t.l)}
    <div class="db"><ul class="el">${RES.map(r => { const g = t.l.filter(e => e.reseller === r), x = stat(g); return g.length ? `<li data-t5="${r}"><span><b>${esc(resName(r))}</b><small>${x.inst} installés · ${x.on} connectés · ${x.wait} non installés</small></span><span style="text-align:right" class="mono">${g.length}<small>${pct(g.length, t.l.length)} % des ventes</small></span></li>` : ''; }).join('')}</ul></div>`;
  $$('#dType [data-t5]').forEach(li => li.onclick = () => { const r = li.dataset.t5, g = t.l.filter(e => e.reseller === r);
    modal(`${t.k} · ${esc(resName(r))} <span class="tg" style="background:#DBEAFE;color:#1E40AF;vertical-align:middle;margin-left:6px">${g.length} vendus</span>`, `${q4(g, false, 'box')}${tree(g)}`); });
}
// 3 · Dernière communication (tranches)
const BUCKETS = [
  { k:'1',   l:'≤ 1 j',   c:'#059669', test:e => e.ago !== null && e.ago <= 1 },
  { k:'7',   l:'2–7 j',   c:'#34D399', test:e => e.ago !== null && e.ago > 1 && e.ago <= 7 },
  { k:'30',  l:'8–30 j',  c:'#F59E0B', test:e => e.ago !== null && e.ago > 7 && e.ago <= 30 },
  { k:'90',  l:'31–180 j',c:'#F87171', test:e => e.ago !== null && e.ago > 30 && e.ago <= 180 },
  { k:'max', l:'> 180 j', c:'#DC2626', test:e => e.ago !== null && e.ago > 180 },
  { k:'never', l:'Jamais', c:'#D97706', test:e => e.st === 'wait' },
];
function vcols(id, keys, labels, vals, sel, fut, onPick){
  const max = Math.max(1, ...vals.map(v => v.reduce((a, x) => a + x.n, 0)));
  $(id).innerHTML = keys.map((k, i) => { const t = vals[i].reduce((a, x) => a + x.n, 0);
    return `<button class="${sel === k ? 'on' : ''}${fut(i) ? ' fut' : ''}" ${fut(i) ? '' : `data-vk="${k}"`} title="${labels[i]} : ${t} équipement(s)">
      <span class="vl">${t || ''}</span><span class="stk2" style="height:${t / max * 82}%">${vals[i].map(x => x.n ? `<i style="flex:${x.n};background:${x.c}"></i>` : '').join('')}</span></button>`; }).join('');
  $(id + 'X').innerHTML = labels.map((l, i) => `<span class="${sel === keys[i] ? 'on' : ''}${fut(i) ? ' fut' : ''}">${l}</span>`).join('');
  $$(`${id} [data-vk]`).forEach(b => b.onclick = () => onPick(b.dataset.vk));
}
function renderLast(){
  const lists = BUCKETS.map(b => EQ.filter(b.test));
  if (!SEL.last) SEL.last = 'max';
  vcols('#gLast', BUCKETS.map(b => b.k), BUCKETS.map(b => b.l), lists.map((l, i) => [{ n:l.length, c:BUCKETS[i].c }]), SEL.last, () => false, k => { SEL.last = k; renderLast(); });
  const b = BUCKETS.find(x => x.k === SEL.last);
  detail('#dLast', `<b>${b.k === 'never' ? 'Jamais connectés' : 'Dernier envoi ' + b.l}</b><span style="font-size:12px;color:#475569">${EQ.filter(b.test).length} équip.</span>`, EQ.filter(b.test).sort((x, y) => (y.ago ?? 0) - (x.ago ?? 0)));
}
// 4 · Affectations par mois, janvier → décembre (‹ année ›)
let YEAR = REF.getFullYear();
function renderMonth(){
  const keys = Array.from({ length:12 }, (_, i) => `${YEAR}-${i}`), inM = (e, i) => e.aff && e.aff.getFullYear() === YEAR && e.aff.getMonth() === i;
  const fut = i => new Date(YEAR, i, 1) > REF;
  if (!SEL.month || !keys.includes(SEL.month)) { const last = [...keys].reverse().find((k, j) => EQ.some(e => inM(e, 11 - j))); SEL.month = last || keys[REF.getFullYear() === YEAR ? REF.getMonth() : 0]; }
  vcols('#gMonth', keys, keys.map((k, i) => MOIS[i].replace('.', '') + (i === 0 ? ` ${String(YEAR).slice(2)}` : '')),
    keys.map((k, i) => ORDER.map(s => ({ n:EQ.filter(e => inM(e, i) && e.st === s).length, c:ST[s].c }))), SEL.month, fut, k => { SEL.month = k; renderMonth(); });
  const yTot = EQ.filter(e => e.aff && e.aff.getFullYear() === YEAR).length;
  $('#gMonthS').innerHTML = `<span class="ynav"><button data-y="-1" aria-label="Année précédente">‹</button><b>${YEAR}</b><button data-y="1" aria-label="Année suivante">›</button></span> · ${yTot} équipement(s) affecté(s) · couleur = état actuel`;
  $$('#gMonthS [data-y]').forEach(b => b.onclick = () => { YEAR += +b.dataset.y; SEL.month = null; renderMonth(); });
  const m = +SEL.month.split('-')[1], l = EQ.filter(e => inM(e, m));
  detail('#dMonth', `<b>Affectés en ${MOIS[m]} ${YEAR}</b><span style="font-size:12px;color:#475569">${l.length} équip.</span>`, l);
}

/* ===================== Fiche d'un équipement ===================== */
function openEq(e){
  const tile = (t, v, s = '') => `<div><span>${t}</span><b>${v}</b>${s ? `<small>${s}</small>` : ''}</div>`;
  const others = EQ.filter(x => x.client === e.client && x !== e && e.st !== 'stock');
  modal(`<span style="font-family:'IBM Plex Mono',monospace">${esc(e.imei)}</span> · ${esc(e.type)} <span class="tg" style="background:${ST[e.st].bg};color:${ST[e.st].fg};vertical-align:middle;margin-left:6px">${ST[e.st].l}</span>`,
    `<p class="what">${WHAT[e.st]}</p>
    <div class="ft">
      ${tile('Client', esc(e.client), 'revendeur : ' + esc(e.reseller))}
      ${tile('Pack', e.packHtml)}
      ${tile('Affecté le', fmtD(e.aff), e.aff ? `il y a ${daysFrom(e.aff)} j` : '')}
      ${tile('Dernier envoi', e.last ? fmtD(e.last) : 'jamais', e.ago !== null ? `il y a ${e.ago} j` : e.st === 'wait' ? `en attente depuis ${daysFrom(e.aff)} j` : '')}
      ${tile('Activité 30 j', e.act !== null ? `${e.act} / 30 j` : '—', e.act !== null ? `<span class="act" style="display:block"><i style="width:${e.act / 30 * 100}%"></i></span>` : 'aucun envoi')}
      ${tile('SIM', esc(e.sim || '—'), esc(e.simOffer))}
    </div>
    ${others.length ? `<h4 class="lbl" style="margin:14px 0 6px">Autres équipements de ${esc(e.client)} (${others.length})</h4>${eqList(others.slice(0, 8))}${others.length > 8 ? `<p style="font-size:12px;color:#475569;margin:6px 0 0">… et ${others.length - 8} autre(s) : filtrez la liste sur ${esc(e.client)}.</p>` : ''}` : ''}`, 680);
}
$$('#eq-list tbody tr').forEach((tr, i) => tr.onclick = () => openEq(EQ[i]));

/* ===================== Filtres de la liste (le tableau n'est pas modifié, seules les lignes sont masquées) ===================== */
$('#fOwner').innerHTML = '<option>Tous les clients</option>' + RES.map(r => `<optgroup label="${resName(r)}">${[...new Set(EQ.filter(e => e.reseller === r && isClient(e)).map(e => e.client))].sort((a, b) => a.localeCompare(b, 'fr')).map(c => `<option>${esc(c)}</option>`).join('')}</optgroup>`).join('') + (FA_VIEW ? '' : '<option>Stock Tunav</option>');
{ const t = stat(EQ), n = by(); $('#eqSub').textContent = `${EQ.length} équipements · ${t.on} connectés · ${t.off} non connectés · ${t.wait} non installés · ${n.stock} en stock — ${FA_VIEW ? `clients de ${FA_VIEW}` : 'Tunav en premier, puis MyCom, FleetPro Sfax et NavSud'}`; }
if (FA_VIEW) $('#pSub').textContent = `Boîtiers GPS de vos clients (${FA_VIEW}) : installés ou non, connectés ou non, quoi faire.`;
let LIMIT = 25, ETAT = 'all';
const ETABS = [
  { k:'all',  l:'Tous',          c:'#334155', bg:'#F1F5F9', test:() => true },
  { k:'inst', l:'Installés',     test:KS.inst.test, base:'a' },
  { k:'wait', l:'Non installés', test:KS.wait.test, base:'a' },
  { k:'on',   l:'Connectés',     test:KS.on.test,   base:'i' },
  { k:'off',  l:'Non connectés', test:KS.off.test,  base:'i' },
  { k:'stock',l:'Stock',         c:'#64748B', bg:'#F1F5F9', test:e => e.st === 'stock' },
].filter(x => !FA_VIEW || x.k !== 'stock');
function renderTabs(l){
  const t = stat(l);
  $('#eqTabs').style.setProperty('--n', ETABS.length);
  $('#eqTabs').innerHTML = ETABS.map(x => { const K = KS[x.k] || x, n = l.filter(x.test).length, b = x.base === 'a' ? t.a : t.inst;
    const sub = x.base ? `sur ${b} ${x.base === 'a' ? 'vendus' : 'installés'}` : x.k === 'all' ? (FA_VIEW ? 'équipements de vos clients' : `${t.a} vendus · ${l.length - t.a} en stock`) : 'chez Tunav';
    return `<button role="tab" aria-selected="${ETAT === x.k}" class="${ETAT === x.k ? 'on' : ''}" data-et="${x.k}" style="--c:${K.c};--bg:${K.bg}"><span>${x.l}</span><b>${n}${x.base ? `<small>${pct(n, b)} %</small>` : ''}</b><em>${sub}</em></button>`; }).join('');
  $$('#eqTabs [data-et]').forEach(b => b.onclick = () => { ETAT = b.dataset.et; applyFilters(); });
}
const FI = $$('#eq-filters input, #eq-filters select');   // recherche, type, revendeur, propriétaire, statut, pack, connexion, du, au
const DEF = FI.map(f => f.value);
function applyFilters(keep){
  if (keep !== true) LIMIT = 25;
  const [q, type, res, owner, stat, pack, conn, from, to] = FI.map(f => f.value), changedDates = from !== DEF[7] || to !== DEF[8];
  const f0 = from ? new Date(from + 'T00:00:00') : null, t0 = to ? new Date(to + 'T23:59:59') : null;
  let n = 0; const pass = [];
  EQ.forEach(e => {
    const ok0 = (!q || e.tr.textContent.toLowerCase().includes(q.toLowerCase()))
      && (type.startsWith('Tous') || e.type === type)
      && (res === 'Tous' || e.reseller === res)
      && (owner.startsWith('Tous') || e.client === owner || (owner === 'Stock Tunav' && e.st === 'stock'))
      && (stat.startsWith('Tous') || (stat === 'Installé' && (e.st === 'on' || e.st === 'off')) || (stat === 'Non installé' && e.st === 'wait') || (stat === 'Stock' && e.st === 'stock') || (stat.startsWith('Hors ligne') && e.ago !== null && e.ago > 1))
      && (pack.startsWith('Tous') || (pack === 'Aucun pack' ? !e.pack || e.pack === 'Aucun pack' : e.pack === pack))
      && (conn === 'Tous' || (conn.startsWith('Connecté') ? e.st === 'on' : e.st === 'off' || e.st === 'wait'))
      && (!changedDates || (e.aff && (!f0 || e.aff >= f0) && (!t0 || e.aff <= t0)));
    if (ok0) pass.push(e);
    const ok = ok0 && ETABS.find(x => x.k === ETAT).test(e);
    e.tr.style.display = ok && n < LIMIT ? '' : 'none'; n += ok;
  });
  renderTabs(pass);
  $('#eqCount').textContent = `${n} / ${EQ.length} équipement(s)${n > LIMIT ? ` · ${LIMIT} affichés` : ''}`;
  $('#eqMore').innerHTML = n > LIMIT ? `<button data-more="25">Afficher 25 de plus</button><button data-more="all">Tout afficher (${n})</button>` : '';
  $$('#eqMore [data-more]').forEach(b => b.onclick = () => { LIMIT = b.dataset.more === 'all' ? 1e9 : LIMIT + 25; applyFilters(true); });
}
FI.forEach(f => f.addEventListener(f.tagName === 'SELECT' ? 'change' : 'input', () => applyFilters()));
$('#eqReset').onclick = () => { FI.forEach((f, i) => f.value = DEF[i]); ETAT = 'all'; applyFilters(); };

renderKpis(); renderTodo(); renderClient(); renderType(); renderLast(); renderMonth(); applyFilters(); renderBell();
setTimeout(liveAlert, 1500);

  if (typeof opts.after === 'function') opts.after({ setView: typeof setView === 'function' ? setView : null });
  return () => {
    __listeners.forEach(([t, f, c]) => document.removeEventListener(t, f, c));
    __timers.forEach((id) => { window.clearTimeout(id); window.clearInterval(id); });
  };
}
