// لایه ذخیره‌سازی: حالت محلی (localStorage) یا آنلاین (Firebase Firestore)
const LS_KEY = 'pm_data_v1';
const CFG_KEY = 'pm_firebase_cfg';
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
const SRV_KEY = 'pm_server_url';
const SRV_OFF = 'pm_server_off';
const SRV_TOKEN = 'pm_srv_token';
const SRV_USER = 'pm_srv_user';
const SRV_CACHE = 'pm_srv_cache';
import { SERVER_URL } from './config.js';

export const DEFAULT_BRANDS = ['آیفون', 'سامسونگ', 'شیائومی'];
const cleanBrands = (l) => (l == null ? DEFAULT_BRANDS : l).filter((b) => b !== 'سایر');

export function getFirebaseConfig() {
  try { return JSON.parse(localStorage.getItem(CFG_KEY)); } catch { return null; }
}
export function setFirebaseConfig(cfg) {
  if (cfg) localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  else localStorage.removeItem(CFG_KEY);
}

const clone = (o) => JSON.parse(JSON.stringify(o));
// ادغام یادداشت‌ها: اگر یادداشتی در هر دو بود، تازه‌ترین نسخه می‌ماند
function mergeNotes(cur, inc) {
  const m = new Map((cur || []).map((x) => [x.id, x]));
  (inc || []).forEach((x) => { const c = m.get(x.id); if (!c || (x.updatedAt || 0) >= (c.updatedAt || 0)) m.set(x.id, x); });
  return [...m.values()];
}

export function getServerUrl() {
  if (localStorage.getItem(SRV_OFF) === '1') return '';
  return (localStorage.getItem(SRV_KEY) || SERVER_URL || '').trim().replace(/\/+$/, '');
}
export function setServerUrl(u) {
  localStorage.removeItem(SRV_TOKEN); localStorage.removeItem(SRV_USER); localStorage.removeItem(SRV_CACHE);
  if (u) { localStorage.setItem(SRV_KEY, u); localStorage.removeItem(SRV_OFF); }
  else { localStorage.removeItem(SRV_KEY); localStorage.setItem(SRV_OFF, '1'); }
}

/* ---------------- حالت محلی ---------------- */
export function createLocalStore() {
  const subs = new Set();
  let actor = () => '';
  const load = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || { items: [], brands: null, colors: {}, log: [], notes: [] }; }
    catch { return { items: [], brands: null, colors: {}, log: [], notes: [] }; }
  };
  let data = load();
  const state = () => ({ items: data.items, brands: cleanBrands(data.brands), colors: data.colors || {}, log: data.log || [], notes: data.notes || [] });
  const emit = (changes = []) => subs.forEach((f) => f(state(), changes));
  const persist = () => { localStorage.setItem(LS_KEY, JSON.stringify(data)); emit(); };

  window.addEventListener('storage', (e) => {
    if (e.key !== LS_KEY) return;
    data = load();
    emit();
  });

  return {
    mode: 'local',
    needsAuth: false,
    setActor(f) { actor = f; },
    subscribe(cb) { subs.add(cb); cb(state(), []); return () => subs.delete(cb); },
    async addLog(e) { data.log = [e, ...(data.log || [])].slice(0, 300); persist(); },
    async saveItem(item) {
      item.updatedBy = actor(); item.updatedAt = Date.now();
      const i = data.items.findIndex((x) => x.id === item.id);
      if (i >= 0) data.items[i] = clone(item); else data.items.push(clone(item));
      persist();
    },
    async deleteItem(id) { data.items = data.items.filter((x) => x.id !== id); persist(); },
    async saveNote(n) {
      n.updatedAt = Date.now();
      if (!data.notes) data.notes = [];
      const i = data.notes.findIndex((x) => x.id === n.id);
      if (i >= 0) data.notes[i] = clone(n); else data.notes.push(clone(n));
      persist();
    },
    async deleteNote(id) { data.notes = (data.notes || []).filter((x) => x.id !== id); persist(); },
    async saveBrands(list, colors) {
      data.brands = list;
      if (colors) data.colors = colors;
      persist();
    },
    async importAll(d) {
      const map = new Map(data.items.map((x) => [x.id, x]));
      (d.items || []).forEach((x) => map.set(x.id, x));
      data.items = [...map.values()];
      if (d.brands?.length) data.brands = [...new Set([...cleanBrands(data.brands), ...cleanBrands(d.brands)])];
      data.colors = { ...(d.colors || {}), ...(data.colors || {}) };
      const lm = new Map([...(d.log || []), ...(data.log || [])].map((x) => [x.id, x]));
      data.log = [...lm.values()].sort((a, b) => b.ts - a.ts).slice(0, 300);
      data.notes = mergeNotes(data.notes, d.notes);
      persist();
    },
    exportAll() { const s = state(); return { items: s.items, brands: s.brands, colors: s.colors, log: s.log, notes: s.notes }; },
  };
}

