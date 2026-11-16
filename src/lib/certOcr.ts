'use client';

import type { CertGuess } from './types';
import { parseCertificate } from './certParse';

/* Reads a certificate in the parent's browser with free OCR (Tesseract). The photo itself is not sent anywhere;
   only the OCR engine files are downloaded. Two passes: normal, and a high-contrast inverted copy for light text on dark banners. */

type Worker = Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>>;
let workerP: Promise<Worker> | null = null;
function getWorker() {
  if (!workerP) workerP = import('tesseract.js').then((t) => t.createWorker('eng'));
  return workerP;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = URL.createObjectURL(file);
  });
}

function canvases(im: HTMLImageElement) {
  const scale = Math.min(2, 2600 / Math.max(im.naturalWidth, im.naturalHeight));
  const w = Math.round(im.naturalWidth * scale);
  const h = Math.round(im.naturalHeight * scale);
  const a = document.createElement('canvas');
  a.width = w;
  a.height = h;
  const ctx = a.getContext('2d', { willReadFrequently: true })!;
  ctx.filter = 'grayscale(1)';
  ctx.drawImage(im, 0, 0, w, h);
  const b = document.createElement('canvas');
  b.width = w;
  b.height = h;
  const d = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = d.data[i] > 165 ? 0 : 255; // light text becomes black, everything else white
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
  }
  b.getContext('2d')!.putImageData(d, 0, 0);
  return [a, b] as const;
}

async function ocrText(file: File): Promise<string> {
  const im = await loadImage(file);
  const [a, b] = canvases(im);
  URL.revokeObjectURL(im.src);
  const w = await getWorker();
  await w.setParameters({ tessedit_pageseg_mode: '3' as never });
  const one = await w.recognize(a);
  await w.setParameters({ tessedit_pageseg_mode: '11' as never });
  const two = await w.recognize(b);
  return `${one.data.text}\n${two.data.text}`;
}

export async function readCertificateOcr(file: File): Promise<CertGuess | null> {
  try {
    return parseCertificate(await ocrText(file));
  } catch {
    return null;
  }
}

/** Reads an image and decides whether it is a certificate (and what it says) or an ordinary photo. */
export async function classifyImage(file: File): Promise<{ isCert: boolean; guess: CertGuess | null }> {
  try {
    const text = await ocrText(file);
    const guess = parseCertificate(text);
    const words = (text.match(/[A-Za-z]{3,}/g) ?? []).length;
    const certish = /certificate|certify|participat|championship|tournament|secured|awarded|arbiter|organi[sz]er/i.test(text);
    return { isCert: Boolean(guess) || (certish && words > 15), guess };
  } catch {
    return { isCert: false, guess: null };
  }
}
