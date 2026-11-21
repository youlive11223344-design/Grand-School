import { auth, db } from "./firebase.js";
import { S } from "./strings.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAYS = [0, 1, 2, 3, 4, 5];
const HUES = [212, 152, 28, 340, 268, 188, 48, 0, 120, 300, 80, 232];
const hue = s => { let h = 0; String(s).toLowerCase().split('').forEach(ch => { h = (h * 31 + ch.charCodeAt(0)) >>> 0; }); return HUES[h % HUES.length]; };
const todayIdx = () => (new Date().getDay() + 6) % 7; // 0 = dushanba ... 6 = yakshanba
const nat = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true });
const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const read = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };

let list = [], tNames = [], on = false;
let mode = read('schedMode') === 'tch' ? 'tch' : 'cls';
let cur = read('schedCls'), grade = null, tch = read('schedTch') || '';
let day = todayIdx() < 6 ? todayIdx() : 0;

// ---------- Ma'lumot yordamchilari ----------
const parseCell = v => { const p = String(v || '').split('|'); return { subj: (p[0] || '').trim(), tch: p.slice(1).join('|').trim() }; };
const cellOf = (c, d, i) => ((c.days || {})['d' + d] || [])[i] || '';
const gradeOf = c => { const m = /^\d+/.exec(String(c.name)); return m ? +m[0] : -1; };
const rowsOf = cs => Math.max(1, ...cs.map(c => Math.max((c.times || []).length, ...DAYS.map(d => ((c.days || {})['d' + d] || []).length))));
const activeDays = cs => {
  const r = DAYS.filter(d => cs.some(c => ((c.days || {})['d' + d] || []).some(v => String(v || '').trim())));
  return r.length ? r : DAYS.slice(0, 5);
};
const slotNow = t => {
  const m = /(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/.exec(t || '');
  if (!m) return false;
  const n = new Date(), x = n.getHours() * 60 + n.getMinutes();
  return x >= +m[1] * 60 + +m[2] && x < +m[3] * 60 + +m[4];
};
const teacherNames = () => {
  const m = new Map();
  list.forEach(c => DAYS.forEach(d => ((c.days || {})['d' + d] || []).forEach(v => {
    const t = parseCell(v).tch;
    if (t && !m.has(t.toLowerCase())) m.set(t.toLowerCase(), t);
  })));
  return [...m.values()].sort(nat);
};

// ---------- Uslub (style.css ga tegmaslik uchun shu yerda) ----------
const hideRules = DAYS.map(i => `.sch[data-day="${i}"] [data-d]:not([data-d="${i}"])`).join(',');
document.head.insertAdjacentHTML('beforeend', `<style>
.schtop{display:grid;gap:12px;margin-bottom:22px}
.schm{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.schmb{padding:9px 20px;border-radius:999px;border:2px solid var(--head);background:var(--card);color:var(--head);font:700 .92rem var(--sans);cursor:pointer}
.schmb[aria-pressed=true]{background:var(--tab-on-bg);color:var(--tab-on-fg);border-color:var(--tab-on-bg)}
.schp{margin-left:auto;padding:9px 18px;border-radius:999px;border:2px solid var(--border);background:transparent;color:var(--mute);font:700 .85rem var(--sans);cursor:pointer}
.schp:hover{border-color:var(--gold);color:var(--head)}
.schrow{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.schl{font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin-right:4px}
.schc{min-width:42px;padding:8px 14px;border-radius:12px;border:2px solid var(--border);background:var(--card);color:var(--head);font:700 .9rem var(--sans);cursor:pointer}
.schc.sec{border-radius:999px;padding:8px 18px}
.schc:hover{border-color:var(--gold)}
.schc[aria-pressed=true]{background:var(--tab-on-bg);color:var(--tab-on-fg);border-color:var(--tab-on-bg)}
.schq{flex:1;min-width:240px;max-width:480px;padding:12px 16px;border-radius:14px;border:2px solid var(--border);background:var(--card);color:var(--text);font:500 1rem var(--sans)}
.schq:focus{outline:none;border-color:var(--gold)}
.schhd{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:14px}
.schhd h3{font-size:1.9rem;color:var(--head)}
.schhd span{color:var(--mute);font-size:.9rem}
.dtabs{display:none;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.dtab{padding:8px 16px;border-radius:999px;border:2px solid var(--head);background:var(--card);color:var(--head);font:700 .9rem var(--sans);cursor:pointer}
.dtab[aria-pressed=true]{background:var(--tab-on-bg);color:var(--tab-on-fg);border-color:var(--tab-on-bg)}
.schw{background:var(--card);border:1px solid var(--border);border-radius:20px;overflow-x:auto}
table.sch{width:100%;border-collapse:collapse;min-width:760px}
.sch th{padding:14px 10px;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;color:var(--mute);border-bottom:1px solid var(--border)}
.sch td{padding:6px;border-bottom:1px solid var(--border);vertical-align:top}
.sch tr:last-child td{border-bottom:0}
.sch .n{width:40px;text-align:center;color:var(--mute);font-weight:700;padding:6px 4px}
.sch .tm{white-space:nowrap;color:var(--mute);font-size:.8rem;width:96px}
.sch td.today{background:rgba(201,162,74,.07)}
.sch th.today{color:var(--head);box-shadow:inset 0 -3px 0 var(--gold)}
.sch .e{display:block;padding:10px;color:var(--mute)}
.cl{padding:8px 10px;border-radius:10px;border-left:4px solid hsl(var(--h),65%,50%);background:hsla(var(--h),80%,50%,.12)}
.cl+.cl{margin-top:6px}
.cl b{display:block;font-size:.9rem;color:var(--head);line-height:1.25}
.cl small{display:block;font-size:.76rem;color:var(--mute);margin-top:2px}
.cl.now{box-shadow:0 0 0 2px var(--gold)}
.nowb{float:right;font-style:normal;font-size:.62rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:var(--gold);color:#0F4028;padding:1px 7px;border-radius:999px;margin-left:6px}
.schempty{color:var(--mute)}
@media(max-width:700px){
  .dtabs{display:flex}
  .schp{margin-left:0}
  table.sch{min-width:0}
  .sch .tm{width:auto;font-size:.72rem}
  ${hideRules}{display:none}
}
@media(max-width:1180px){
  html.sched #burger{display:block;order:4;margin-left:6px}
  html.sched #authLi{margin-left:auto}
  html.sched nav ul{position:absolute;top:62px;left:0;right:0;margin:0;background:rgba(15,64,40,.94);border:1px solid rgba(255,255,255,.2);border-radius:22px;box-shadow:0 20px 50px rgba(5,28,17,.4);flex-direction:column;padding:16px 22px;display:none}
  html.sched[data-theme=dark] nav ul{background:rgba(9,31,21,.96)}
  html.sched nav ul.open{display:flex}
}
@media print{
  body *{visibility:hidden}
  #jadval,#jadval *{visibility:visible}
  #jadval{position:absolute;left:0;top:0;width:100%;padding:12px;background:#fff}
  #jadval h2,#jadval .lead,#jadval .schtop,#jadval .dtabs{display:none}
  .sch [data-d]{display:table-cell!important}
  #jadval *{color:#000!important;box-shadow:none!important}
  .schw{border:0;overflow:visible}
  table.sch{min-width:0;font-size:11px}
  .cl{background:#fff!important;border:1px solid #999;border-left:4px solid #000}
  .nowb{display:none}
}
</style>`);

// ---------- Chizish ----------
function hide() {
  on = false;
  $('#jadval').hidden = true;
  $('#navSched').hidden = true;
  document.documentElement.classList.remove('sched');
}

function show() {
  on = true;
  $('#jadval').hidden = false;
  $('#navSched').hidden = false;
  document.documentElement.classList.add('sched');
  render();
}

const card = (subj, sub, h, now) =>
  `<div class="cl${now ? ' now' : ''}" style="--h:${h}"><b>${esc(subj)}${now ? `<i class="nowb">${esc(S('sch.now'))}</i>` : ''}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;

function dayTabs(ds, ad) {
  return `<div class="dtabs">${ds.map(d => `<button class="dtab" type="button" data-dt="${d}" aria-pressed="${d === ad}">${esc(S('s' + d))}</button>`).join('')}</div>`;
}

function classView() {
  const c = list.find(x => x.id === cur);
  if (!c) return '';
  const ds = activeDays([c]), n = rowsOf([c]), times = c.times || [], today = todayIdx();
  const ad = ds.includes(day) ? day : ds[0];
  const head = ds.map(d => `<th data-d="${d}" class="${d === today ? 'today' : ''}">${esc(S('d' + d))}</th>`).join('');
  let rows = '';
  for (let i = 0; i < n; i++) {
    rows += `<tr><td class="n">${i + 1}</td><td class="tm">${esc(times[i] || '')}</td>${ds.map(d => {
      const p = parseCell(cellOf(c, d, i));
      const now = d === today && slotNow(times[i]);
      return `<td data-d="${d}" class="${d === today ? 'today' : ''}">${p.subj ? card(p.subj, p.tch, hue(p.subj), now) : '<span class="e">—</span>'}</td>`;
    }).join('')}</tr>`;
  }
  return `<div class="schhd"><h3>${esc(c.name)}</h3>${c.note ? `<span>${esc(c.note)}</span>` : ''}</div>
    ${dayTabs(ds, ad)}
    <div class="schw"><table class="sch" data-day="${ad}"><thead><tr><th class="n">№</th><th class="tm">${esc(S('sch.time'))}</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function teacherView() {
  if (!tch) return `<p class="schempty">${esc(S('sch.pick'))}</p>`;
  const key = tch.toLowerCase(), grid = {}, times = [];
  list.forEach(c => {
    (c.times || []).forEach((t, i) => { if (!times[i]) times[i] = t; });
    DAYS.forEach(d => ((c.days || {})['d' + d] || []).forEach((v, i) => {
      const p = parseCell(v);
      if (p.tch && p.tch.toLowerCase() === key) {
        const k = d + ':' + i;
        (grid[k] = grid[k] || []).push({ cls: c.name, subj: p.subj });
      }
    }));
  });
  if (!Object.keys(grid).length) return `<p class="schempty">${esc(S('sch.tnone'))}</p>`;
  const ds = activeDays(list), n = rowsOf(list), today = todayIdx();
  const ad = ds.includes(day) ? day : ds[0];
  const head = ds.map(d => `<th data-d="${d}" class="${d === today ? 'today' : ''}">${esc(S('d' + d))}</th>`).join('');
  let rows = '';
  for (let i = 0; i < n; i++) {
    rows += `<tr><td class="n">${i + 1}</td><td class="tm">${esc(times[i] || '')}</td>${ds.map(d => {
      const es = grid[d + ':' + i] || [];
      const now = d === today && slotNow(times[i]);
      return `<td data-d="${d}" class="${d === today ? 'today' : ''}">${es.length ? es.map(e => card(e.subj, e.cls, hue(e.subj), now)).join('') : '<span class="e">—</span>'}</td>`;
    }).join('')}</tr>`;
  }
  return `<div class="schhd"><h3>${esc(tch)}</h3></div>
    ${dayTabs(ds, ad)}
    <div class="schw"><table class="sch" data-day="${ad}"><thead><tr><th class="n">№</th><th class="tm">${esc(S('sch.time'))}</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function topHtml() {
  const modes = `<div class="schm">
    <button class="schmb" type="button" data-m="cls" aria-pressed="${mode === 'cls'}">${esc(S('sch.mCls'))}</button>
    <button class="schmb" type="button" data-m="tch" aria-pressed="${mode === 'tch'}">${esc(S('sch.mTch'))}</button>
    <button class="schp" id="schPrint" type="button">${esc(S('sch.print'))}</button>
  </div>`;
  if (mode === 'cls') {
    const grades = [...new Set(list.map(gradeOf))].sort((a, b) => a - b);
    const gp = grades.map(g => `<button class="schc" type="button" data-g="${g}" aria-pressed="${g === grade}">${g < 0 ? '•' : g}</button>`).join('');
    const sec = list.filter(c => gradeOf(c) === grade)
      .map(c => `<button class="schc sec" type="button" data-c="${esc(c.id)}" aria-pressed="${c.id === cur}">${esc(c.name)}</button>`).join('');
    return `${modes}<div class="schrow"><span class="schl">${esc(S('sch.grade'))}</span>${gp}</div><div class="schrow">${sec}</div>`;
  }
  return `${modes}<div class="schrow"><input id="schQ" class="schq" list="schTL" value="${esc(tch)}" placeholder="${esc(S('sch.tph'))}" autocomplete="off"><datalist id="schTL">${tNames.map(n => `<option value="${esc(n)}">`).join('')}</datalist></div>`;
}

function paintView() {
  const v = $('#schView');
  if (v) v.innerHTML = mode === 'cls' ? classView() : teacherView();
}

function render() {
  if (!on) return;
  $('#schH').textContent = S('sch.h');
  $('#schLead').textContent = S('sch.lead');
  $('#navSchedA').textContent = S('sch.nav');
  const box = $('#schBox');

  if (!list.length) { box.innerHTML = `<p class="schempty">${esc(S('sch.none'))}</p>`; return; }
  if (!list.some(c => c.id === cur)) cur = list[0].id;
  const cc = list.find(c => c.id === cur);
  if (grade === null || !list.some(c => gradeOf(c) === grade)) grade = gradeOf(cc);

  box.innerHTML = `<div class="schtop">${topHtml()}</div><div id="schView"></div>`;
  paintView();
}

// ---------- Hodisalar ----------
function pickTeacher(v, loose) {
  v = v.trim();
  const k = v.toLowerCase();
  let hit = tNames.find(n => n.toLowerCase() === k);
  if (!hit && loose && k) {
    const m = tNames.filter(n => n.toLowerCase().startsWith(k));
    if (m.length === 1) hit = m[0];
  }
  if (hit) {
    tch = hit; store('schedTch', hit); paintView();
    if (loose && $('#schQ')) $('#schQ').value = hit;
  } else if (!k) {
    tch = ''; store('schedTch', ''); paintView();
  } else if (loose) {
    tch = v; paintView();
  }
}

$('#schBox').addEventListener('click', e => {
  const m = e.target.closest('[data-m]');
  if (m) { mode = m.dataset.m; store('schedMode', mode); render(); return; }
  if (e.target.closest('#schPrint')) { window.print(); return; }
  const g = e.target.closest('[data-g]');
  if (g) {
    grade = +g.dataset.g;
    const curC = list.find(c => c.id === cur);
    if (!curC || gradeOf(curC) !== grade) {
      const f = list.find(c => gradeOf(c) === grade);
      if (f) { cur = f.id; store('schedCls', cur); }
    }
    render();
    return;
  }
  const c = e.target.closest('[data-c]');
  if (c) {
    cur = c.dataset.c;
    const cc = list.find(x => x.id === cur);
    if (cc) grade = gradeOf(cc);
    store('schedCls', cur);
    render();
    return;
  }
  const d = e.target.closest('[data-dt]');
  if (d) { day = +d.dataset.dt; paintView(); }
});

$('#schBox').addEventListener('input', e => { if (e.target.id === 'schQ') pickTeacher(e.target.value, false); });
$('#schBox').addEventListener('change', e => { if (e.target.id === 'schQ') pickTeacher(e.target.value, true); });

window.addEventListener('langchange', render);

// "Hozir" belgisi yangilanib turishi uchun (har daqiqada faqat jadvalni qayta chizadi)
setInterval(() => { if (on && !document.hidden) paintView(); }, 60000);

// ---------- Faqat ro'yxatdan o'tganlarga ----------
onAuthStateChanged(auth, async u => {
  if (!u) { hide(); return; }
  try {
    const p = await getDoc(doc(db, 'users', u.uid));
    if (!p.exists()) { hide(); return; }
    const s = await getDocs(collection(db, 'schedules'));
    list = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => nat(a.name, b.name));
    tNames = teacherNames();
    show();
  } catch (e) {
    console.warn('Jadval yuklanmadi:', e);
    hide();
  }
});