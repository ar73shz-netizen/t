import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

import { App } from '@capacitor/app';
import { startScanner, scanImageFile, nativeScan } from './scanner.js';
import { createLocalStore, createFirebaseStore, createServerStore, getFirebaseConfig, setFirebaseConfig, getServerUrl, setServerUrl, DEFAULT_BRANDS } from './store.js';

/* ---------- ابزارها ---------- */
const $ = (s, r = document) => r.querySelector(s);
const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const faNum = (n) => Number(n).toLocaleString('fa-IR', { useGrouping: false });
const fmtPrice = (n) => Number(n || 0).toLocaleString('fa-IR');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fa2en = (s) => String(s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const toNum = (s) => Number(fa2en(s).replace(/[^\d.]/g, '')) || 0;
const APP_VERSION = 'v12';
const LOGO = 'data:image/png;base64,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';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const faDigits = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const USER_KEY = 'pm_user_name';
const actor = () => (localStorage.getItem(USER_KEY) || '').trim() || (user?.email ? user.email.split('@')[0] : '') || 'این دستگاه';
const ACT_COLOR = { 'ورود کالا': '#39ff88', 'ویرایش': '#2ea8ff', 'خروج کالا': '#ff4d6d', 'ارسال به تعمیر': '#ff9f1c', 'تعمیر شد': '#2dfcc4', 'بازگشت از خروجی': '#ffd23f', 'حذف کالا': '#ff4d6d', 'افزودن برند': '#b86bff', 'حذف برند': '#b86bff', 'بازیابی پشتیبان': '#22e6ff' };
// گزارش فعالیت جداگانه حذف شد؛ نام کاربر روی خود هر گوشی ثبت می‌شود (by.in / by.edit / by.out)
function logAct() {}
const withBy = (it, key) => ({ ...it, by: { ...(it.by || {}), [key]: actor() } });
const byHtml = (it) => {
  const b = it.by || {}; const rows = [];
  if (b.in) rows.push(`ورود توسط کاربر ${esc(b.in)}`);
  if (b.edit) rows.push(`اصلاح توسط کاربر ${esc(b.edit)}`);
  if (b.out && st(it) === 'out') rows.push(`خروج توسط کاربر ${esc(b.out)}`);
  return rows.length ? `<div class="by">${rows.join('<br>')}</div>` : '';
};
const st = (i) => i.status || 'in';

function todayJalali() {
  const parts = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
  const g = (t) => Number(parts.find((p) => p.type === t).value);
  return { y: g('year'), m: g('month'), d: g('day') };
}
const todayStr = () => { const t = todayJalali(); return `${t.y}/${String(t.m).padStart(2, '0')}/${String(t.d).padStart(2, '0')}`; };
function showDate(s, withYear = true) {
  if (!s) return '—';
  const [y, m, d] = s.split('/').map(Number);
  return `${faNum(d)} ${MONTHS[m - 1]}${withYear ? ' ' + faNum(y) : ''}`;
}

/* ---------- آیکون‌ها (SVG) ---------- */
const ICONS = {
  add: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  out: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
  exit: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  back: '<path d="M9 6l6 6-6 6"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
  scan: '<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M8 8v8M12 8v8M16 8v8"/>',
};
const ic = (n, s = 18) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

/* ---------- رنگ برندها ---------- */
const BUILTIN_COLORS = { 'آیفون': '#39ff88', 'سامسونگ': '#29c7ff', 'شیائومی': '#ff8a1f' };
const EXTRA_COLORS = ['#ff3b4e', '#b45cff', '#ff4fd8', '#19f0d2', '#c6ff3d', '#5c7cff', '#ff6b9a', '#00e5a8'];
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const brandColor = (b) => BUILTIN_COLORS[b] || state.colors?.[b] || EXTRA_COLORS[hash(b) % EXTRA_COLORS.length];
const colorStyle = (c) => `--c:${c};--cg:${c}66;`;
function pickColor() {
  const used = new Set([...Object.values(BUILTIN_COLORS), ...Object.values(state.colors || {})]);
  const free = EXTRA_COLORS.filter((c) => !used.has(c));
  const pool = free.length ? free : EXTRA_COLORS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ---------- تعریف فیلدها ---------- */
const HEADING = { t: 'heading', l: 'مشخصات' };
const CODE = { k: 'code', l: 'کد کالا', req: 1, ltr: 1, ph: 'مثلاً 1001' };
const IPHONE_FIELDS = [
  HEADING, CODE,
  { k: 'model', l: 'مدل', ph: 'مثلاً iPhone 15 Pro Max', req: 1 },
  { k: 'storage', l: 'حافظه', list: ['64', '128', '256', '512', '1TB'] },
  { k: 'partNumber', l: 'پارت نامبر', ltr: 1, ph: 'MTUW3' },
  { k: 'battery', l: 'سلامت باتری (٪)', t: 'num' },
  { k: 'cycle', l: 'سایکل', t: 'cycle' },
  { k: 'series', l: 'سری' },
  { k: 'color', l: 'رنگ' },
  { k: 'imei', l: 'IMEI', t: 'imei' },
  { k: 'desc', l: 'توضیحات گوشی', t: 'area' },
  { k: 'buyDate', l: 'تاریخ خرید', t: 'date' },
  { k: 'buyPrice', l: 'قیمت خرید (تومان)', t: 'price' },
  { k: 'sellPrice', l: 'قیمت فروش (تومان)', t: 'price' },
  { k: 'buyNote', l: 'توضیحات خرید', t: 'area' },
  { k: 'ownership', l: 'وضعیت مالکیت' },
];
const OTHER_FIELDS = [
  HEADING, CODE,
  { k: 'model', l: 'مدل', ph: 'مثلاً Galaxy S24 Ultra', req: 1 },
  { k: 'ram', l: 'رم', list: ['2', '3', '4', '6', '8', '12', '16'] },
  { k: 'storage', l: 'حافظه', list: ['32', '64', '128', '256', '512', '1TB'] },
  { k: 'color', l: 'رنگ' },
  { k: 'imei', l: 'IMEI', t: 'imei' },
  { k: 'desc', l: 'توضیحات گوشی', t: 'area' },
  { k: 'buyDate', l: 'تاریخ خرید', t: 'date' },
  { k: 'buyPrice', l: 'قیمت خرید (تومان)', t: 'price' },
  { k: 'sellPrice', l: 'قیمت فروش (تومان)', t: 'price' },
  { k: 'buyNote', l: 'توضیحات خرید', t: 'area' },
  { k: 'ownership', l: 'وضعیت مالکیت' },
];
const isIphone = (b) => b === 'آیفون';
const fieldsFor = (b) => (isIphone(b) ? IPHONE_FIELDS : OTHER_FIELDS);
function splitFields(brand) {
  const list = fieldsFor(brand).filter((f) => f.t !== 'heading');
  const di = list.findIndex((f) => f.k === 'desc');
  return { main: list.slice(0, di + 1), more: list.slice(di + 1) };
}
const fieldLabel = (f) => f.l.replace(/\s*\(.*\)$/, '');

/* ---------- هزینه و تعمیرات ---------- */
const repairSum = (it) => (it.repairs || []).reduce((s, r) => s + (r.cost || 0), 0);
const costOf = (it) => (it.buyPrice || 0) + repairSum(it);

/* ---------- مشخصات به‌صورت متن ساده ---------- */
function fmtField(it, f, v) {
  if (f.t === 'date') return showDate(v);
  if (f.k === 'buyPrice') {
    const r = repairSum(it);
    return r ? `${fmtPrice(v)} + ${fmtPrice(r)} (تعمیرات) = ${fmtPrice(v + r)} تومان` : `${fmtPrice(v)} تومان`;
  }
  if (f.t === 'price') return `${fmtPrice(v)} تومان`;
  if (f.k === 'battery') return /^\d+(\.\d+)?$/.test(v) ? `${faNum(v)}٪` : String(v);
  if (['storage', 'ram'].includes(f.k)) return /^\d+$/.test(v) ? `${faNum(v)} گیگ` : String(v);
  if (f.k === 'cycle') return /^\d+$/.test(v) ? faNum(v) : String(v);
  if (f.t === 'imei') return v.join('\n');
  return String(v);
}
function pairs(it, part, skip = []) {
  const { main, more } = splitFields(it.brand);
  const fs = (part === 'main' ? main : more).filter((f) => !['model', 'sellPrice', ...skip].includes(f.k));
  const out = [];
  for (const f of fs) {
    const v = it[f.k];
    const empty = v === '' || v == null || v === 0 || (Array.isArray(v) && !v.length);
    if (empty && !(f.k === 'buyPrice' && repairSum(it))) continue;
    out.push([fieldLabel(f), fmtField(it, f, v || 0)]);
  }
  if (part === 'more' && it.repairs?.length) {
    out.push(['تعمیرات انجام‌شده', it.repairs.map((r) => `${r.desc}${r.cost ? ` — ${fmtPrice(r.cost)} تومان` : ''}`).join('\n')]);
  }
  if (part === 'more' && it.updatedBy) out.push(['آخرین تغییر توسط', String(it.updatedBy).split('@')[0]]);
  return out;
}

/* ---------- وضعیت برنامه ---------- */
let store, state = { items: [], brands: DEFAULT_BRANDS, colors: {} };
let user = null;
const ui = {
  tab: 'in', entryBrand: null, brandFilter: 'all', minP: '', maxP: '', q: '',
  outYear: null, outMonth: null, outQ: '', editId: null, dirty: false,
  expanded: new Set(), shareMode: false, sel: new Set(),
  qExact: false, noteDraft: '', noteQ: '', repYear: null, repMonth: null, repFrom: '', repTo: '',
};

/* ---------- دکمه بازگشت گوشی (پشته‌ی خود برنامه) ---------- */
let modalOpen = false, modalCleanup = null;
const snap = () => ({ tab: ui.tab, editId: ui.editId || null, outMonth: ui.outMonth || null, outYear: ui.outYear || null });
const navStack = [];
const syncTop = () => { navStack[navStack.length - 1] = snap(); };
// رفتن به یک صفحه/بخش جدید؛ هر مرحله یک گام در پشته می‌شود
function go(patch) {
  Object.assign(ui, patch);
  navStack.push(snap());
  render(); window.scrollTo(0, 0);
}
// یک گام به عقب. اگر پنجره‌ای باز باشد اول آن بسته می‌شود. false یعنی در صفحه اول هستیم
function goBack() {
  if (modalOpen) { dismissModal(); return true; }
  if (navStack.length <= 1) return false;
  navStack.pop();
  const s = navStack[navStack.length - 1];
  ui.tab = s.tab; ui.editId = s.editId; ui.outMonth = s.outMonth;
  if (s.outYear) ui.outYear = s.outYear;
  ui.shareMode = false; ui.sel.clear(); ui.outQ = '';
  render(); window.scrollTo(0, 0);
  return true;
}
// خروج از فرم ویرایش: اگر از صفحه موجودی آمده‌ایم یک گام به عقب برمی‌گردیم
function leaveEdit() {
  ui.dirty = false;
  if (navStack[navStack.length - 1]?.editId && navStack.length > 1) { ui.editId = null; goBack(); return; }
  ui.editId = null; ui.tab = 'stock'; syncTop(); render(); window.scrollTo(0, 0);
}
App.addListener('backButton', () => { if (!goBack()) App.exitApp(); }).catch(() => {});


/* ---------- راه‌اندازی ---------- */
async function boot() {
  const srv = getServerUrl();
  if (srv) {
    store = createServerStore(srv);
    store.onError = (m) => toast(m);
    store.onAuth((u) => { user = u; if (!u) render(); else attach(); });
    render();
    return;
  }
  const cfg = getFirebaseConfig();
  if (cfg) {
    try {
      store = await createFirebaseStore(cfg);
      store.onAuth((u) => { user = u; if (!u) render(); else attach(); });
      render();
      return;
    } catch (e) { console.error(e); alert('اتصال آنلاین برقرار نشد؛ برنامه در حالت محلی باز می‌شود.'); }
  }
  store = createLocalStore();
  attach();
}
let attached = false;
function attach() {
  if (attached) return; attached = true;
  store.setActor?.(actor);
  store.subscribe((s, changes) => {
    state = s;
    changes.forEach(announce);
    if (ui.tab === 'in' && ui.dirty) { $('.nav').innerHTML = navInner(); bindNav(); return; } // فرم نیمه‌پر پاک نشود
    if (ui.tab === 'notes' && $('#notesList')) { refreshNotes(); $('.nav').innerHTML = navInner(); bindNav(); return; } // متن در حال نوشتن پاک نشود
    render();
  });
}
function announce(c) {
  const it = c.item; const name = `${it.brand} ${it.model || ''}`;
  const who = it.updatedBy ? ` (${it.updatedBy.split('@')[0]})` : '';
  if (c.type === 'added') toast(`📥 ورود جدید: ${name}${who}`, true);
  else if (c.type === 'removed') toast(`🗑 حذف شد: ${name}`, true);
  else if (it.status === 'out') toast(`📤 خروج کالا: ${name}${who}`, true);
  else if (it.status === 'repair') toast(`🛠 به تعمیر رفت: ${name}${who}`, true);
  else toast(`✏️ به‌روزرسانی: ${name}${who}`, true);
}
function toast(msg, live) {
  const el = document.createElement('div');
  el.className = 'toast' + (live ? ' live' : '');
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ---------- رندر اصلی ---------- */
function navInner() {
  const inStock = state.items.filter((i) => st(i) === 'in').length;
  const inRepair = state.items.filter((i) => st(i) === 'repair').length;
  const tabs = [['in', 'add', 'ورود کالا'], ['stock', 'box', 'موجودی', inStock], ['out', 'out', 'خروجی'], ['repair', 'wrench', 'در حال تعمیر', inRepair], ['notes', 'note', 'یادداشت‌ها'], ['report', 'chart', 'گزارش']];
  return tabs.map(([k, icon, l, n]) => `<button data-tab="${k}" class="${ui.tab === k ? 'act' : ''}">${ic(icon, 22)}${l}${n ? `<span class="badge">${faNum(n)}</span>` : ''}</button>`).join('');
}
function bindNav() {
  document.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => {
    const k = b.dataset.tab;
    const same = ui.tab === k && !ui.editId && !ui.outMonth;
    ui.outQ = ''; ui.shareMode = false; ui.sel.clear();
    if (same) { render(); window.scrollTo(0, 0); } else go({ tab: k, editId: null, outMonth: null });
  });
}
function render() {
  ui.dirty = false;
  const app = $('#app');
  if (store.needsAuth && !user) return (app.innerHTML = loginView(), bindLogin());
  const titles = { in: ui.editId ? 'ویرایش گوشی' : 'ورود کالا', stock: 'موجودی', repair: 'در حال تعمیر', out: 'کالاهای خروجی', notes: 'یادداشت‌ها', report: 'گزارش مالی', set: 'تنظیمات و پشتیبان' };
  const body = { in: entryView, stock: stockView, repair: repairView, out: outView, notes: notesView, report: reportView, set: settingsView }[ui.tab]();
  app.innerHTML = `
    <header class="topbar"><div class="brandbar"><img class="logo" src="${LOGO}" alt=""><span class="appname">Rasa used phone</span></div>
      <div class="topact"><div class="status"><span class="dot ${store.mode === 'online' ? 'on' : ''}"></span>${store.mode === 'online' ? 'آنلاین' : 'محلی'}</div>
        <button class="gear ${ui.tab === 'set' ? 'act' : ''}" data-tab="set" aria-label="تنظیمات">${ic('gear', 22)}</button></div></header>
    <main class="wrap"><h1 class="ptitle">${titles[ui.tab]}</h1>${body}</main>
    <nav class="nav">${navInner()}</nav>`;
  bindNav();
  ({ in: bindEntry, stock: bindStock, repair: bindRepair, out: bindOut, notes: bindNotes, report: bindReport, set: bindSettings })[ui.tab]();
}

/* ---------- ورود به سیستم ---------- */
function loginView() {
  return `<div class="login card"><img class="logo" src="${LOGO}" alt=""><h2 class="title" style="text-align:center">ورود کارکنان</h2>
    <label class="f"><span>${store.kind === 'server' ? 'نام کاربری' : 'ایمیل'}</span><input type="${store.kind === 'server' ? 'text' : 'email'}" id="em" class="ltr" autocapitalize="none" autocomplete="username"></label>
    <label class="f"><span>رمز عبور</span><input type="password" id="pw" class="ltr" autocomplete="current-password"></label>
    <button class="btn block" id="go">ورود</button>
    <p class="hint">${store.kind === 'server' ? 'حساب کارکنان را مدیر روی سرور می‌سازد.' : 'حساب‌ها را مدیر در بخش Authentication فایربیس می‌سازد.'}</p>
    <button class="btn sec sm block" id="local">بازگشت به حالت محلی</button></div>`;
}
function bindLogin() {
  $('#go').onclick = async () => {
    try { await store.login($('#em').value.trim(), $('#pw').value); } catch (e) { toast(e?.network ? 'ارتباط با سرور برقرار نیست' : 'نام کاربری یا رمز عبور درست نیست'); }
  };
  $('#local').onclick = () => { setFirebaseConfig(null); setServerUrl(null); location.reload(); };
}

/* ---------- فرم داینامیک ---------- */
function dateWidget(k, val) {
  const t = todayJalali();
  const [y, m, d] = (val || todayStr()).split('/').map(Number);
  const years = []; for (let i = t.y - 6; i <= t.y + 1; i++) years.push(i);
  return `<div class="dates" data-date="${k}">
    <select aria-label="روز">${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${i + 1 === d ? 'selected' : ''}>${faNum(i + 1)}</option>`).join('')}</select>
    <select aria-label="ماه">${MONTHS.map((n, i) => `<option value="${i + 1}" ${i + 1 === m ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <select aria-label="سال">${years.map((yy) => `<option value="${yy}" ${yy === y ? 'selected' : ''}>${faNum(yy)}</option>`).join('')}</select></div>`;
}
function readDate(root, k) {
  const [d, m, y] = [...$(`[data-date="${k}"]`, root).querySelectorAll('select')].map((s) => Number(s.value));
  return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
}
const imeiRow = (v) => `<div class="row imei-row"><input type="text" inputmode="numeric" class="ltr imei" maxlength="17" value="${esc(v)}" placeholder="شماره IMEI"><button type="button" class="btn sm blue scan-imei" aria-label="اسکن بارکد IMEI">${ic('scan', 18)}</button><button type="button" class="btn sm sec rm-imei" aria-label="حذف IMEI">${ic('x', 16)}</button></div>`;
function suggestCode() {
  const nums = state.items.map((i) => String(i.code || '')).filter((c) => /^\d+$/.test(c)).map(Number);
  return String(nums.length ? Math.max(...nums) + 1 : 1001);
}
function fieldHtml(f, v, it) {
  const id = `f_${f.k}`;
  if (f.t === 'heading') return `<h3 class="sec">${f.l}</h3>`;
  if (f.k === 'ownership') {
    return `<div class="f"><div class="own-head"><span class="lab">${f.l}</span>
      <label class="warnchk"><input type="checkbox" id="f_ownershipWarn" ${it?.ownershipWarn ? 'checked' : ''}><span>⚠ نشان هشدار در موجودی</span></label></div>
      <input type="text" id="${id}" value="${esc(v)}"></div>`;
  }
  if (f.t === 'date') return `<label class="f"><span>${f.l}</span>${dateWidget(f.k, v)}</label>`;
  if (f.t === 'imei') {
    const list = v && v.length ? v : [''];
    return `<div class="f"><span class="lab">${f.l}</span><div id="imeis">${list.map(imeiRow).join('')}</div>
      <button type="button" class="btn sm sec" id="addImei">${ic('plus', 16)} افزودن IMEI دیگر</button></div>`;
  }
  if (f.t === 'cycle') {
    return `<label class="f"><span>${f.l}</span><div class="inline"><input type="text" id="${id}" value="${esc(v)}" placeholder="عدد یا ندارد">
      <button type="button" class="btn sm sec" data-quick="ندارد" data-k="${f.k}">ندارد</button></div></label>`;
  }
  let inner;
  if (f.t === 'area') inner = `<textarea id="${id}">${esc(v)}</textarea>`;
  else if (f.t === 'price') inner = `<input type="text" inputmode="numeric" id="${id}" class="ltr price" value="${v ? Number(v).toLocaleString('en-US') : ''}">`;
  else if (f.t === 'num') inner = `<input type="text" inputmode="numeric" id="${id}" class="ltr" value="${esc(v)}">`;
  else inner = `<input type="text" id="${id}" class="${f.ltr ? 'ltr' : ''}" value="${esc(v)}" placeholder="${esc(f.ph || '')}" ${f.list ? `list="dl_${f.k}"` : ''}>${f.list ? `<datalist id="dl_${f.k}">${f.list.map((o) => `<option value="${o}">`).join('')}</datalist>` : ''}`;
  return `<label class="f"><span>${f.l}${f.req ? ' *' : ''}</span>${inner}</label>`;
}
function bindPriceInputs(root) {
  root.querySelectorAll('.price').forEach((el) => el.addEventListener('input', () => {
    const n = toNum(el.value); el.value = n ? n.toLocaleString('en-US') : '';
  }));
}
function readForm(root, brand) {
  const out = {};
  for (const f of fieldsFor(brand)) {
    if (f.t === 'heading') continue;
    if (f.t === 'date') out[f.k] = readDate(root, f.k);
    else if (f.t === 'price') out[f.k] = toNum($(`#f_${f.k}`, root).value);
    else if (f.t === 'imei') out[f.k] = [...root.querySelectorAll('.imei')].map((i) => fa2en(i.value).replace(/\D/g, '')).filter(Boolean);
    else if (f.t === 'num') out[f.k] = fa2en($(`#f_${f.k}`, root).value).replace(/[^\d.]/g, '');
    else out[f.k] = fa2en($(`#f_${f.k}`, root).value.trim());
  }
  const ow = $('#f_ownershipWarn', root);
  if (ow) out.ownershipWarn = ow.checked;
  return out;
}

/* ---------- ورود کالا ---------- */
function brandChips(selected) {
  return `<div class="chips">${state.brands.map((b) => `<button class="chip ${b === selected ? 'act' : ''}" style="${colorStyle(brandColor(b))}" data-brand="${esc(b)}">${esc(b)}</button>`).join('')}<button class="chip add" id="addBrand">+ برند جدید</button><button class="chip add" id="manageBrands">حذف / مدیریت برندها</button></div>`;
}
function entryView() {
  if (ui.editId) return editView();
  const b = ui.entryBrand;
  return `${brandChips(b)}
    ${b ? `<form id="entryForm" class="card">${fieldsFor(b).map((f) => fieldHtml(f, f.k === 'code' ? suggestCode() : '')).join('')}
      <button class="btn block" type="submit">ثبت ورود ${esc(b)}</button></form>` : `<div class="empty">${ic('add', 36)}برند گوشی را انتخاب کنید تا فرم ورود باز شود.</div>`}`;
}
function editView() {
  const it = state.items.find((x) => x.id === ui.editId);
  if (!it) { ui.editId = null; return entryView(); }
  return `<form id="entryForm" class="card">${fieldsFor(it.brand).map((f) => fieldHtml(f, it[f.k], it)).join('')}
      <div class="row"><button class="btn" type="submit">ذخیره تغییرات</button>
      <button class="btn sec" type="button" id="cancelEdit">انصراف</button></div>
      <button class="btn danger sm block" type="button" id="delItem" style="margin-top:14px">حذف این گوشی</button></form>`;
}
async function addBrandFlow() {
  const name = (prompt('نام برند جدید را وارد کنید:') || '').trim();
  if (!name) return;
  if (state.brands.includes(name)) return toast('این برند قبلاً ثبت شده است');
  await store.saveBrands([...state.brands, name], { ...(state.colors || {}), [name]: pickColor() });
  logAct('افزودن برند', null, name);
  ui.entryBrand = name; render();
}

function manageBrandsSheet() {
  const counts = {};
  state.items.forEach((i) => { counts[i.brand] = (counts[i.brand] || 0) + 1; });
  const root = openModal(`<h3>مدیریت برندها</h3>
    <p class="hint">برندی که هیچ گوشی (موجود، تعمیری یا خروجی) ندارد قابل حذف است. برند جدید را هم می‌توانید دوباره اضافه کنید.</p>
    <div>${state.brands.map((b) => `<div class="brow" style="${colorStyle(brandColor(b))}"><span class="bn">${esc(b)}</span>${counts[b]
      ? `<small>${faNum(counts[b])} گوشی ثبت شده</small>`
      : `<button class="btn danger sm" data-delbrand="${esc(b)}">حذف</button>`}</div>`).join('') || '<div class="empty">برندی وجود ندارد.</div>'}</div>
    <button class="btn sec block" id="closeBrands" style="margin-top:8px">بستن</button>`);
  $('#closeBrands', root).onclick = closeModal;
  root.querySelectorAll('[data-delbrand]').forEach((btn) => btn.onclick = async () => {
    const name = btn.dataset.delbrand;
    if (!confirm(`برند «${name}» حذف شود؟`)) return;
    const colors = { ...(state.colors || {}) }; delete colors[name];
    await store.saveBrands(state.brands.filter((b) => b !== name), colors);
    logAct('حذف برند', null, name);
    if (ui.entryBrand === name) ui.entryBrand = null;
    toast('برند حذف شد');
    render(); manageBrandsSheet();
  });
}
function bindEntry() {
  document.querySelectorAll('[data-brand]').forEach((b) => b.onclick = () => { ui.entryBrand = b.dataset.brand; render(); });
  $('#addBrand') && ($('#addBrand').onclick = addBrandFlow);
  $('#manageBrands') && ($('#manageBrands').onclick = manageBrandsSheet);
  const form = $('#entryForm'); if (!form) return;
  bindPriceInputs(form);
  form.addEventListener('input', (e) => {
    ui.dirty = true;
    if (e.target.classList.contains('imei')) e.target.value = fa2en(e.target.value).replace(/\D/g, '');
  });
  form.addEventListener('click', (e) => {
    const sc = e.target.closest('.scan-imei');
    if (sc) { scanImei(sc.closest('.imei-row').querySelector('.imei')); return; }
    if (e.target.closest('#addImei')) {
      $('#imeis', form).insertAdjacentHTML('beforeend', imeiRow('')); ui.dirty = true;
      [...form.querySelectorAll('.imei')].pop().focus();
    }
    const rm = e.target.closest('.rm-imei');
    if (rm) {
      const rows = form.querySelectorAll('.imei-row');
      if (rows.length > 1) rm.closest('.imei-row').remove(); else rows[0].querySelector('input').value = '';
    }
    const q = e.target.closest('[data-quick]');
    if (q) { $(`#f_${q.dataset.k}`, form).value = q.dataset.quick; ui.dirty = true; }
  });
  $('#cancelEdit') && ($('#cancelEdit').onclick = leaveEdit);
  $('#delItem') && ($('#delItem').onclick = async () => {
    if (!confirm('این گوشی برای همیشه حذف شود؟')) return;
    const gone = state.items.find((x) => x.id === ui.editId);
    await store.deleteItem(ui.editId); logAct('حذف کالا', gone); leaveEdit();
  });
  form.onsubmit = async (e) => {
    e.preventDefault();
    const existing = ui.editId && state.items.find((x) => x.id === ui.editId);
    const brand = existing ? existing.brand : ui.entryBrand;
    const vals = readForm(form, brand);
    if (!vals.code) return toast('کد کالا را وارد کنید');
    if (!vals.model) return toast('مدل گوشی را وارد کنید');
    const dup = state.items.find((x) => x.id !== existing?.id && String(x.code || '').toLowerCase() === vals.code.toLowerCase());
    if (dup) return toast(`کد کالا تکراری است (${dup.brand} ${dup.model || ''})`);
    let item = existing ? { ...existing, ...vals } : { id: uid(), brand, status: 'in', sale: null, repairs: [], createdAt: Date.now(), ...vals };
    item = withBy(item, existing ? 'edit' : 'in');
    if (!existing || existing.sellPrice !== vals.sellPrice) item.sellPriceDate = todayStr();
    await store.saveItem(item);
    logAct(existing ? 'ویرایش' : 'ورود کالا', item, existing && existing.sellPrice !== vals.sellPrice ? `قیمت فروش: ${fmtPrice(existing.sellPrice)} ← ${fmtPrice(vals.sellPrice)} تومان` : '');
    toast(existing ? '✅ تغییرات ذخیره شد' : '✅ گوشی وارد انبار شد');
    ui.dirty = false;
    if (existing) { leaveEdit(); return; }
    ui.entryBrand = brand;
    render();
  };
}

/* ---------- کارت گوشی ---------- */
const kvHtml = (arr, cls = '') => (arr.length
  ? `<dl class="kv ${cls}">${arr.map(([l, v]) => `<dt>${esc(l)}</dt><dd>${esc(v).replace(/\n/g, '<br>')}</dd>`).join('')}</dl>` : '');
function phoneCard(it, mode) {
  const c = brandColor(it.brand);
  const sale = it.sale;
  const exp = mode !== 'stock' || ui.expanded.has(it.id);
  const main = pairs(it, 'main'), more = pairs(it, 'more');
  let tag;
  if (mode === 'out') tag = `<div class="lbl">قیمت نهایی</div><div class="price">${fmtPrice(sale.finalPrice)}</div><div class="unit">تومان</div><div class="when">${showDate(sale.date)}</div>`;
  else tag = `<div class="lbl">قیمت فروش</div><div class="price">${it.sellPrice ? fmtPrice(it.sellPrice) : '—'}</div><div class="unit">تومان</div><div class="when">آخرین تغییر قیمت<br>${showDate(it.sellPriceDate, false)}</div>`;

  let html = `<div class="head"><span class="brand">${esc(it.brand)}</span><span class="model">${esc(it.model)}</span>
    ${mode === 'stock' && ui.shareMode ? `<input type="checkbox" class="sel" data-sel="${it.id}" ${ui.sel.has(it.id) ? 'checked' : ''} aria-label="انتخاب">` : ''}</div>`;
  if (mode === 'stock' && it.ownershipWarn) html += `<div class="ownwarn">⚠ هشدار مالکیت${it.ownership ? `: ${esc(it.ownership)}` : ''}</div>`;
  if (mode === 'repair') html += `<div class="issue"><b>مشکل گوشی:</b> ${esc(it.repairIssue || '—').replace(/\n/g, '<br>')}<br><small>ورود به تعمیر: ${showDate(it.repairSince)}</small></div>`;
  html += kvHtml(main);
  if (mode === 'stock') {
    html += `<button class="link" data-more="${it.id}">${exp ? `کمتر ${ic('up', 16)}` : `بیشتر ${ic('down', 16)}`}</button>`;
  }
  if (exp) {
    html += kvHtml(more, 'more');
    if (mode === 'out') html += kvHtml([['خریدار', sale.buyer]], 'more');
    if (mode === 'stock') html += `<label class="chk"><input type="checkbox" data-repair="${it.id}"><span>نیاز به تعمیر</span></label>`;
    if (mode === 'repair') html += `<label class="chk fix"><input type="checkbox" data-fixed="${it.id}"><span>تعمیر شد</span></label>`;
  }
  if (mode === 'stock') html += `<div class="actions"><button class="btn sm" data-exit="${it.id}">${ic('exit', 16)} خروج کالا</button>
    <button class="btn sm sec" data-share="${it.id}">${ic('share', 16)} اشتراک</button><button class="btn sm sec" data-edit="${it.id}">${ic('edit', 16)} ویرایش</button></div>`;
  if (mode === 'out') html += `<div class="actions"><button class="btn sm sec" data-undo="${it.id}">${ic('undo', 16)} بازگشت به موجودی</button></div>`;
  html += byHtml(it);
  return `<article class="phone ${mode === 'stock' ? '' : mode}" style="${colorStyle(c)}"><div class="body">${html}</div><div class="tagcol">${tag}</div></article>`;
}

/* ---------- موجودی ---------- */
function stockList() {
  const list = state.items.filter((i) => st(i) === 'in');
  const min = toNum(ui.minP), max = toNum(ui.maxP), q = fa2en(ui.q).trim().toLowerCase();
  return list.filter((i) =>
    (ui.brandFilter === 'all' || i.brand === ui.brandFilter) &&
    (!min || (i.sellPrice || 0) >= min) && (!max || (i.sellPrice || 0) <= max) &&
    (!q || (ui.qExact
      ? String(i.code || '').toLowerCase() === q || (i.imei || []).includes(q)
      : `${i.model} ${i.color || ''} ${i.partNumber || ''} ${i.code || ''} ${(i.imei || []).join(' ')}`.toLowerCase().includes(q))))
    .sort((a, b) => b.createdAt - a.createdAt);
}
function stockListHtml() {
  const total = state.items.filter((i) => st(i) === 'in').length;
  const shown = stockList();
  const toolbar = ui.shareMode
    ? `<div class="toolbar"><button class="btn sm sec" id="selAll">انتخاب همه</button>
        <button class="btn sm green" id="shareSel">${ic('share', 16)} اشتراک‌گذاری (${faNum(ui.sel.size)})</button>
        <button class="btn sm sec" id="selCancel">لغو</button></div>`
    : `<div class="toolbar"><span class="hint grow">${faNum(shown.length)} گوشی از ${faNum(total)} گوشی موجود</span>
        ${shown.length ? `<button class="btn sm blue" id="selMode">${ic('share', 16)} اشتراک چند گوشی</button>` : ''}</div>`;
  return `${toolbar}${shown.length ? shown.map((i) => phoneCard(i, 'stock')).join('') : `<div class="empty">${ic('box', 36)}گوشی‌ای با این فیلتر پیدا نشد.</div>`}`;
}
function stockView() {
  const list = state.items.filter((i) => st(i) === 'in');
  const brands = [...new Set([...state.brands, ...list.map((i) => i.brand)])];
  return `<div class="chips"><button class="chip ${ui.brandFilter === 'all' ? 'act' : ''}" data-bf="all">همه</button>
      ${brands.map((b) => `<button class="chip ${ui.brandFilter === b ? 'act' : ''}" style="${colorStyle(brandColor(b))}" data-bf="${esc(b)}">${esc(b)}</button>`).join('')}</div>
    <div class="filters"><input type="text" inputmode="numeric" class="ltr price" id="minP" placeholder="قیمت فروش از" value="${ui.minP}">
      <input type="text" inputmode="numeric" class="ltr price" id="maxP" placeholder="تا" value="${ui.maxP}">
      <div class="full searchrow"><input type="text" id="q" placeholder="جستجو: مدل، رنگ، کد کالا (بارکد)، IMEI" value="${esc(ui.q)}"><button type="button" class="btn blue" id="scanQ" aria-label="اسکن بارکد کالا">${ic('scan', 20)}</button></div></div>
    <div id="stockList">${stockListHtml()}</div>`;
}
function refreshStock() { $('#stockList').innerHTML = stockListHtml(); bindStockList(); }
function bindStock() {
  document.querySelectorAll('[data-bf]').forEach((b) => b.onclick = () => { ui.brandFilter = b.dataset.bf; render(); });
  bindPriceInputs(document);
  const live = (id, key) => $('#' + id).addEventListener('input', (e) => { ui[key] = e.target.value; refreshStock(); });
  live('minP', 'minP'); live('maxP', 'maxP');
  $('#q').addEventListener('input', (e) => { ui.q = e.target.value; ui.qExact = false; refreshStock(); });
  $('#scanQ').onclick = scanStockSearch;
  bindStockList();
}
function bindStockList() {
  const r = $('#stockList');
  r.querySelectorAll('[data-more]').forEach((b) => b.onclick = () => {
    const id = b.dataset.more; ui.expanded.has(id) ? ui.expanded.delete(id) : ui.expanded.add(id); refreshStock();
  });
  r.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => go({ editId: b.dataset.edit, tab: 'in' }));
  r.querySelectorAll('[data-exit]').forEach((b) => b.onclick = () => exitSheet(b.dataset.exit));
  r.querySelectorAll('[data-share]').forEach((b) => b.onclick = () => shareSheet([b.dataset.share]));
  r.querySelectorAll('[data-repair]').forEach((cb) => cb.onchange = () => { cb.checked = false; askNeedRepair(cb.dataset.repair); });
  r.querySelectorAll('[data-sel]').forEach((cb) => cb.onchange = () => {
    cb.checked ? ui.sel.add(cb.dataset.sel) : ui.sel.delete(cb.dataset.sel);
    const btn = $('#shareSel'); if (btn) btn.innerHTML = `${ic('share', 16)} اشتراک‌گذاری (${faNum(ui.sel.size)})`;
  });
  $('#selMode') && ($('#selMode').onclick = () => { ui.shareMode = true; ui.sel.clear(); refreshStock(); });
  $('#selCancel') && ($('#selCancel').onclick = () => { ui.shareMode = false; ui.sel.clear(); refreshStock(); });
  $('#selAll') && ($('#selAll').onclick = () => { stockList().forEach((i) => ui.sel.add(i.id)); refreshStock(); });
  $('#shareSel') && ($('#shareSel').onclick = () => shareSheet([...ui.sel]));
}

/* ---------- اشتراک‌گذاری ---------- */
const DISCLAIMER = '(قیمت‌های فروش درج‌شده قطعی نیست؛ لطفاً برای اطلاع از قیمت قطعی استعلام بگیرید)';
function shareText(items) {
  const blocks = items.map((it) => {
    const lines = [`📱 ${it.brand} ${it.model}`];
    pairs(it, 'main', ['imei']).forEach(([l, v]) => lines.push(`${l}: ${v.replace(/\n/g, ' / ')}`));
    lines.push(`💰 قیمت فروش: ${it.sellPrice ? `${fmtPrice(it.sellPrice)} تومان` : 'استعلام بگیرید'}`);
    return lines.join('\n');
  });
  return `${blocks.join('\n\n— — — — —\n\n')}\n\n${DISCLAIMER}`;
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* ادامه */ }
  const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
  const ok = document.execCommand('copy'); ta.remove(); return ok;
}
function shareSheet(ids) {
  const items = ids.map((id) => state.items.find((x) => x.id === id)).filter(Boolean);
  if (!items.length) return toast('گوشی‌ای انتخاب نشده است');
  const root = openModal(`<h3>پیام اشتراک‌گذاری (قابل ویرایش)</h3>
    <textarea id="msg" class="msg">${esc(shareText(items))}</textarea>
    <button class="btn green block" id="doShare">${ic('share', 18)} اشتراک‌گذاری (انتخاب برنامه)</button>
    <div class="sharegrid">
      <a class="btn sm wa" id="shWa" target="_blank" rel="noopener">واتساپ</a>
      <a class="btn sm tg" id="shTg" target="_blank" rel="noopener">تلگرام</a>
      <a class="btn sm sms" id="shSms" target="_blank" rel="noopener">پیامک</a>
      <button class="btn sm sec" id="doCopy">کپی متن</button>
    </div>
    <button class="btn sec sm block" id="cancel" style="margin-top:10px">بستن</button>`);
  const ta = $('#msg', root);
  const links = () => {
    const t = encodeURIComponent(ta.value);
    $('#shWa', root).href = `https://wa.me/?text=${t}`;
    $('#shTg', root).href = `https://t.me/share/url?url=%20&text=${t}`;
    $('#shSms', root).href = `sms:?body=${t}`;
  };
  links(); ta.addEventListener('input', links);
  $('#cancel', root).onclick = closeModal;
  $('#doCopy', root).onclick = async () => toast((await copyText(ta.value)) ? 'متن کپی شد' : 'کپی انجام نشد');
  $('#doShare', root).onclick = async () => {
    const text = ta.value, cap = window.Capacitor;
    const native = !!cap?.isNativePlatform?.();
    try {
      // Use the official Capacitor Share plugin, bundled at build time.
      if (native) {
        await Share.share({ text, dialogTitle: 'اشتراک‌گذاری' });
        return;
      }
      if (typeof navigator.share === 'function') {
        await navigator.share({ text });
        return;
      }
      throw new Error('اشتراک‌گذاری در این مرورگر پشتیبانی نمی‌شود');
    } catch (e) {
      if (/cancel|abort/i.test(`${e?.name} ${e?.message}`)) return;
      // Browser fallback can still work in a Capacitor WebView on some devices.
      if (typeof navigator.share === 'function') {
        try { await navigator.share({ text }); return; } catch (fallbackError) {
          if (/cancel|abort/i.test(`${fallbackError?.name} ${fallbackError?.message}`)) return;
        }
      }
      toast(`اشتراک مستقیم انجام نشد (${native ? 'برنامه' : 'مرورگر'}: ${e?.message || e}). از دکمه‌های واتساپ، تلگرام یا پیامک استفاده کنید`);
    }
  };
}

