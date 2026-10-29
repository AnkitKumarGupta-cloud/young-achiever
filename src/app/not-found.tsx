import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="auth">
      <div className="auth-main">
        <div className="auth-card" style={{ textAlign: 'center', alignItems: 'center' }}>
          <span className="mark" />
          <h1>This page isn&apos;t available</h1>
          <p className="muted">The link may be wrong, or the page may not be public right now.</p>
          <Link className="btn" href="/">
            Go to home
          </Link>
        </div>
      </div>
    </main>
  );
}