/* ---------------- حالت آنلاین ---------------- */
export async function createFirebaseStore(cfg) {
  const [appM, fsM, authM] = await Promise.all([
    import(FB + 'firebase-app.js'),
    import(FB + 'firebase-firestore.js'),
    import(FB + 'firebase-auth.js'),
  ]);
  const app = appM.initializeApp(cfg);
  const db = fsM.initializeFirestore(app, { localCache: fsM.persistentLocalCache() });
  const auth = authM.getAuth(app);
  const { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch, query, orderBy, limit } = fsM;

  const subs = new Set();
  let items = [], brands = DEFAULT_BRANDS, colors = {}, log = [], notes = [], gotServer = false, unsubs = [], actor = () => '';
  const state = () => ({ items, brands, colors, log, notes });
  const emit = (changes = []) => subs.forEach((f) => f(state(), changes));

  function start() {
    stop();
    gotServer = false;
    unsubs.push(onSnapshot(collection(db, 'items'), (snap) => {
      items = snap.docs.map((d) => d.data());
      let changes = [];
      if (!gotServer && !snap.metadata.fromCache) { gotServer = true; }
      else if (gotServer && !snap.metadata.hasPendingWrites) {
        changes = snap.docChanges().map((c) => ({ type: c.type, item: c.doc.data() }));
      }
      emit(changes);
    }));
    unsubs.push(onSnapshot(query(collection(db, 'logs'), orderBy('ts', 'desc'), limit(150)), (snap) => {
      log = snap.docs.map((d) => d.data());
      emit();
    }));
    unsubs.push(onSnapshot(doc(db, 'meta', 'brands'), (s) => {
      if (s.exists()) {
        if (Array.isArray(s.data().list)) brands = cleanBrands(s.data().list);
        colors = s.data().colors || {};
      }
      emit();
    }));
    unsubs.push(onSnapshot(doc(db, 'meta', 'notes'), (s) => {
      notes = s.exists() && Array.isArray(s.data().list) ? s.data().list : [];
      emit();
    }));
  }
  function stop() { unsubs.forEach((u) => u()); unsubs = []; log = []; notes = []; }

  return {
    mode: 'online',
    needsAuth: true,
    onAuth(cb) {
      return authM.onAuthStateChanged(auth, (u) => { if (u) start(); else { stop(); items = []; } cb(u); });
    },
    login: (email, pass) => authM.signInWithEmailAndPassword(auth, email, pass),
    logout: () => authM.signOut(auth),
    setActor(f) { actor = f; },
    subscribe(cb) { subs.add(cb); cb(state(), []); return () => subs.delete(cb); },
    async addLog(e) { await setDoc(doc(db, 'logs', e.id), clone(e)); },
    async saveItem(item) {
      item.updatedBy = actor() || auth.currentUser?.email || ''; item.updatedAt = Date.now();
      await setDoc(doc(db, 'items', item.id), clone(item));
    },
    async deleteItem(id) { await deleteDoc(doc(db, 'items', id)); },
    async saveNote(n) {
      n.updatedAt = Date.now();
      await setDoc(doc(db, 'meta', 'notes'), { list: [...notes.filter((x) => x.id !== n.id), clone(n)] });
    },
    async deleteNote(id) { await setDoc(doc(db, 'meta', 'notes'), { list: notes.filter((x) => x.id !== id) }); },
    async saveBrands(list, newColors) {
      await setDoc(doc(db, 'meta', 'brands'), { list, colors: newColors || colors });
    },
    async importAll(d) {
      const all = d.items || [];
      for (let i = 0; i < all.length; i += 400) {
        const b = writeBatch(db);
        all.slice(i, i + 400).forEach((x) => b.set(doc(db, 'items', x.id), clone(x)));
        await b.commit();
      }
      if (d.brands?.length || d.colors) {
        await this.saveBrands([...new Set([...brands, ...cleanBrands(d.brands || [])])], { ...(d.colors || {}), ...colors });
      }
      if (d.notes?.length) await setDoc(doc(db, 'meta', 'notes'), { list: mergeNotes(notes, d.notes) });
    },
    exportAll() { return { items, brands, colors, log, notes }; },
  };
}

