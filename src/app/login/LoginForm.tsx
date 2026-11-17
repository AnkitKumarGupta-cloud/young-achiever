'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { login } from './actions';
import { EyeIcon, EyeOffIcon } from '@/components/icons';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn royal lg au-submit" disabled={pending}>
      {pending ? 'Logging in…' : 'Log in'}
    </button>
  );
}

export default function LoginForm() {
  const [state, action] = useFormState(login, undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="au-form">
      <div className="field">
        <label htmlFor="username">Username</label>
        <input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <div className="au-pw">
          <input id="password" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required />
          <button
            type="button"
            className="au-eye"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
          >
            {show ? <EyeOffIcon width={20} height={20} /> : <EyeIcon width={20} height={20} />}
          </button>
        </div>
      </div>
      {state?.error && (
        <p className="error" role="alert" style={{ margin: 0 }}>
          {state.error}
        </p>
      )}
      <Submit />
    </form>
  );
}
