'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { resetPassword } from './actions';

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn-sm" disabled={pending}>{pending ? '…' : 'Reset password'}</button>;
}

export default function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, action] = useFormState(resetPassword, undefined);
  return (
    <>
      <form action={action}>
        <input type="hidden" name="userId" value={userId} />
        <input type="text" name="password" placeholder="New password" autoComplete="off" minLength={8} required />
        <Submit />
      </form>
      {state?.error && <span className="muted" style={{ color: 'var(--danger)' }}>{state.error}</span>}
      {state?.ok && <span className="muted" style={{ color: '#1b5a3a' }}>{state.ok}</span>}
    </>
  );
}