/* ---------- پنجره‌ها ---------- */
function dismissModal() {
  const c = modalCleanup; modalCleanup = null; modalOpen = false;
  $('#modal-root').innerHTML = '';
  if (c) { try { c(); } catch { /* */ } }
}
function openModal(html, center, cleanup) {
  const root = $('#modal-root');
  if (modalCleanup) { const c = modalCleanup; modalCleanup = null; try { c(); } catch { /* */ } }
  modalCleanup = cleanup || null;
  modalOpen = true; // بازگشت گوشی اول پنجره را می‌بندد
  root.innerHTML = `<div class="overlay ${center ? 'mid' : ''}"><div class="sheet ${center ? 'center' : ''}">${html}</div></div>`;
  return root;
}
const closeModal = () => dismissModal();

/* ---------- خروج کالا ---------- */
function exitSheet(id) {
  const it = state.items.find((x) => x.id === id); if (!it) return;
  const root = openModal(`<h3>خروج کالا: ${esc(it.brand)} ${esc(it.model)}</h3>
    <label class="f"><span>نام و نام خانوادگی خریدار *</span><input type="text" id="buyer"></label>
    <label class="f"><span>تاریخ فروش</span>${dateWidget('sdate', todayStr())}</label>
    <label class="f"><span>قیمت نهایی (تومان) *</span><input type="text" inputmode="numeric" id="final" class="ltr price" value="${it.sellPrice ? Number(it.sellPrice).toLocaleString('en-US') : ''}"></label>
    <div class="row"><button class="btn" id="next">ثبت خروج</button><button class="btn sec" id="cancel">انصراف</button></div>`);
  bindPriceInputs(root);
  $('#cancel', root).onclick = closeModal;
  $('#next', root).onclick = () => {
    const buyer = $('#buyer', root).value.trim(), finalPrice = toNum($('#final', root).value), date = readDate(root, 'sdate');
    if (!buyer || !finalPrice) return toast('نام خریدار و قیمت نهایی را وارد کنید');
    openModal(`<h3>آیا از خروج کالا مطمئن هستید؟</h3>
      <p>${esc(it.brand)} ${esc(it.model)} به <b>${esc(buyer)}</b> با قیمت <b>${fmtPrice(finalPrice)}</b> تومان</p>
      <div class="row"><button class="btn green" id="yes">بله</button><button class="btn sec" id="no">خیر</button></div>`, true);
    $('#no').onclick = closeModal;
    $('#yes').onclick = async () => {
      await store.saveItem(withBy({ ...it, status: 'out', sale: { buyer, date, finalPrice } }, 'out'));
      logAct('خروج کالا', it, `خریدار: ${buyer} — قیمت نهایی: ${fmtPrice(finalPrice)} تومان`);
      closeModal(); toast('📤 گوشی به کالاهای خروجی منتقل شد');
    };
  };
}

