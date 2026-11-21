import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, collection, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const say = (t, ok) => { const e = $('#sch-msg'); e.textContent = t; e.className = 'msg' + (ok ? ' ok' : ''); };

const DN = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const DAYS = [0, 1, 2, 3, 4, 5];
const DEF = ['08:30–09:30', '09:40–10:40', '10:50–11:50', '12:00–13:00'];
const MAXROWS = 12;

let classes = [], draft = null, seedNames = [];

// ---------- Qo'shimcha elementlar (admin.html ga tegmasdan) ----------
const pane = $('[data-p="schedule"]');
$('#sch-name').insertAdjacentHTML('afterend',
  '<input type="text" id="sch-note" maxlength="60" placeholder="Izoh (ixtiyoriy), masalan: 7-sentyabr holatiga">');
pane.querySelector('.hintp').insertAdjacentHTML('afterend',
  '<p class="hintp">Katakka <b>Fan | O‘qituvchi</b> ko‘rinishida yozing (masalan: <b>Matematika | Sariboyev</b>). Saytda fan qalin, o‘qituvchi ostida kichik yoziladi, o‘qituvchi bo‘yicha qidiruv ham shu orqali ishlaydi.</p>');
pane.insertAdjacentHTML('afterbegin', `
  <div class="af wide" id="sch-seedbox" hidden>
    <h3>PDF dan tayyorlangan jadvalni kiritish</h3>
    <p class="hintp">«Dars jadvali 2026–2027» (7-sentyabr holatiga): 0A dan 8Z gacha 26 ta sinf. Bir tugma bilan hammasini bazaga kiritasiz, keyin istalgan sinfni shu yerdan tahrirlaysiz. Bazada bor sinflar o‘tkazib yuboriladi (ustidan yozilmaydi).</p>
    <div><button class="btn gold sm" id="sch-seed" type="button">Jadvalni kiritish</button></div>
    <div class="msg" id="sch-seedmsg" role="status"></div>
  </div>`);

function blank() {
  const days = {};
  DAYS.forEach(d => { days['d' + d] = DEF.map(() => ''); });
  return { id: null, name: '', note: '', times: DEF.slice(), days };
}

// bazadan kelgan ma'lumotni bir xil uzunlikka keltiradi
function norm(c) {
  const t = c.times || [];
  const n = Math.max(t.length, 1, ...DAYS.map(d => ((c.days || {})['d' + d] || []).length));
  const times = Array.from({ length: n }, (_, i) => t[i] || '');
  const days = {};
  DAYS.forEach(d => {
    const a = (c.days || {})['d' + d] || [];
    days['d' + d] = Array.from({ length: n }, (_, i) => a[i] || '');
  });
  return { id: c.id || null, name: c.name || '', note: c.note || '', times, days };
}
const copy = c => norm(JSON.parse(JSON.stringify(c)));

// ---------- Chizish ----------
function renderChips() {
  $('#sch-chips').innerHTML = classes.length
    ? classes.map(c => `<button class="scc" type="button" data-id="${esc(c.id)}" aria-pressed="${!!draft && draft.id === c.id}">${esc(c.name)}</button>`).join('')
    : '<span class="hintp">Hozircha sinflar yo‘q. «+ Yangi sinf» ni bosing yoki yuqoridagi tayyor jadvalni kiriting.</span>';
}

function renderEditor() {
  $('#sch-editor').hidden = !draft;
  if (!draft) return;
  $('#sch-name').value = draft.name;
  $('#sch-note').value = draft.note || '';
  const head = `<tr><th>№</th><th>Vaqt</th>${DN.map(d => `<th>${d}</th>`).join('')}</tr>`;
  const rows = draft.times.map((t, i) => `<tr>
    <td class="n">${i + 1}</td>
    <td><input data-r="${i}" data-c="t" value="${esc(t)}" maxlength="20" placeholder="08:30–09:30"></td>
    ${DAYS.map(d => `<td><input data-r="${i}" data-c="${d}" value="${esc(draft.days['d' + d][i])}" maxlength="60" placeholder="Fan | O‘qituvchi"></td>`).join('')}
  </tr>`).join('');
  $('#sch-grid').innerHTML = `<thead>${head}</thead><tbody>${rows}</tbody>`;
  $('#sch-del').hidden = !draft.id;
  $('#sch-dup').hidden = !draft.id;
}

function renderSeed() {
  const have = new Set(classes.map(c => String(c.name).toLowerCase()));
  const missing = seedNames.filter(n => !have.has(n.toLowerCase())).length;
  $('#sch-seedbox').hidden = !missing;
  if (missing) $('#sch-seed').textContent = missing + ' ta sinf jadvalini kiritish';
}

function renderAll() { renderChips(); renderEditor(); renderSeed(); }

// ---------- Yuklash ----------
async function load(selectId) {
  try {
    const s = await getDocs(collection(db, 'schedules'));
    classes = s.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true }));
  } catch (e) { say(e.code || e.message); }
  if (selectId) {
    const c = classes.find(x => x.id === selectId);
    draft = c ? copy(c) : null;
  } else if (draft && draft.id && !classes.some(x => x.id === draft.id)) {
    draft = null;
  }
  renderAll();
}

