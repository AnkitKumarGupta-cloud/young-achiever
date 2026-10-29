import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { Crown, KeyIcon, PeopleIcon, ShieldIcon, StarIcon } from '@/components/icons';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

function Brand({ dark }: { dark?: boolean }) {
  return (
    <Link href="/" className={`lg-brand${dark ? ' dark' : ''}`}>
      <Crown size={dark ? 44 : 38} />
      <span className="lg-brand-t">
        <b>Young Achievers</b>
        <i>Small steps. Big dreams.</i>
      </span>
    </Link>
  );
}

export default async function LoginPage() {
  // Cookie-only check (no network round trip). /parent and /admin re-verify the user and role.
  const {
    data: { session },
  } = await supabaseServer().auth.getSession();
  if (session) redirect('/parent');
  return (
    <main className="lg">
      <section className="lg-hero">
        <div className="lg-hero-in">
          <Brand dark />
          <div className="lg-copy">
            <p className="lg-eyebrow">Parent login</p>
            <h1>
              Your Child&apos;s Journey, <em>Our Platform</em>
            </h1>
            <p className="lg-lead">
              Log in to manage your child&apos;s profile, add achievements, update photos and showcase their incredible
              journey.
            </p>
            <ul className="lg-badges">
              <li>
                <ShieldIcon /> <span>Secure<br />access</span>
              </li>
              <li>
                <StarIcon /> <span>Private<br />pages</span>
              </li>
              <li>
                <PeopleIcon /> <span>Parent<br />controlled</span>
              </li>
            </ul>
          </div>
          <blockquote className="lg-quote">
            &ldquo;Every great achievement
            <br />
            begins with a parent who believes.&rdquo;
          </blockquote>
        </div>
        <svg className="lg-wave" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 34C90 8 170 8 250 28S360 52 400 30" fill="none" stroke="#c9a24a" strokeWidth="2.5" />
          <path d="M0 40C90 14 170 14 250 34S360 58 400 36V60H0Z" fill="#f6f2e9" />
        </svg>
      </section>

      <section className="lg-side">
        <svg className="lg-leaf" viewBox="0 0 160 200" aria-hidden="true">
          <g fill="none" stroke="#d9c7a0" strokeWidth="1.4" opacity=".9">
            <path d="M150 10C110 40 90 90 100 150" />
            <path d="M130 52c-22-4-36-18-40-36 22 2 38 14 40 36Z" fill="#eadfc6" />
            <path d="M118 88c-24 0-40-12-48-28 24-2 42 8 48 28Z" fill="#eadfc6" />
            <path d="M104 126c-22 4-40-4-52-18 22-6 42-2 52 18Z" fill="#eadfc6" />
            <path d="M134 80c20-10 26-28 24-44-20 8-28 24-24 44Z" fill="#eadfc6" />
            <path d="M120 118c20-8 30-24 30-40-20 6-32 22-30 40Z" fill="#eadfc6" />
          </g>
        </svg>

        <div className="lg-card">
          <div className="lg-card-brand">
            <Crown size={40} />
            <b>Young Achievers</b>
            <i>Small steps. Big dreams.</i>
          </div>
          <h2>Parent Login</h2>
          <p className="lg-sub">Welcome back! Please enter your details to continue.</p>
          <LoginForm />
          <p className="lg-safe">
            <ShieldIcon width={18} height={18} />
            <span>
              Your child&apos;s details stay private. Contact details and addresses are never shown on a page.
            </span>
          </p>
          <div className="lg-help">
            <span className="lg-help-ico">
              <KeyIcon width={22} height={22} />
            </span>
            <div>
              <b>Need a login or forgot your password?</b>
              <span>Logins are created and reset by the administrator. Administrators sign in here too.</span>
            </div>
          </div>
        </div>

        <p className="lg-quote-m">
          &ldquo;Every great achievement begins with a parent who believes.&rdquo;
        </p>
      </section>
    </main>
  );
}