/* ---------- نیاز به تعمیر ---------- */
function askNeedRepair(id) {
  const it = state.items.find((x) => x.id === id); if (!it) return;
  openModal(`<h3>آیا مطمئن هستید گوشی نیاز به تعمیر دارد؟</h3><p>${esc(it.brand)} ${esc(it.model)}</p>
    <div class="row"><button class="btn orange" id="yes">بله</button><button class="btn sec" id="no">خیر</button></div>`, true);
  $('#no').onclick = closeModal;
  $('#yes').onclick = () => {
    const root = openModal(`<h3>مشکلات گوشی چیست؟</h3>
      <label class="f"><span>توضیح مشکل *</span><textarea id="issue" placeholder="مثلاً: ال‌سی‌دی خط دارد، شارژ نمی‌شود"></textarea></label>
      <div class="row"><button class="btn orange" id="ok">تایید و انتقال به تعمیر</button><button class="btn sec" id="cancel">انصراف</button></div>`);
    $('#cancel', root).onclick = closeModal;
    $('#ok', root).onclick = async () => {
      const issue = $('#issue', root).value.trim();
      if (!issue) return toast('مشکل گوشی را بنویسید');
      await store.saveItem({ ...it, status: 'repair', repairIssue: issue, repairSince: todayStr() });
      logAct('ارسال به تعمیر', it, issue);
      closeModal(); toast('🛠 گوشی به بخش «در حال تعمیر» رفت');
    };
  };
}