/* ---------------- حالت آنلاین با سرور شخصی (REST + SSE) ---------------- */
export function createServerStore(base) {
  const cid = Math.random().toString(36).slice(2) + Date.now().toString(36);
  let token = localStorage.getItem(SRV_TOKEN) || '', username = localStorage.getItem(SRV_USER) || '';
  let items = [], brands = DEFAULT_BRANDS, colors = {}, log = [], notes = [];
  let es = null, authCb = () => {}, actor = () => '', retry = null, dropped = false;
  const subs = new Set();
  const state = () => ({ items, brands, colors, log, notes });
  const emit = (changes = []) => subs.forEach((f) => f(state(), changes));
  const NET_MSG = 'ارتباط با سرور برقرار نیست';

  async function api(path, method = 'GET', body) {
    let r;
    try {
      r = await fetch(base + path, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, 'X-Client': cid },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch { const e = new Error('network'); e.network = true; throw e; }
    if (r.status === 401) { const e = new Error('unauthorized'); e.status = 401; throw e; }
    if (!r.ok) { const e = new Error('http ' + r.status); e.status = r.status; throw e; }
    return r.json();
  }
  async function call(...a) {
    try { return await api(...a); }
    catch (e) {
      if (e.status === 401) logoutLocal();
      else store.onError?.(e.network ? NET_MSG : 'خطا در ذخیره روی سرور');
      throw e;
    }
  }
  function apply(s) {
    items = s.items || []; brands = cleanBrands(s.brands); colors = s.colors || {}; log = s.log || []; notes = s.notes || [];
    try { localStorage.setItem(SRV_CACHE, JSON.stringify(s)); } catch { /* حافظه پر */ }
  }
  async function loadState() { apply(await api('/api/state')); }
  const cacheItems = () => { try { localStorage.setItem(SRV_CACHE, JSON.stringify({ items, brands, colors, log, notes })); } catch { /* */ } };

  function disconnect() { clearTimeout(retry); if (es) { es.close(); es = null; } }
  function connect() {
    disconnect();
    if (!token) return;
    es = new EventSource(`${base}/api/events?token=${encodeURIComponent(token)}&cid=${cid}`);
    es.onopen = async () => {
      if (!dropped) return;
      dropped = false;
      try { await loadState(); emit(); } catch { /* بعداً دوباره */ }
    };
    es.onmessage = (m) => { try { handle(JSON.parse(m.data)); } catch { /* */ } };
    es.onerror = () => {
      dropped = true;
      if (es && es.readyState === 2) { // بسته شده؛ خودکار وصل نمی‌شود
        clearTimeout(retry);
        retry = setTimeout(async () => {
          try { await loadState(); emit(); connect(); }
          catch (e) { if (e.status === 401) logoutLocal(); else connect(); }
        }, 5000);
      }
    };
  }
  function handle(e) {
    if (e.t === 'reload') { loadState().then(() => emit()).catch(() => {}); return; }
    if (e.cid === cid) return; // تغییر خود همین دستگاه؛ قبلاً اعمال شده
    if (e.t === 'item') {
      const i = items.findIndex((x) => x.id === e.item.id);
      if (i >= 0) items[i] = e.item; else items.push(e.item);
      cacheItems();
      emit([{ type: i >= 0 ? 'modified' : 'added', item: e.item }]);
    } else if (e.t === 'delete') {
      items = items.filter((x) => x.id !== e.id);
      cacheItems();
      emit([{ type: 'removed', item: e.item || { brand: '', model: '' } }]);
    } else if (e.t === 'meta') {
      brands = cleanBrands(e.list); colors = e.colors || {}; cacheItems(); emit();
    } else if (e.t === 'log') {
      log = [e.entry, ...log.filter((x) => x.id !== e.entry.id)].slice(0, 300); cacheItems(); emit();
    } else if (e.t === 'note') {
      notes = [...notes.filter((x) => x.id !== e.note.id), e.note]; cacheItems(); emit();
    } else if (e.t === 'delnote') {
      notes = notes.filter((x) => x.id !== e.id); cacheItems(); emit();
    }
  }
  function logoutLocal() {
    disconnect();
    token = ''; username = '';
    localStorage.removeItem(SRV_TOKEN); localStorage.removeItem(SRV_USER); localStorage.removeItem(SRV_CACHE);
    authCb(null);
    items = []; log = []; notes = [];
  }

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || !token) return;
    try { await loadState(); emit(); if (!es || es.readyState === 2) connect(); } catch (e) { if (e.status === 401) logoutLocal(); }
  });

  const store = {
    mode: 'online',
    kind: 'server',
    needsAuth: true,
    onError: null,
    onAuth(cb) {
      authCb = cb;
      (async () => {
        if (!token) return cb(null);
        try { await loadState(); }
        catch (e) {
          if (e.status === 401) { logoutLocal(); return; }
          try { apply(JSON.parse(localStorage.getItem(SRV_CACHE)) || {}); } catch { /* بدون کش */ }
          dropped = true;
        }
        cb({ email: username });
        connect();
      })();
      return () => {};
    },
    async login(name, pass) {
      const r = await fetch(base + '/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, password: pass }),
      }).catch(() => { const e = new Error('network'); e.network = true; throw e; });
      if (!r.ok) { const e = new Error('login failed'); e.status = r.status; throw e; }
      const d = await r.json();
      token = d.token; username = d.user;
      localStorage.setItem(SRV_TOKEN, token); localStorage.setItem(SRV_USER, username);
      await loadState();
      authCb({ email: username });
      connect();
    },
    logout: async () => { logoutLocal(); },
    setActor(f) { actor = f; },
    subscribe(cb) { subs.add(cb); cb(state(), []); return () => subs.delete(cb); },
    async addLog(e) {
      log = [e, ...log.filter((x) => x.id !== e.id)].slice(0, 300); emit();
      await call('/api/logs', 'POST', e);
    },
    async saveItem(item) {
      item.updatedBy = actor() || username; item.updatedAt = Date.now();
      await call('/api/items/' + encodeURIComponent(item.id), 'PUT', item);
      const c = clone(item), i = items.findIndex((x) => x.id === c.id);
      if (i >= 0) items[i] = c; else items.push(c);
      cacheItems(); emit();
    },
    async deleteItem(id) {
      await call('/api/items/' + encodeURIComponent(id), 'DELETE');
      items = items.filter((x) => x.id !== id); cacheItems(); emit();
    },
    async saveNote(n) {
      n.updatedAt = Date.now();
      await call('/api/notes/' + encodeURIComponent(n.id), 'PUT', n);
      notes = [...notes.filter((x) => x.id !== n.id), clone(n)]; cacheItems(); emit();
    },
    async deleteNote(id) {
      await call('/api/notes/' + encodeURIComponent(id), 'DELETE');
      notes = notes.filter((x) => x.id !== id); cacheItems(); emit();
    },
    async saveBrands(list, newColors) {
      await call('/api/meta', 'PUT', { list, colors: newColors || colors });
      brands = cleanBrands(list); colors = newColors || colors; cacheItems(); emit();
    },
    async importAll(d) {
      await call('/api/import', 'POST', { items: d.items || [], brands: d.brands || [], colors: d.colors || {}, log: d.log || [], notes: d.notes || [] });
      await loadState(); emit();
    },
    exportAll() { return { items, brands, colors, log, notes }; },
  };
  return store;
}
