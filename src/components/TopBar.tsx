import Link from 'next/link';
import { logout } from '@/app/login/actions';
import { Logo } from '@/components/icons';

export default function TopBar({ username, admin }: { username: string; admin?: boolean }) {
  return (
    <header className="nav">
      <div className="nav-in">
        <Link href={admin ? '/admin' : '/parent'} className="brand-lockup">
          <Logo size={30} />
          <span>Young Achievers</span>
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