/* ---------- در حال تعمیر ---------- */
function repairView() {
  const list = state.items.filter((i) => st(i) === 'repair').sort((a, b) => (b.repairSince || '').localeCompare(a.repairSince || ''));
  if (!list.length) return `<div class="empty">${ic('wrench', 36)}گوشی‌ای در حال تعمیر نیست.</div>`;
  return `<p class="hint">${faNum(list.length)} گوشی در حال تعمیر</p>${list.map((i) => phoneCard(i, 'repair')).join('')}`;
}
function bindRepair() {
  document.querySelectorAll('[data-fixed]').forEach((cb) => cb.onchange = () => { cb.checked = false; fixedSheet(cb.dataset.fixed); });
}
function fixedSheet(id) {
  const it = state.items.find((x) => x.id === id); if (!it) return;
  const root = openModal(`<h3>تعمیر شد: ${esc(it.brand)} ${esc(it.model)}</h3>
    <label class="f"><span>تعمیرات صورت‌گرفته *</span><textarea id="rdesc" placeholder="مثلاً: تعویض ال‌سی‌دی"></textarea></label>
    <label class="f"><span>مبلغ تعمیرات (تومان)</span><input type="text" inputmode="numeric" id="rcost" class="ltr price"></label>
    <p class="hint">مبلغ تعمیرات به قیمت خرید اضافه می‌شود و گوشی به موجودی برمی‌گردد.</p>
    <div class="row"><button class="btn green" id="ok">تایید</button><button class="btn sec" id="cancel">انصراف</button></div>`);
  bindPriceInputs(root);
  $('#cancel', root).onclick = closeModal;
  $('#ok', root).onclick = async () => {
    const desc = $('#rdesc', root).value.trim(), cost = toNum($('#rcost', root).value);
    if (!desc) return toast('تعمیرات انجام‌شده را بنویسید');
    await store.saveItem({ ...it, status: 'in', repairIssue: null, repairSince: null,
      repairs: [...(it.repairs || []), { issue: it.repairIssue || '', desc, cost, date: todayStr() }] });
    logAct('تعمیر شد', it, `${desc}${cost ? ` — ${fmtPrice(cost)} تومان` : ''}`);
    closeModal(); toast('✅ گوشی به موجودی برگشت');
  };
}

