'use client';

import { useState } from 'react';
import { ShareIcon } from '@/components/icons';

/** Opens the phone's share sheet when available, otherwise copies the link. */
export default function ShareButton({ url, title }: { url: string; title: string }) {
  const [msg, setMsg] = useState('');
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMsg('Link copied');
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setMsg('Copy failed');
    }
    setTimeout(() => setMsg(''), 2000);
  }
  return (
    <button type="button" className="btn royal sm pp-share" onClick={share}>
      <ShareIcon width={18} height={18} />
      <span>{msg || 'Share'}</span>
    </button>
  );
}
