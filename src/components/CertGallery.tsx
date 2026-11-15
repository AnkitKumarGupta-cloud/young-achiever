'use client';

import { useEffect, useState } from 'react';
import type { PhotoItem } from '@/lib/types';

/** Certificates shown whole (never cropped). Tap one to read it full size. */
export default function CertGallery({ items, name }: { items: PhotoItem[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const cur = open === null ? null : items[open];

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % items.length));
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + items.length) % items.length));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, items.length]);

  return (
    <>
      <div className="pv2-certs">
        {items.map((c, i) => (
          <button key={c.id} type="button" className="pv2-cert" onClick={() => setOpen(i)}>
            <span className="pv2-cert-f">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.url} alt={c.caption ? `Certificate: ${c.caption}` : `Certificate of ${name}`} loading="lazy" />
            </span>
            <span className="pv2-cert-t">{c.caption || 'Certificate'}</span>
            <span className="pv2-cert-v">View certificate</span>
          </button>
        ))}
      </div>
      {cur && (
        <div className="lb" role="dialog" aria-modal="true" aria-label="Certificate" onClick={() => setOpen(null)}>
          <figure onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cur.url} alt={cur.caption ? `Certificate: ${cur.caption}` : `Certificate of ${name}`} />
            <figcaption>
              <span>{cur.caption || 'Certificate'}</span>
              <span className="lb-n">
                {open! + 1} / {items.length}
              </span>
            </figcaption>
          </figure>
          <button type="button" className="lb-x" aria-label="Close" onClick={() => setOpen(null)}>
            &times;
          </button>
          {items.length > 1 && (
            <>
              <button type="button" className="lb-p" aria-label="Previous certificate" onClick={(e) => { e.stopPropagation(); setOpen((open! - 1 + items.length) % items.length); }}>
                &#8249;
              </button>
              <button type="button" className="lb-nx" aria-label="Next certificate" onClick={(e) => { e.stopPropagation(); setOpen((open! + 1) % items.length); }}>
                &#8250;
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