/* ---------- کالاهای خروجی ---------- */
function outSearchList() {
  const q = fa2en(ui.outQ).trim().toLowerCase();
  if (!q) return null;
  return state.items.filter((i) => st(i) === 'out' && i.sale &&
    `${i.brand} ${i.model} ${i.color || ''} ${i.partNumber || ''} ${i.code || ''} ${(i.imei || []).join(' ')} ${i.sale.buyer || ''} ${i.sale.date || ''}`.toLowerCase().includes(q))
    .sort((a, b) => b.sale.date.localeCompare(a.sale.date));
}
function outView() {
  const outs = state.items.filter((i) => st(i) === 'out' && i.sale);
  if (!outs.length) return `<div class="empty">${ic('out', 36)}هنوز گوشی‌ای خارج نشده است.</div>`;
  return `<div class="filters"><input type="text" class="full" id="outQ" placeholder="جستجو: مدل، رنگ، کد کالا، IMEI، نام خریدار" value="${esc(ui.outQ)}"></div>
    <div id="outBody">${outBodyHtml(outs)}</div>`;
}
function outBodyHtml(outs) {
  const found = outSearchList();
  if (found) {
    return `<p class="hint">${faNum(found.length)} گوشی از ${faNum(outs.length)} گوشی خروجی</p>${found.length ? found.map((i) => phoneCard(i, 'out')).join('') : `<div class="empty">${ic('out', 36)}گوشی‌ای با این جستجو پیدا نشد.</div>`}`;
  }
  const years = [...new Set(outs.map((i) => i.sale.date.split('/')[0]))].sort().reverse();
  if (!ui.outYear || !years.includes(ui.outYear)) ui.outYear = years[0];
  const ofYear = outs.filter((i) => i.sale.date.startsWith(ui.outYear + '/'));
  const yearChips = `<div class="chips">${years.map((y) => `<button class="chip ${y === ui.outYear ? 'act' : ''}" style="${colorStyle('#ffd23f')}" data-oy="${y}">${faNum(y)}</button>`).join('')}</div>`;

  if (ui.outMonth) {
    const arr = ofYear.filter((i) => Number(i.sale.date.split('/')[1]) === ui.outMonth).sort((a, b) => b.sale.date.localeCompare(a.sale.date));
    return `${yearChips}<button class="link" id="backMonths">${ic('back', 16)} ماه‌های سال ${faNum(ui.outYear)}</button>
      <h2 class="title" style="margin-top:6px">${MONTHS[ui.outMonth - 1]} ${faNum(ui.outYear)} — ${faNum(arr.length)} گوشی</h2>
      ${arr.map((i) => phoneCard(i, 'out')).join('')}`;
  }
  const months = MONTHS.map((name, i) => ({ name, m: i + 1, count: ofYear.filter((x) => Number(x.sale.date.split('/')[1]) === i + 1).length }))
    .filter((x) => x.count > 0).reverse();
  return `${yearChips}
    <h2 class="title">ماه‌های سال ${faNum(ui.outYear)} — ${faNum(ofYear.length)} گوشی</h2>
    ${months.map((m) => `<button class="mrow" data-om="${m.m}"><span class="m">${m.name}</span><small>${faNum(m.count)} گوشی</small></button>`).join('')}
    <p class="hint">برای دیدن گوشی‌های هر ماه، وارد همان ماه شوید. جمع ورودی، خروجی و سود را در بخش «گزارش» ببینید.</p>`;
}
function refreshOut() {
  const outs = state.items.filter((i) => st(i) === 'out' && i.sale);
  $('#outBody').innerHTML = outBodyHtml(outs); bindOutBody();
}
function bindOut() {
  if (!$('#outQ')) return;
  $('#outQ').addEventListener('input', (e) => { ui.outQ = e.target.value; refreshOut(); });
  bindOutBody();
}
function bindOutBody() {
  const root = $('#outBody');
  const all = (sel) => root.querySelectorAll(sel);
  all('[data-oy]').forEach((b) => b.onclick = () => { ui.outYear = b.dataset.oy; ui.outMonth = null; syncTop(); render(); });
  all('[data-om]').forEach((b) => b.onclick = () => go({ outMonth: Number(b.dataset.om) }));
  $('#backMonths') && ($('#backMonths').onclick = () => {
    if (navStack[navStack.length - 1]?.outMonth) goBack();
    else { ui.outMonth = null; syncTop(); render(); }
  });
  all('[data-undo]').forEach((b) => b.onclick = async () => {
    if (!confirm('این گوشی به موجودی برگردد؟ اطلاعات فروش پاک می‌شود.')) return;
    const it = state.items.find((x) => x.id === b.dataset.undo);
    await store.saveItem({ ...withBy(it, 'edit'), status: 'in', sale: null }); toast('به موجودی برگشت');
  });
}

