'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { addResults, deletePhoto, saveFocus, saveProfile, setMainPhoto, syncMyFide, uploadPhoto } from './actions';
import CopyLink from '@/components/CopyLink';
import { EyeIcon } from '@/components/icons';
import { classifyImage, readCertificateOcr } from '@/lib/certOcr';
import type { Achiever, CertGuess, OtherRating, PhotoItem, TournamentResult } from '@/lib/types';

type OtherRow = { k: number; label: string; value: string };
type ResultRow = { k: number; year: string; event: string; result: string };

const TABS = ['Player', 'Photos', 'Certificates', 'FIDE', 'Other ratings', 'Results'];

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary" disabled={pending}>
      {pending ? 'Uploading…' : 'Add photos'}
    </button>
  );
}

const RATIOS: { label: string; v: number }[] = [
  { label: 'Wide 4:3', v: 4 / 3 },
  { label: 'Portrait 3:4', v: 3 / 4 },
  { label: 'Square 1:1', v: 1 },
];

/** Drag to position, slide to zoom. Outputs a JPEG (about 1400px) so uploads stay small and every photo looks deliberate. */
function Cropper({ file, index, total, onDone, onSkip }: { file: File; index: number; total: number; onDone: (f: File) => void; onSkip: () => void }) {
  const [url, setUrl] = useState('');
  const [ratio, setRatio] = useState(RATIOS[0].v);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [ratio, nat]);

  const cover = nat && size.w ? Math.max(size.w / nat.w, size.h / nat.h) : 1;
  const scale = cover * zoom;
  const dw = nat ? nat.w * scale : 0;
  const dh = nat ? nat.h * scale : 0;
  const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));
  const x = clamp(off.x, Math.max(0, (dw - size.w) / 2));
  const y = clamp(off.y, Math.max(0, (dh - size.h) / 2));

  function apply() {
    const im = img.current;
    if (!im || !nat) return;
    const ow = ratio >= 1 ? 1400 : 1200;
    const oh = Math.round(ow / ratio);
    const c = document.createElement('canvas');
    c.width = ow;
    c.height = oh;
    const sx = (dw / 2 - size.w / 2 - x) / scale;
    const sy = (dh / 2 - size.h / 2 - y) / scale;
    c.getContext('2d')!.drawImage(im, sx, sy, size.w / scale, size.h / scale, 0, 0, ow, oh);
    c.toBlob(
      (blob) => {
        if (blob) onDone(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
        else onSkip();
      },
      'image/jpeg',
      0.85,
    );
  }

  return (
    <div className="crop-ov" role="dialog" aria-modal="true" aria-label="Crop photo">
      <div className="crop-card">
        <h3>
          Crop photo {index + 1} of {total}
        </h3>
        <div className="crop-rt">
          {RATIOS.map((r) => (
            <button key={r.label} type="button" className={ratio === r.v ? 'on' : ''} onClick={() => { setRatio(r.v); setOff({ x: 0, y: 0 }); }}>
              {r.label}
            </button>
          ))}
        </div>
        <div
          ref={box}
          className="crop-box"
          style={{ aspectRatio: String(ratio) }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { sx: e.clientX, sy: e.clientY, ox: x, oy: y };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d) setOff({ x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy });
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
        >
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={img}
              src={url}
              alt=""
              draggable={false}
              onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              style={{ width: dw || 'auto', height: dh || 'auto', transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`, opacity: nat ? 1 : 0 }}
            />
          )}
          <div className="crop-grid" />
        </div>
        <label className="crop-zoom">
          Zoom
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
        </label>
        <p className="muted" style={{ margin: 0 }}>Drag the photo to frame your child&rsquo;s face, then press Use this crop.</p>
        <div className="crop-act">
          <button type="button" onClick={onSkip}>Skip this photo</button>
          <button type="button" className="primary" onClick={apply} disabled={!nat}>Use this crop</button>
        </div>
      </div>
    </div>
  );
}

function Photos({ photos, hero }: { photos: PhotoItem[]; hero: { x: number; y: number } }) {
  const [state, action] = useFormState(uploadPhoto, undefined);
  const [pos, setPos] = useState(hero);
  const [fmsg, setFmsg] = useState('');
  const [, start] = useTransition();
  const [queue, setQueue] = useState<File[]>([]);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState<{ file: File; url: string }[]>([]);
  const [pmsg, setPmsg] = useState('');
  const main = photos[0];
  const bg = main ? { backgroundImage: `url("${main.url}")` } : undefined;
  return (
    <div>
      <h2>Photos</h2>
      <p className="muted">
        Your child&rsquo;s own photo is the hero of the page. The first photo is the main photo. Up to 8 photos (JPG, PNG
        or WebP). Photos are saved as soon as you add them, and location data is removed automatically. Please use
        photos you&rsquo;re happy to share publicly.
      </p>
      {photos.length > 0 && (
        <div className="pd-photos">
          {photos.map((p, i) => (
            <div key={p.id} className="pd-ph1">
              <div className="pd-ph1i" style={{ backgroundImage: `url("${p.url}")` }}>
                {i === 0 && <span className="pd-mainb">Main photo</span>}
              </div>
              <div className="actions">
                {i > 0 && (
                  <form action={setMainPhoto}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn-sm">Make main</button>
                  </form>
                )}
                <form action={deletePhoto}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn-sm danger">Remove</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
      <form
        action={async () => {
          if (!ready.length) {
            setPmsg('Choose a photo first.');
            return;
          }
          setPmsg('');
          const fd = new FormData();
          ready.forEach((r) => fd.append('photo', r.file));
          await action(fd);
          ready.forEach((r) => URL.revokeObjectURL(r.url));
          setReady([]);
        }}
        className="grid"
      >
        <div className="field">
          <label htmlFor="photo">Choose photos</label>
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              const fl = Array.from(e.target.files ?? []);
              e.target.value = '';
              if (!fl.length) return;
              setTotal(fl.length);
              setQueue(fl);
            }}
          />
        </div>
        {ready.length > 0 && (
          <div className="pd-ready">
            {ready.map((r, i) => (
              <div key={r.url} style={{ backgroundImage: `url("${r.url}")` }} aria-label={`Ready photo ${i + 1}`} />
            ))}
          </div>
        )}
        {ready.length > 0 && <p className="muted" style={{ margin: 0 }}>{ready.length} cropped photo{ready.length > 1 ? 's' : ''} ready. Press Add photos to upload.</p>}
        {pmsg && <p className="error" style={{ margin: 0 }}>{pmsg}</p>}
        {state?.error && <p className="error" style={{ margin: 0 }}>{state.error}</p>}
        {state?.ok && <p className="ok" style={{ margin: 0 }}>{state.ok}</p>}
        <div>
          <UploadButton />
        </div>
      </form>
      {queue.length > 0 && (
        <Cropper
          key={`${total}-${queue.length}`}
          file={queue[0]}
          index={total - queue.length}
          total={total}
          onDone={(f) => {
            setReady((r) => [...r, { file: f, url: URL.createObjectURL(f) }]);
            setQueue((q) => q.slice(1));
          }}
          onSkip={() => setQueue((q) => q.slice(1))}
        />
      )}

      {main && (
        <>
          <h3 style={{ fontSize: '1.05rem', margin: '22px 0 6px' }}>Keep the face in view</h3>
          <p className="muted">Click on your child&rsquo;s face. Every crop of the main photo will keep that spot visible.</p>
          <div className="pd-focus">
            <div
              className="pd-fpick"
              style={bg}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const x = Math.round(((e.clientX - r.left) / r.width) * 100);
                const y = Math.round(((e.clientY - r.top) / r.height) * 100);
                setPos({ x, y });
                start(async () => {
                  const res = await saveFocus(x, y);
                  setFmsg(res?.error ?? 'Saved.');
                });
              }}
            >
              <i style={{ left: `${pos.x}%`, top: `${pos.y}%` }} />
            </div>
            <div className="pd-fprev">
              <div>
                <span className="label-sm">Desktop hero</span>
                <div className="pd-pw" style={{ ...bg, backgroundPosition: `${pos.x}% ${pos.y}%` }} />
              </div>
              <div>
                <span className="label-sm">Phone hero</span>
                <div className="pd-pt" style={{ ...bg, backgroundPosition: `${pos.x}% ${pos.y}%` }} />
              </div>
            </div>
          </div>
          {fmsg && <p className="muted" style={{ margin: '8px 0 0' }}>{fmsg}</p>}
        </>
      )}
    </div>
  );
}

/** Shrinks a scan or photo of a certificate in the browser (no cropping) so uploads stay small. */
function shrink(file: File, max = 2000): Promise<File> {
  return new Promise((resolve) => {
    const u = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * s);
      c.height = Math.round(im.naturalHeight * s);
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u);
      c.toBlob((b) => resolve(b ? new File([b], 'certificate.jpg', { type: 'image/jpeg' }) : file), 'image/jpeg', 0.9);
    };
    im.onerror = () => {
      URL.revokeObjectURL(u);
      resolve(file);
    };
    im.src = u;
  });
}

function Certificates({ items, register }: { items: PhotoItem[]; register: (fn: () => Promise<void>) => void }) {
  const [ready, setReady] = useState<{ file: File; url: string; title: string; reading?: boolean; note?: string }[]>([]);
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});
  const [busy, setBusy] = useState(false);

  // Chosen certificates upload automatically when the parent moves on (Next, another tab, Save or Publish).
  const pending = useRef(ready);
  pending.current = ready;
  useEffect(() => {
    register(async () => {
      if (pending.current.length) await upload();
    });
  });

  async function upload() {
    const ready = pending.current;
    if (!ready.length) return setMsg({ error: 'Choose a certificate first.' });
    setBusy(true);
    setMsg({});
    let added = 0;
    let error = '';
    // One request per certificate keeps each upload well under the hosting size limit.
    for (const r of ready) {
      const fd = new FormData();
      fd.append('kind', 'certificate');
      fd.append('photo', r.file);
      fd.append('caption', r.title);
      const res = await uploadPhoto(undefined, fd);
      if (res?.error) error = res.error;
      else added++;
    }
    ready.forEach((r) => URL.revokeObjectURL(r.url));
    setReady([]);
    setBusy(false);
    setMsg(error ? { error: added ? `${added} added. ${error}` : error } : { ok: `${added} certificate${added > 1 ? 's' : ''} added.` });
  }

  return (
    <div>
      <h2>Certificates</h2>
      <p className="muted">
        Add certificates from tournaments. They are shown whole, never cropped, and visitors can tap one to read it.
        Give each a short title, for example &ldquo;Western Asian Youth Championship 2026 &middot; Rapid&rdquo;. Up to 12.
        We read each certificate and fill in its title and tournament result for you. Check them, then press Next, Save draft or Publish.
      </p>
      {items.length > 0 && (
        <div className="pd-certs">
          {items.map((c) => (
            <div key={c.id} className="pd-cert">
              <div className="pd-cert-i" style={{ backgroundImage: `url("${c.url}")` }} />
              <b>{c.caption || 'Certificate'}</b>
              <form action={deletePhoto}>
                <input type="hidden" name="id" value={c.id} />
                <button className="btn-sm danger">Remove</button>
              </form>
            </div>
          ))}
        </div>
      )}
      <div className="grid">
        <div className="field">
          <label htmlFor="cert">Choose certificates</label>
          <input
            id="cert"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            onChange={async (e) => {
              const fl = Array.from(e.target.files ?? []);
              e.target.value = '';
              const shrunk = await Promise.all(fl.map((f) => shrink(f)));
              const added = shrunk.map((f) => ({ file: f, url: URL.createObjectURL(f), title: '', reading: true }));
              setReady((r) => [...r, ...added]);
              // Read each certificate and fill in the title and a tournament result automatically.
              for (const item of added) {
                const g = await readCertificateOcr(item.file);
                const saved = g ? await addResults([g]).catch(() => null) : null;
                const note = !g
                  ? 'Could not read this certificate automatically. You can still add it; type a title if you like.'
                  : saved?.error
                    ? saved.error
                    : saved?.ok === 'Already on the page.'
                      ? 'This tournament is already in your Results.'
                      : `Added to Results: ${g.year} · ${g.event} · ${g.result}.`;
                setReady((all) => all.map((x) => (x.url === item.url ? { ...x, reading: false, note, title: x.title || g?.title || '' } : x)));
              }
            }}
          />
          <p className="muted" style={{ margin: '6px 0 0' }}>Got a PDF or Word file? Take a screenshot of the certificate and add that.</p>
        </div>
        {ready.map((r, i) => (
          <div key={r.url} className="pd-cready">
            <div className="pd-cert-i" style={{ backgroundImage: `url("${r.url}")` }} />
            <div className="field">
              <label htmlFor={`ct${i}`}>Title{r.reading ? ' (reading the certificate…)' : ''}</label>
              <input
                id={`ct${i}`}
                type="text"
                maxLength={160}
                value={r.title}
                placeholder="e.g. Western Asian Youth Championship 2026 · Rapid"
                onChange={(e) => setReady((all) => all.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
              />
              {r.note && <p className="muted" style={{ margin: '6px 0 0', fontSize: '.85rem' }}>{r.note}</p>}
            </div>
            <button
              type="button"
              className="btn-sm"
              onClick={() => {
                URL.revokeObjectURL(r.url);
                setReady((all) => all.filter((_, j) => j !== i));
              }}
            >
              Remove
            </button>
          </div>
        ))}
        {msg.error && <p className="error" style={{ margin: 0 }}>{msg.error}</p>}
        {msg.ok && <p className="ok" style={{ margin: 0 }}>{msg.ok}</p>}
        {busy && <p className="muted" style={{ margin: 0 }}>Uploading certificates…</p>}
      </div>
    </div>
  );
}

function FideStatus({ a }: { a: Achiever }) {
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, start] = useTransition();
  const show = (v: number | null) => (typeof v === 'number' && v >= 1000 ? String(v) : 'Not rated');
  const when = a.fide_synced_at ? new Date(a.fide_synced_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  return (
    <div className="pd-fide">
      <div className="pd-fide-r">
        {(
          [
            ['Standard', a.fide_standard],
            ['Rapid', a.fide_rapid],
            ['Blitz', a.fide_blitz],
          ] as const
        ).map(([k, v]) => (
          <div key={k}>
            <span className="label-sm">{k}</span>
            <b>{show(v)}</b>
          </div>
        ))}
      </div>
      <p className="muted" style={{ margin: 0 }}>
        {a.fide_id ? (when ? `Last updated from FIDE on ${when}.` : 'Not fetched from FIDE yet.') : 'Add the FIDE ID above, then press Save draft.'}
      </p>
      {a.fide_id && (
        <div>
          <button
            type="button"
            className="btn-sm"
            disabled={pending}
            onClick={() => start(async () => setMsg((await syncMyFide()) ?? {}))}
          >
            {pending ? 'Checking FIDE…' : 'Update from FIDE now'}
          </button>
        </div>
      )}
      {msg.ok && <p className="ok" style={{ margin: 0 }}>{msg.ok}</p>}
      {msg.error && <p className="error" style={{ margin: 0 }}>{msg.error}</p>}
    </div>
  );
}

/** One place to drop everything: each image is read, sorted into certificate or photo, and saved straight away. */
function QuickAdd() {
  const [items, setItems] = useState<{ id: string; name: string; status: string; state: 'busy' | 'ok' | 'err' }[]>([]);
  const [drag, setDrag] = useState(false);
  const busy = items.some((i) => i.state === 'busy');
  const set = (id: string, status: string, state: 'busy' | 'ok' | 'err') =>
    setItems((all) => all.map((x) => (x.id === id ? { ...x, status, state } : x)));

  async function handle(files: File[]) {
    const list = files.filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    const added = list.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, status: 'Waiting…', state: 'busy' as const }));
    if (files.length > list.length) added.push({ id: `${Date.now()}-x`, name: `${files.length - list.length} file(s)`, status: 'Only JPG, PNG or WebP images can be added. For a PDF, take a screenshot.', state: 'err' as never });
    setItems((all) => [...added, ...all]);
    for (const [i, file] of list.entries()) {
      const id = added[i].id;
      set(id, 'Reading…', 'busy');
      const small = await shrink(file);
      const { isCert, guess } = await classifyImage(small);
      const fd = new FormData();
      fd.append('kind', isCert ? 'certificate' : 'photo');
      fd.append('photo', small);
      if (isCert && guess?.title) fd.append('caption', guess.title);
      set(id, isCert ? 'Saving certificate…' : 'Saving photo…', 'busy');
      const up = await uploadPhoto(undefined, fd).catch(() => ({ error: 'Upload failed. Please try again.' }));
      if (up?.error) {
        set(id, up.error, 'err');
        continue;
      }
      if (isCert && guess) {
        const r = await addResults([guess]).catch(() => null);
        set(id, r?.ok === 'Already on the page.' ? `Certificate added (${guess.title || 'tournament already listed'}).` : `Certificate added, result saved: ${guess.event} · ${guess.result}`, 'ok');
      } else {
        set(id, isCert ? 'Certificate added.' : 'Photo added.', 'ok');
      }
    }
  }

  return (
    <section className="card pd-quick">
      <div>
        <h2>Add photos &amp; certificates</h2>
        <p className="muted" style={{ margin: '4px 0 0' }}>
          Just drop them here. We sort photos from certificates, read each certificate, add the tournament result, update the
          ratings from FIDE and write the About text for you.
        </p>
      </div>
      <label
        className={`pd-drop${drag ? ' on' : ''}${busy ? ' busy' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!busy) handle(Array.from(e.dataTransfer.files)); }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy}
          onChange={(e) => {
            const fl = Array.from(e.target.files ?? []);
            e.target.value = '';
            if (fl.length) handle(fl);
          }}
        />
        <span className="pd-drop-i" aria-hidden="true">+</span>
        <b>{busy ? 'Working on it…' : 'Choose photos or certificates'}</b>
        <span className="muted">or drag them here · JPG, PNG or WebP</span>
      </label>
      {items.length > 0 && (
        <ul className="pd-qlist">
          {items.map((i) => (
            <li key={i.id} className={i.state}>
              <span>{i.name}</span>
              <span>{i.status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Dashboard({
  achiever,
  other,
  results,
  photos,
  certificates,
  bioText,
  pct,
  fullUrl,
}: {
  achiever: Achiever;
  other: OtherRating[];
  results: TournamentResult[];
  photos: PhotoItem[];
  certificates: PhotoItem[];
  bioText: string;
  pct: number;
  fullUrl: string;
}) {
  const a = achiever;
  const [state, action] = useFormState(saveProfile, undefined);
  const [tab, setTab] = useState(0);
  const [nextKey, setNextKey] = useState(1000);
  const [others, setOthers] = useState<OtherRow[]>(other.map((o, i) => ({ k: i, label: o.label, value: o.value })));
  const [rows, setRows] = useState<ResultRow[]>(results.map((r, i) => ({ k: i, year: String(r.year), event: r.event, result: r.result })));
  const live = a.published && !a.taken_down;
  const main = photos[0];
  const pos = { x: a.hero_x ?? 50, y: a.hero_y ?? 35 };
  const flushCerts = useRef<() => Promise<void>>(async () => {});
  const resultsKey = results.map((r) => r.id).join(',');
  useEffect(() => {
    setRows(results.map((r, i) => ({ k: i, year: String(r.year), event: r.event, result: r.result })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsKey]);
  const [busy, setBusy] = useState(false);
  async function go(next: number) {
    setBusy(true);
    await flushCerts.current();
    setBusy(false);
    setTab(next);
  }

  return (
    <>
      <QuickAdd />
      <section className="pd-sum card">
        <div
          className={`pd-thumb${main ? '' : ' none'}`}
          style={main ? { backgroundImage: `url("${main.url}")`, backgroundPosition: `${pos.x}% ${pos.y}%` } : undefined}
        />
        <div className="pd-sum-i">
          <h2>{a.full_name}</h2>
          <p className="muted" style={{ margin: '2px 0 12px' }}>&#9822;&#xFE0E; Chess</p>
          <div className="pd-pr"><span>Profile completion</span><b>{pct}%</b></div>
          <div className="pd-bar"><i style={{ width: `${pct}%` }} /></div>
          <div style={{ margin: '12px 0 6px' }}>
            {a.taken_down ? <span className="badge down">Taken down</span> : live ? <span className="badge live">Live</span> : <span className="badge">Draft</span>}
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {a.taken_down
              ? 'This page was taken down by the administrator. Please contact them.'
              : live
                ? 'Your page is public. Anyone with the link can see it.'
                : 'Only you and the administrator can see this page.'}
          </p>
          {live && (
            <>
              <div className="linkbox"><a href={fullUrl} target="_blank" rel="noopener noreferrer">{fullUrl}</a></div>
              <CopyLink url={fullUrl} />
            </>
          )}
        </div>
        <div className="pd-qa">
          <h3>Quick actions</h3>
          <Link className="btn primary" href="/parent/preview" target="_blank">
            <EyeIcon width={18} height={18} /> Preview page
          </Link>
          <button form="pform" name="intent" value="save">Save draft</button>
          {!a.taken_down && (
            <button form="pform" className="gold" name="intent" value="publish">
              {live ? 'Save & keep published' : 'Publish'}
            </button>
          )}
          {live && <button form="pform" className="danger" name="intent" value="unpublish">Unpublish</button>}
          {state?.error && <p className="error" style={{ margin: 0 }}>{state.error}</p>}
          {state?.ok && <p className="ok" style={{ margin: 0 }}>{state.ok}</p>}
        </div>
      </section>

      <section className="card pd-edit" id="edit">
        <div className="pd-steps" role="tablist">
          {TABS.map((t, i) => (
            <button key={t} type="button" role="tab" aria-selected={tab === i} className={tab === i ? 'on' : ''} onClick={() => go(i)} disabled={busy}>
              {i + 1} &middot; {t}
            </button>
          ))}
        </div>
        <div className="pd-panels">
          <form
            id="pform"
            action={async (fd: FormData) => {
              await flushCerts.current();
              action(fd);
            }}
          >
            <div className="pd-panel" hidden={tab !== 0}>
              <h2>Player</h2>
              <p className="muted">Basic information shown on the page.</p>
              <div className="grid">
                <div className="field">
                  <label htmlFor="full_name">Full name</label>
                  <input id="full_name" name="full_name" type="text" defaultValue={a.full_name} required maxLength={100} />
                </div>
                <div className="field">
                  <label>About text</label>
                  <div className="bio-prev">{bioText}</div>
                  <p className="muted" style={{ margin: '8px 0 0' }}>
                    Written for you automatically from the details you enter (ratings, results, certificates). It only uses
                    those facts and never adds personal details. It updates each time you save.
                  </p>
                </div>
              </div>
            </div>

            <div className="pd-panel" hidden={tab !== 3}>
              <h2>FIDE</h2>
              <p className="muted">
                Ratings are fetched automatically from the official FIDE website every day. Just make sure the FIDE ID is right.
              </p>
              <div className="grid">
                <div className="field" style={{ maxWidth: 280 }}>
                  <label htmlFor="fide_id">FIDE ID</label>
                  <input id="fide_id" name="fide_id" type="text" inputMode="numeric" defaultValue={a.fide_id ?? ''} placeholder="e.g. 374096774" />
                </div>
                <FideStatus a={a} />
              </div>
            </div>

            <div className="pd-panel" hidden={tab !== 4}>
              <h2>Other ratings</h2>
              <p className="muted">For example a state or national federation rating.</p>
              {others.map((r) => (
                <div className="rowedit other" key={r.k}>
                  <div className="field"><label>Label</label><input type="text" name="other_label" defaultValue={r.label} placeholder="e.g. AICF rating" maxLength={80} /></div>
                  <div className="field"><label>Value</label><input type="text" name="other_value" defaultValue={r.value} maxLength={40} /></div>
                  <button type="button" className="btn-sm" onClick={() => setOthers(others.filter((x) => x.k !== r.k))}>Remove</button>
                </div>
              ))}
              <button type="button" className="btn-sm" onClick={() => { setOthers([...others, { k: nextKey, label: '', value: '' }]); setNextKey(nextKey + 1); }}>+ Add rating</button>
            </div>

            <div className="pd-panel" hidden={tab !== 5}>
              <h2>Tournament results</h2>
              <p className="muted">Only enter results you can stand behind. They are shown as submitted by you.</p>
              {rows.map((r) => (
                <div className="rowedit res" key={r.k}>
                  <div className="field"><label>Year</label><input type="number" name="res_year" defaultValue={r.year} min={1990} /></div>
                  <div className="field"><label>Event</label><input type="text" name="res_event" defaultValue={r.event} maxLength={160} /></div>
                  <div className="field"><label>Result</label><input type="text" name="res_result" defaultValue={r.result} placeholder="e.g. 3rd place, 6/9" maxLength={160} /></div>
                  <button type="button" className="btn-sm" onClick={() => setRows(rows.filter((x) => x.k !== r.k))}>Remove</button>
                </div>
              ))}
              <button type="button" className="btn-sm" onClick={() => { setRows([...rows, { k: nextKey, year: String(new Date().getFullYear()), event: '', result: '' }]); setNextKey(nextKey + 1); }}>+ Add result</button>
            </div>
          </form>

          <div className="pd-panel" hidden={tab !== 1}>
            <Photos photos={photos} hero={pos} />
          </div>

          <div className="pd-panel" hidden={tab !== 2}>
            <Certificates items={certificates} register={(fn) => { flushCerts.current = fn; }} />
          </div>

          <div className="pd-foot">
            <button form="pform" name="intent" value="save">Save draft</button>
            {tab < TABS.length - 1 && (
              <button type="button" className="primary" onClick={() => go(tab + 1)} disabled={busy}>{busy ? 'Saving…' : 'Next'}</button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
