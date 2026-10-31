// اسکنر بارکد: اول BarcodeDetector خود مرورگر، اگر نبود ZXing (داخل WebView اندروید معمولاً این یکی)
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

// اسکنر اصلی گوگل (ML Kit) روی اندروید؛ برای بارکد ریز مثل IMEI خیلی دقیق‌تر از اسکنر جاوااسکریپتی است
function installGoogleModule() {
  return new Promise(async (ok, no) => {
    let h = null;
    const done = (fn, v) => { clearTimeout(t); try { h && h.remove(); } catch { /* */ } fn(v); };
    const t = setTimeout(() => done(no, new Error('install timeout')), 90000);
    try {
      h = await BarcodeScanner.addListener('googleBarcodeScannerModuleInstallProgress', (ev) => {
        if (ev.state === 4) done(ok);
        else if (ev.state === 3 || ev.state === 5) done(no, new Error('install failed'));
      });
      await BarcodeScanner.installGoogleBarcodeScannerModule();
    } catch (e) { done(no, e); }
  });
}
export async function nativeScan() {
  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (!available) await installGoogleModule();
  const { barcodes } = await BarcodeScanner.scan();
  return barcodes?.[0]?.rawValue || '';
}

const NATIVE_FORMATS = ['code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'codabar', 'qr_code', 'data_matrix'];
const ZX_FORMATS = [
  BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.CODE_93, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.ITF, BarcodeFormat.CODABAR, BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX,
];
const CONSTRAINTS = { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } };

// بارکدهای ریز (مثل IMEI روی جعبه): فوکوس پیوسته و کمی زوم کمک می‌کند (اگر دوربین پشتیبانی کند)
async function tuneTrack(stream) {
  try {
    const track = stream?.getVideoTracks?.()[0]; if (!track) return;
    const caps = track.getCapabilities?.() || {};
    const adv = {};
    if (caps.focusMode?.includes('continuous')) adv.focusMode = 'continuous';
    if (caps.zoom) adv.zoom = Math.min(caps.zoom.max || 1, Math.max(caps.zoom.min || 1, 2));
    if (Object.keys(adv).length) await track.applyConstraints({ advanced: [adv] });
  } catch { /* بعضی دوربین‌ها پشتیبانی نمی‌کنند */ }
}

// خواندن بارکد از یک عکس (دقیق‌تر از ویدیوی زنده). آرایه‌ای از متن بارکدها را برمی‌گرداند.
export async function scanImageFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    if ('BarcodeDetector' in window) {
      try {
        const det = new window.BarcodeDetector({ formats: NATIVE_FORMATS });
        const r = await det.detect(img);
        if (r.length) return r.map((x) => x.rawValue).filter(Boolean);
      } catch { /* ادامه با ZXing */ }
    }
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, ZX_FORMATS);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);
    // چند اندازه امتحان می‌شود تا بارکد ریز یا خیلی بزرگ هم خوانده شود
    for (const maxSide of [0, 2000, 1400, 900]) {
      try {
        let el = img;
        if (maxSide) {
          const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
          if (k >= 1) continue;
          const c = document.createElement('canvas');
          c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          el = c;
        }
        const res = el instanceof HTMLCanvasElement ? reader.decodeFromCanvas(el) : reader.decodeFromImageElement(el);
        const out = await res;
        if (out) return [out.getText()];
      } catch { /* اندازه بعدی */ }
    }
    return [];
  } finally { URL.revokeObjectURL(url); }
}

function stopStream(stream, video) {
  try { stream?.getTracks().forEach((t) => t.stop()); } catch { /* */ }
  try { if (video) video.srcObject = null; } catch { /* */ }
}

// ویدیو را راه می‌اندازد و برای هر بارکد خوانده‌شده onCode(متن) را صدا می‌زند. تابع توقف را برمی‌گرداند.
export async function startScanner(video, onCode) {
  if (!navigator.mediaDevices?.getUserMedia) { const e = new Error('no camera api'); e.name = 'NotSupportedError'; throw e; }

  if ('BarcodeDetector' in window) {
    let stream = null;
    try {
      let formats = NATIVE_FORMATS;
      if (window.BarcodeDetector.getSupportedFormats) {
        const sup = await window.BarcodeDetector.getSupportedFormats();
        formats = NATIVE_FORMATS.filter((f) => sup.includes(f));
      }
      if (formats.length) {
        const det = new window.BarcodeDetector({ formats });
        stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
        video.srcObject = stream;
        video.muted = true; video.setAttribute('playsinline', '');
        await video.play();
        tuneTrack(stream);
        let alive = true, busy = false;
        const tick = async () => {
          if (!alive) return;
          if (!busy && video.readyState >= 2) {
            busy = true;
            try { (await det.detect(video)).forEach((r) => r.rawValue && onCode(r.rawValue)); } catch { /* فریم بعدی */ }
            busy = false;
          }
          if (alive) setTimeout(tick, 140);
        };
        tick();
        return () => { alive = false; stopStream(stream, video); };
      }
    } catch (e) {
      stopStream(stream, video);
      // اگر مشکل از دسترسی دوربین است همین را گزارش بده؛ در غیر این صورت با ZXing ادامه بده
      if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError' || e?.name === 'NotFoundError') throw e;
    }
  }

  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, ZX_FORMATS);
  hints.set(DecodeHintType.TRY_HARDER, true);
  const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
  video.muted = true; video.setAttribute('playsinline', '');
  const controls = await reader.decodeFromConstraints(CONSTRAINTS, video, (result) => {
    if (result) onCode(result.getText());
  });
  tuneTrack(video.srcObject);
  return () => { try { controls.stop(); } catch { /* */ } };
}