/* ---------- اسکن بارکد ---------- */
// پنجره دوربین را باز می‌کند و متن بارکد را برمی‌گرداند (یا null اگر لغو شد). accept: فقط بارکدهای مناسب را می‌پذیرد
async function scanBarcode(opts = {}) {
  // در اپ اندروید اول اسکنر گوگل؛ اگر در دسترس نبود به اسکنر داخلی برمی‌گردیم
  if (window.Capacitor?.isNativePlatform?.()) {
    for (;;) {
      let v;
      try { v = String((await nativeScan()) || '').trim(); }
      catch (e) { if (/cancel/i.test(String(e?.message || e))) return null; break; }
      if (!v) return null;
      if (!opts.accept || opts.accept(v)) return v;
      toast(`بارکد «${v}» برای این بخش مناسب نیست؛ بارکد دیگری را اسکن کنید`);
    }
  }
  return scanBarcodeWeb(opts);
}
function scanBarcodeWeb({ title = 'اسکن بارکد', hint = '', accept = () => true } = {}) {
  return new Promise((resolve) => {
    let settled = false, closed = false, stop = null, lastBad = '';
    const end = (val) => { if (settled) return; settled = true; resolve(val); };
    const root = openModal(`<h3>${esc(title)}</h3>
      <div class="scanbox"><video id="scanVideo" playsinline muted autoplay></video><div class="scanframe"></div></div>
      <p class="hint scanmsg" id="scanMsg">${esc(hint || 'بارکد را داخل کادر قرار دهید')}</p>
      <label class="btn blue block" style="margin-bottom:8px">📷 اسکن از عکس (دقیق‌تر برای بارکد ریز)<input type="file" accept="image/*" capture="environment" id="scanPhoto" hidden></label>
      <button class="btn sec block" id="scanCancel" type="button">انصراف</button>`, false, () => {
      closed = true;
      try { stop && stop(); } catch { /* */ }
      stop = null; end(null);
    });
    $('#scanCancel', root).onclick = closeModal;
    const setMsg = (t, bad) => { const m = $('#scanMsg'); if (m) { m.textContent = t; m.classList.toggle('bad', !!bad); } };
    const onRaw = (raw) => {
      if (settled || closed) return;
      const v = String(raw || '').trim();
      if (!v) return;
      if (!accept(v)) {
        if (v !== lastBad) { lastBad = v; setMsg(`بارکد «${v}» برای این بخش مناسب نیست؛ بارکد دیگری را اسکن کنید`, true); }
        return;
      }
      end(v); closeModal();
    };
    $('#scanPhoto', root).onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      setMsg('در حال خواندن عکس…');
      const codes = await scanImageFile(f).catch(() => []);
      if (!codes.length) return setMsg('بارکدی در عکس پیدا نشد؛ نزدیک‌تر و واضح‌تر عکس بگیرید', true);
      codes.forEach(onRaw);
    };
    startScanner($('#scanVideo', root), onRaw).then((s) => { if (closed) { try { s(); } catch { /* */ } } else stop = s; })
      .catch((e) => {
        const n = e?.name;
        setMsg(n === 'NotAllowedError' || n === 'SecurityError'
          ? 'دسترسی به دوربین داده نشد. از تنظیمات گوشی (برنامه‌ها ← موبایل‌یار ← مجوزها) دوربین را فعال کنید.'
          : n === 'NotFoundError' ? 'دوربینی روی این دستگاه پیدا نشد.'
            : `اسکنر باز نشد (${n || e?.message || 'خطا'}). می‌توانید مقدار را دستی وارد کنید.`, true);
      });
  });
}
async function scanImei(input) {
  if (!input) return;
  ui.dirty = true; // تا با همگام‌سازی، فرم نیمه‌پر پاک نشود
  const code = await scanBarcode({
    title: 'اسکن بارکد IMEI',
    hint: 'بارکد IMEI (۱۵ رقمی) روی جعبه یا برچسب گوشی را داخل کادر بگیرید',
    accept: (v) => /^\d{15,17}$/.test(fa2en(v).replace(/\D/g, '')),
  });
  if (!code) return;
  input.value = fa2en(code).replace(/\D/g, '');
  ui.dirty = true;
  const dup = state.items.find((x) => x.id !== ui.editId && (x.imei || []).includes(input.value));
  if (dup) toast(`⚠ این IMEI قبلاً برای ${dup.brand} ${dup.model || ''} (کد ${dup.code || '—'}) ثبت شده است`);
}
async function scanStockSearch() {
  const code = await scanBarcode({ title: 'اسکن بارکد کالا', hint: 'بارکد (کد کالا) را داخل کادر بگیرید' });
  if (!code) return;
  ui.q = code; ui.qExact = true; ui.brandFilter = 'all'; ui.minP = ''; ui.maxP = '';
  render();
  if (!stockList().length) {
    const low = code.toLowerCase();
    const hit = state.items.find((i) => String(i.code || '').toLowerCase() === low || (i.imei || []).includes(code));
    const where = hit ? { out: 'خروجی', repair: 'در حال تعمیر' }[st(hit)] : '';
    toast(hit ? `این کالا (${hit.brand} ${hit.model || ''}) در موجودی نیست${where ? ` — وضعیت: ${where}` : ''}` : `کالایی با بارکد «${code}» پیدا نشد`);
  }
}

