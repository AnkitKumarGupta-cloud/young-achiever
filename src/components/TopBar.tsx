import Link from 'next/link';
import { logout } from '@/app/login/actions';

export default function TopBar({ username, admin }: { username: string; admin?: boolean }) {
  return (
    <header className="nav">
      <div className="nav-in">
        <Link href={admin ? '/admin' : '/parent'} className="brand">
          <span className="mark" />
          Young Achievers
          {admin && <span className="tag">Admin</span>}
        </Link>
        <form action={logout} className="nav-user">
          <span className="muted">{username}</span>
          <button className="btn-sm">Log out</button>
        </form>
      </div>
    </header>
  );
}
