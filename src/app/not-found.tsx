import Link from 'next/link';
import { Logo } from '@/components/icons';

export default function NotFound() {
  return (
    <main className="simple">
      <div className="simple-card">
        <Logo size={44} />
        <h1>This page isn&apos;t available</h1>
        <p className="muted">The link may be wrong, or the page may not be public right now.</p>
        <Link className="btn royal" href="/">
          Go to the home page
        </Link>
      </div>
    </main>
  );
}