/* ---------- تاریخ شمسی از زمان ---------- */
function jalaliOfTs(ts) {
  if (!ts) return '';
  const parts = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(ts));
  const g = (t) => Number(parts.find((p) => p.type === t).value);
  return `${g('year')}/${String(g('month')).padStart(2, '0')}/${String(g('day')).padStart(2, '0')}`;
}
const timeStr = (ts) => new Date(ts).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

/* ---------- یادداشت‌ها ---------- */
function notesListHtml() {
  const q = fa2en(ui.noteQ).trim().toLowerCase();
  const list = [...(state.notes || [])]
    .filter((n) => !q || `${n.text} ${n.by || ''}`.toLowerCase().includes(q))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (!list.length) return `<div class="empty">${ic('note', 36)}${q ? 'یادداشتی پیدا نشد.' : 'هنوز یادداشتی ثبت نشده است.'}</div>`;
  return list.map((n) => `<article class="note"><div class="ntext">${esc(n.text).replace(/\n/g, '<br>')}</div>
    <div class="nmeta"><span>${showDate(jalaliOfTs(n.createdAt))}${n.createdAt ? ` — ${timeStr(n.createdAt)}` : ''}${n.by ? ` · ${esc(String(n.by).split('@')[0])}` : ''}${(n.updatedAt || 0) - (n.createdAt || 0) > 1000 ? ' · ویرایش‌شده' : ''}</span>
      <span class="nact"><button class="btn sm sec" data-nedit="${esc(n.id)}">${ic('edit', 16)} ویرایش</button><button class="btn sm danger" data-ndel="${esc(n.id)}">حذف</button></span></div></article>`).join('');
}
function notesView() {
  return `<form id="noteForm" class="card"><label class="f"><span>یادداشت جدید</span>
      <textarea id="noteText" style="min-height:110px" placeholder="مثلاً: قیمت آیفون‌ها را فردا به‌روز کنم…">${esc(ui.noteDraft)}</textarea></label>
      <button class="btn block" type="submit">ثبت یادداشت</button></form>
    <div class="filters"><input type="text" class="full" id="noteQ" placeholder="جستجو در یادداشت‌ها" value="${esc(ui.noteQ)}"></div>
    <div id="notesList">${notesListHtml()}</div>`;
}
function refreshNotes() { const el = $('#notesList'); if (!el) return; el.innerHTML = notesListHtml(); bindNotesList(); }
function bindNotes() {
  const ta = $('#noteText');
  ta.addEventListener('input', () => { ui.noteDraft = ta.value; });
  $('#noteForm').onsubmit = async (e) => {
    e.preventDefault();
    const text = ta.value.trim();
    if (!text) return toast('متن یادداشت را بنویسید');
    const now = Date.now();
    try { await store.saveNote({ id: uid(), text, createdAt: now, updatedAt: now, by: actor() }); } catch { return; }
    ui.noteDraft = ''; ta.value = '';
    toast('✅ یادداشت ثبت شد');
    refreshNotes();
  };
  $('#noteQ').addEventListener('input', (e) => { ui.noteQ = e.target.value; refreshNotes(); });
  bindNotesList();
}
function bindNotesList() {
  const r = $('#notesList');
  r.querySelectorAll('[data-nedit]').forEach((b) => b.onclick = () => noteSheet(b.dataset.nedit));
  r.querySelectorAll('[data-ndel]').forEach((b) => b.onclick = async () => {
    if (!confirm('این یادداشت حذف شود؟')) return;
    try { await store.deleteNote(b.dataset.ndel); toast('یادداشت حذف شد'); } catch { /* پیام خطا قبلاً نمایش داده شده */ }
  });
}
function noteSheet(id) {
  const n = (state.notes || []).find((x) => x.id === id); if (!n) return;
  const root = openModal(`<h3>ویرایش یادداشت</h3>
    <label class="f"><span>متن یادداشت</span><textarea id="ntxt" style="min-height:180px">${esc(n.text)}</textarea></label>
    <div class="row"><button class="btn" id="nsave" type="button">ذخیره</button><button class="btn sec" id="ncancel" type="button">انصراف</button></div>`);
  $('#ncancel', root).onclick = closeModal;
  $('#nsave', root).onclick = async () => {
    const text = $('#ntxt', root).value.trim();
    if (!text) return toast('متن یادداشت خالی است');
    try { await store.saveNote({ ...n, text }); } catch { return; }
    closeModal(); toast('✅ یادداشت ذخیره شد');
  };
}