// ---------- Hodisalar ----------
$('#sch-chips').addEventListener('click', e => {
  const b = e.target.closest('[data-id]');
  if (!b) return;
  const c = classes.find(x => x.id === b.dataset.id);
  if (c) { draft = copy(c); say(''); renderAll(); }
});

$('#sch-new').onclick = () => {
  draft = blank(); say(''); renderAll();
  $('#sch-name').focus();
};

$('#sch-cancel').onclick = () => { draft = null; say(''); renderAll(); };

$('#sch-name').oninput = e => { if (draft) draft.name = e.target.value; };
$('#sch-note').oninput = e => { if (draft) draft.note = e.target.value; };

$('#sch-grid').addEventListener('input', e => {
  const t = e.target;
  if (!draft || t.dataset.r === undefined) return;
  const r = +t.dataset.r, c = t.dataset.c;
  if (c === 't') draft.times[r] = t.value;
  else draft.days['d' + c][r] = t.value;
});

$('#sch-addrow').onclick = () => {
  if (!draft) return;
  if (draft.times.length >= MAXROWS) return say('Eng ko‘pi bilan ' + MAXROWS + ' ta qator bo‘ladi.');
  draft.times.push('');
  DAYS.forEach(d => draft.days['d' + d].push(''));
  renderEditor();
};

$('#sch-delrow').onclick = () => {
  if (!draft || draft.times.length <= 1) return;
  draft.times.pop();
  DAYS.forEach(d => draft.days['d' + d].pop());
  renderEditor();
};

$('#sch-dup').onclick = () => {
  if (!draft) return;
  draft = { ...copy(draft), id: null, name: '' };
  say('Nusxa tayyor: yangi sinf nomini yozib, «Saqlash» ni bosing.', true);
  renderAll();
  $('#sch-name').focus();
};

$('#sch-save').onclick = async () => {
  if (!draft) return;
  const name = $('#sch-name').value.trim();
  if (!name) return say('Sinf nomini yozing (masalan: 5-A).');
  if (classes.some(c => c.id !== draft.id && String(c.name).toLowerCase() === name.toLowerCase())) {
    return say('Bunday nomli sinf allaqachon bor.');
  }

  // oxiridagi bo'sh qatorlarni olib tashlaymiz
  let n = draft.times.length;
  const empty = i => !draft.times[i].trim() && DAYS.every(d => !draft.days['d' + d][i].trim());
  while (n > 1 && empty(n - 1)) n--;

  const days = {};
  DAYS.forEach(d => { days['d' + d] = draft.days['d' + d].slice(0, n).map(s => s.trim()); });
  const data = {
    name, note: ($('#sch-note').value || '').trim(),
    times: draft.times.slice(0, n).map(s => s.trim()), days, updatedAt: serverTimestamp()
  };

  try {
    say('Saqlanmoqda…', true);
    let id = draft.id;
    if (id) await updateDoc(doc(db, 'schedules', id), data);
    else id = (await addDoc(collection(db, 'schedules'), data)).id;
    await load(id);
    say('Saqlandi.', true);
  } catch (err) { say(err.code || err.message); }
};

$('#sch-del').onclick = async () => {
  if (!draft || !draft.id) return;
  if (!confirm('«' + draft.name + '» sinfining jadvali butunlay o‘chirilsinmi?')) return;
  try {
    await deleteDoc(doc(db, 'schedules', draft.id));
    draft = null;
    await load();
    say('O‘chirildi.', true);
  } catch (err) { say(err.code || err.message); }
};

// ---------- Tayyor jadvalni (PDF) bazaga kiritish ----------
$('#sch-seed').onclick = async () => {
  const msg = $('#sch-seedmsg');
  try {
    msg.textContent = 'Kiritilmoqda…'; msg.className = 'msg ok';
    const { SEED } = await import('./schedule-seed.js');
    const have = new Set(classes.map(c => String(c.name).toLowerCase()));
    let k = 0;
    for (const s of SEED) {
      if (have.has(s.name.toLowerCase())) continue;
      const n = s.times.length;
      const days = {};
      DAYS.forEach(d => {
        const a = (s.days['d' + d] || []).slice(0, n);
        days['d' + d] = Array.from({ length: n }, (_, i) => a[i] || '');
      });
      await setDoc(doc(db, 'schedules', 's-' + s.name), {
        name: s.name, note: s.note || '', times: s.times, days, updatedAt: serverTimestamp()
      });
      k++;
    }
    msg.textContent = k + ' ta sinf jadvali kiritildi.';
    await load();
  } catch (err) { msg.textContent = err.code || err.message; msg.className = 'msg'; }
};

// ---------- Faqat adminlar uchun ----------
onAuthStateChanged(auth, async u => {
  if (!u) return;
  let ok = false;
  try { ok = (await getDoc(doc(db, 'admins', u.uid))).exists(); } catch (e) {}
  if (!ok) return;
  try { seedNames = (await import('./schedule-seed.js')).SEED.map(s => s.name); } catch (e) {}
  await load();
});