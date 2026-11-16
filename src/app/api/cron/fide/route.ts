import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { refreshBio, syncFide } from '@/lib/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Daily job (see vercel.json): refreshes every player's ratings from FIDE.
 * Vercel sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set; then nothing else can trigger it.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  const fromVercel = (req.headers.get('user-agent') ?? '').startsWith('vercel-cron');
  if (secret ? auth !== `Bearer ${secret}` : !fromVercel) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = supabaseAdmin();
  const { data: list } = await sb.from('achievers').select('id, fide_id, full_name').not('fide_id', 'is', null);
  let updated = 0;
  for (const a of list ?? []) {
    const r = await syncFide(sb, a);
    if (r.changed) {
      updated++;
      await refreshBio(sb, a.id);
    }
    await new Promise((res) => setTimeout(res, 1500)); // be gentle with the FIDE website
  }
  return NextResponse.json({ players: list?.length ?? 0, updated });
}