/* ---------- گزارش مالی ---------- */
// ورودی: گوشی‌هایی که تاریخ خریدشان در بازه است (مبنا: قیمت ورود/خرید)
// خروجی: گوشی‌هایی که تاریخ فروششان در بازه است (مبنا: قیمت نهایی)
// سود: جمع قیمت نهایی منهای قیمت ورود همان گوشی‌های فروخته‌شده (و هزینه تعمیراتشان)
const entryDate = (it) => it.buyDate || jalaliOfTs(it.createdAt);
function inRange(d, from, to) {
  if (!from && !to) return true;
  return !!d && (!from || d >= from) && (!to || d <= to);
}
function repStats(from, to) {
  const s = { inSum: 0, inCount: 0, outSum: 0, outCount: 0, profit: 0, repair: 0 };
  for (const it of state.items) {
    if (inRange(entryDate(it), from, to)) { s.inSum += it.buyPrice || 0; s.inCount++; }
    if (st(it) === 'out' && it.sale && inRange(it.sale.date, from, to)) {
      const rp = repairSum(it);
      s.outSum += it.sale.finalPrice || 0; s.outCount++; s.repair += rp;
      s.profit += (it.sale.finalPrice || 0) - (it.buyPrice || 0) - rp;
    }
  }
  return s;
}
const money = (n) => `${fmtPrice(n)} <i>تومان</i>`;
function repRows(s) {
  return `<div class="rrow"><span>جمع ورودی<small>مبنا: قیمت ورود · ${faNum(s.inCount)} گوشی</small></span><b>${money(s.inSum)}</b></div>
    <div class="rrow"><span>جمع خروجی<small>مبنا: قیمت نهایی · ${faNum(s.outCount)} گوشی</small></span><b>${money(s.outSum)}</b></div>
    <div class="rrow"><span>جمع سود<small>خروجی − قیمت ورودِ گوشی‌های فروخته‌شده${s.repair ? ` − ${fmtPrice(s.repair)} تعمیرات` : ''}</small></span><b class="profit ${s.profit >= 0 ? 'pos' : 'neg'}">${money(s.profit)}</b></div>`;
}
function reportYears() {
  const set = new Set([todayJalali().y]);
  state.items.forEach((it) => {
    const e = entryDate(it); if (e) set.add(Number(e.split('/')[0]));
    if (it.sale?.date) set.add(Number(it.sale.date.split('/')[0]));
  });
  return [...set].filter(Boolean).sort((a, b) => b - a);
}
function rangeResHtml() {
  let from = ui.repFrom, to = ui.repTo, note = '';
  if (from > to) { [from, to] = [to, from]; note = '<p class="hint">تاریخ شروع بعد از پایان بود؛ جابه‌جا شد.</p>'; }
  return `${note}${repRows(repStats(from, to))}`;
}
function reportBodyHtml() {
  const y = String(ui.repYear), mm = String(ui.repMonth).padStart(2, '0');
  const sum = (a) => a.reduce((s, i) => s + (i.buyPrice || 0), 0);
  const inStock = state.items.filter((i) => st(i) === 'in'), inRepair = state.items.filter((i) => st(i) === 'repair');
  const chips = `<div class="chips">${reportYears().map((yy) => `<button class="chip ${yy === ui.repYear ? 'act' : ''}" style="${colorStyle('#ffd23f')}" data-ry="${yy}">${faNum(yy)}</button>`).join('')}</div>`;
  return `<section class="card rep"><h2 class="title">از ابتدا</h2>${repRows(repStats('', ''))}</section>
    <section class="card rep"><h2 class="title">سالانه — ${faNum(ui.repYear)}</h2>${chips}${repRows(repStats(`${y}/01/01`, `${y}/12/31`))}</section>
    <section class="card rep"><h2 class="title">ماهانه</h2>
      <label class="f"><span>ماه (سال ${faNum(ui.repYear)})</span><select id="repMonthSel">${MONTHS.map((n, i) => `<option value="${i + 1}" ${i + 1 === ui.repMonth ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      ${repRows(repStats(`${y}/${mm}/01`, `${y}/${mm}/31`))}</section>
    <section class="card rep"><h2 class="title">موجودی</h2>
      <div class="rrow"><span>موجودی انبار<small>${faNum(inStock.length)} گوشی</small></span><b>${money(sum(inStock))}</b></div>
      <div class="rrow"><span>در حال تعمیر<small>${faNum(inRepair.length)} گوشی</small></span><b>${money(sum(inRepair))}</b></div>
      <div class="rrow total"><span>جمع موجودی و در حال تعمیر<small>مبنا: قیمت خرید</small></span><b>${money(sum(inStock) + sum(inRepair))}</b></div></section>
    <section class="card rep"><h2 class="title">بر اساس بازه زمانی</h2>
      <label class="f"><span>از تاریخ</span>${dateWidget('rfrom', ui.repFrom)}</label>
      <label class="f"><span>تا تاریخ</span>${dateWidget('rto', ui.repTo)}</label>
      <div id="rangeRes">${rangeResHtml()}</div></section>`;
}
function reportView() {
  const t = todayJalali();
  if (!ui.repYear) ui.repYear = t.y;
  if (!ui.repMonth) ui.repMonth = t.m;
  if (!ui.repFrom) ui.repFrom = `${t.y}/${String(t.m).padStart(2, '0')}/01`;
  if (!ui.repTo) ui.repTo = todayStr();
  return `<div id="repBody">${reportBodyHtml()}</div>`;
}
function refreshReport() { $('#repBody').innerHTML = reportBodyHtml(); bindRepBody(); }
function bindRepBody() {
  const root = $('#repBody');
  root.querySelectorAll('[data-ry]').forEach((b) => b.onclick = () => { ui.repYear = Number(b.dataset.ry); refreshReport(); });
  const ms = $('#repMonthSel', root);
  if (ms) ms.onchange = () => { ui.repMonth = Number(ms.value); refreshReport(); };
  root.querySelectorAll('[data-date="rfrom"] select, [data-date="rto"] select').forEach((s) => s.onchange = () => {
    ui.repFrom = readDate(root, 'rfrom'); ui.repTo = readDate(root, 'rto');
    $('#rangeRes').innerHTML = rangeResHtml();
  });
}
function bindReport() { bindRepBody(); }

/* ---------- تنظیمات، پشتیبان و آنلاین ---------- */
function settingsView() {
  return `<div class="card"><h2 class="title">پشتیبان‌گیری</h2>
      <p class="hint">قبل از هر آپدیت برنامه یک فایل پشتیبان بگیرید. با بازیابی، گوشی‌های فایل به اطلاعات فعلی اضافه می‌شوند.</p>
      <div class="row"><button class="btn" id="bk">دانلود پشتیبان</button><button class="btn sec" id="rs">بازیابی از فایل</button></div>
      <input type="file" id="file" accept="application/json,.json" hidden></div>
    <div class="card"><h2 class="title">همگام‌سازی آنلاین کارکنان</h2>
      ${store.mode === 'online' ? `<p>وضعیت: <b>متصل</b>${user ? ` — ${esc(user.email)}` : ''}</p>${store.kind === 'server' ? `<p class="hint ltr" style="text-align:left">${esc(getServerUrl())}</p>` : ''}
        <div class="row"><button class="btn sec" id="logout">خروج از حساب</button><button class="btn danger" id="offline">قطع اتصال آنلاین</button></div>`
      : `<p class="hint">برای استفاده چندنفره، آدرس سرور خودتان را وارد کنید (مثال: http://185.10.20.30:3000).</p>
        <label class="f"><span>آدرس سرور</span><input type="text" id="srv" class="ltr" inputmode="url" autocapitalize="none" placeholder="http://1.2.3.4:3000"></label>
        <button class="btn block" id="saveSrv">اتصال به سرور</button>
        <details style="margin-top:12px"><summary class="hint">اتصال با Firebase (روش قدیمی)</summary>
        <label class="f"><span>firebaseConfig</span><textarea id="cfg" class="ltr" placeholder='{ "apiKey": "...", "authDomain": "...", "projectId": "...", "appId": "..." }'></textarea></label>
        <button class="btn sec block" id="saveCfg">اتصال Firebase</button></details>`}</div>
    <div class="card"><h2 class="title">نام شما (برای ثبت ورود، خروج و اصلاح)</h2>
      <p class="hint">زیر هر گوشی نوشته می‌شود «ورود/اصلاح/خروج توسط کاربر …» با این نام. اگر خالی باشد، نام کاربری ورود شما نوشته می‌شود.</p>
      <div class="row"><input type="text" id="uname" placeholder="مثلاً علی رضایی" value="${esc(localStorage.getItem(USER_KEY) || '')}"><button class="btn" id="saveName" style="flex:none">ذخیره</button></div></div>
    <p class="hint" style="text-align:center">نسخه برنامه: ${APP_VERSION} — ${window.Capacitor?.isNativePlatform?.() ? 'اپلیکیشن اندروید' : 'نسخه وب'}</p>
    <p class="hint" style="text-align:center">تعداد کل رکوردها: ${faNum(state.items.length)}</p>`;
}
function bindSettings() {
  $('#bk').onclick = async () => {
    const json = JSON.stringify({ app: 'rasa-used-phone', version: 2, exportedAt: todayStr(), ...store.exportAll() }, null, 1);
    const name = `rasa-backup-${todayStr().replace(/\//g, '-')}.json`;
    if (window.Capacitor?.isNativePlatform?.()) {
      // در اپ اندروید دانلود مرورگری کار نمی‌کند؛ فایل ساخته و از طریق منوی اشتراک (ذخیره/تلگرام/...) داده می‌شود
      try {
        const w = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: 'پشتیبان رسا', url: w.uri, dialogTitle: 'ذخیره یا ارسال فایل پشتیبان' });
      } catch (e) { if (!/cancel/i.test(String(e?.message || e))) toast('ساخت فایل پشتیبان ناموفق بود'); }
      return;
    }
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  $('#saveName').onclick = () => { localStorage.setItem(USER_KEY, $('#uname').value.trim()); toast('نام ذخیره شد'); };
  $('#rs').onclick = () => $('#file').click();
  $('#file').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!Array.isArray(d.items)) throw 0;
      if (!confirm(`${faNum(d.items.length)} گوشی از فایل بازیابی شود؟`)) return;
      await store.importAll(d); logAct('بازیابی پشتیبان', null, `${faNum(d.items.length)} گوشی`); toast('✅ بازیابی انجام شد');
    } catch { toast('فایل پشتیبان معتبر نیست'); }
    e.target.value = '';
  };
  if ($('#saveSrv')) $('#saveSrv').onclick = async () => {
    let u = $('#srv').value.trim().replace(/\/+$/, '');
    if (!u) return toast('آدرس سرور را وارد کنید');
    if (!/^https?:\/\//i.test(u)) u = 'http://' + u;
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(u + '/api/ping', { signal: ctl.signal });
      const d = await r.json();
      if (d.name !== 'rasa-sync') throw 0;
    } catch { clearTimeout(tm); return toast('سرور پاسخ نمی‌دهد؛ آدرس و پورت را بررسی کنید'); }
    clearTimeout(tm);
    setServerUrl(u); location.reload();
  };
  if ($('#saveCfg')) $('#saveCfg').onclick = () => {
    const cfg = parseConfig($('#cfg').value);
    if (!cfg?.apiKey || !cfg?.projectId) return toast('تنظیمات معتبر نیست');
    setFirebaseConfig(cfg); location.reload();
  };
  if ($('#logout')) $('#logout').onclick = () => store.logout();
  if ($('#offline')) $('#offline').onclick = () => { if (confirm('به حالت محلی برگردیم؟')) { setFirebaseConfig(null); setServerUrl(null); location.reload(); } };
}
function parseConfig(txt) {
  const m = txt.match(/\{[\s\S]*\}/); if (!m) return null;
  try { return JSON.parse(m[0]); } catch { /* ادامه */ }
  try { return JSON.parse(m[0].replace(/'/g, '"').replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":').replace(/,\s*}/g, '}')); } catch { return null; }
}

document.querySelector('link[rel=icon]')?.setAttribute('href', LOGO);
navStack.push(snap());
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
boot();
