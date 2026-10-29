import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import { restore, takeDown } from './actions';
import CreateParentForm from './CreateParentForm';
import ResetPasswordForm from './ResetPasswordForm';

export const dynamic = 'force-dynamic';

type Row = { id: string; slug: string; full_name: string; published: boolean; taken_down: boolean; owner_id: string };

export default async function AdminPage() {
  const me = await requireAdmin();
  const sb = supabaseServer(); // admin RLS policies let this user read everything
  const [{ data: rows }, { data: parents }] = await Promise.all([
    sb.from('achievers').select('id, slug, full_name, published, taken_down, owner_id').order('created_at', { ascending: false }),
    sb.from('profiles').select('id, username').eq('role', 'parent'),
  ]);
  const usernames = new Map((parents ?? []).map((p) => [p.id as string, p.username as string]));
  const list = (rows ?? []) as Row[];
  const live = list.filter((r) => r.published && !r.taken_down).length;
  const down = list.filter((r) => r.taken_down).length;
  const drafts = list.length - live - down;

  return (
    <>
      <TopBar username={me.username} admin />
      <main className="container page">
        <div className="stats">
          <div className="stat">
            <b>{list.length}</b>
            <span>Players</span>
          </div>
          <div className="stat">
            <b>{live}</b>
            <span>Live</span>
          </div>
          <div className="stat">
            <b>{drafts}</b>
            <span>Drafts</span>
          </div>
          <div className="stat">
            <b>{down}</b>
            <span>Taken down</span>
          </div>
        </div>

        <CreateParentForm />

        <section className="card">
          <div className="card-h">
            <h2>All players</h2>
          </div>
          {list.length === 0 ? (
            <div className="empty">
              <div className="big">&#9822;&#xFE0E;</div>
              <p>No players yet. Create the first parent login above.</p>
            </div>
          ) : (
            <div className="players">
              {list.map((r) => (
                <div className="player" key={r.id}>
                  <div className="player-top">
                    <div>
                      <div className="player-name">{r.full_name}</div>
                      <div className="muted">/achievers/{r.slug}</div>
                    </div>
                    <div className="player-meta">
                      <div>
                        <span className="label-sm">Login</span>
                        {usernames.get(r.owner_id) ?? '—'}
                      </div>
                      <div>
                        {r.taken_down ? (
                          <span className="badge down">Taken down</span>
                        ) : r.published ? (
                          <span className="badge live">Live</span>
                        ) : (
                          <span className="badge">Draft</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="actions">
                    <Link className="btn btn-sm" href={`/admin/preview/${r.id}`}>
                      Preview
                    </Link>
                    {r.published && !r.taken_down && (
                      <Link className="btn btn-sm" href={`/achievers/${r.slug}`} target="_blank">
                        Open public link
                      </Link>
                    )}
                    <form action={r.taken_down ? restore : takeDown}>
                      <input type="hidden" name="id" value={r.id} />
                      {r.taken_down ? (
                        <button className="btn-sm">Restore</button>
                      ) : (
                        <button className="btn-sm danger">Take down</button>
                      )}
                    </form>
                    <ResetPasswordForm userId={r.owner_id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
