import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { Logo } from '@/components/icons';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  // Cookie-only check (no network round trip). /parent and /admin re-verify the user and role.
  const {
    data: { session },
  } = await supabaseServer().auth.getSession();
  if (session) redirect('/parent');
  return (
    <main className="au">
      <section className="au-side" aria-hidden="true">
        <Link href="/" className="brand-lockup light" tabIndex={-1}>
          <Logo size={34} />
          <span>Young Achievers</span>
        </Link>
        <div className="au-side-copy">
          <p className="au-big">Every tournament adds a line to the story.</p>
          <ul className="au-list">
            <li>Upload a certificate and the result appears.</li>
            <li>FIDE ratings refresh every day.</li>
            <li>Your page is private to people with the link.</li>
          </ul>
        </div>
        <div className="au-board" />
      </section>

      <section className="au-main">
        <Link href="/" className="brand-lockup au-mobile-brand">
          <Logo size={32} />
          <span>Young Achievers</span>
        </Link>
        <div className="au-card">
          <h1>Log in</h1>
          <p className="au-sub">Use the username and password you were given.</p>
          <LoginForm />
          <p className="au-help">
            Forgot your password or need a login? Ask the administrator who set up your page. Administrators log in here too.
          </p>
        </div>
        <Link href="/" className="au-back">
          Back to the home page
        </Link>
      </section>
    </main>
  );
}
