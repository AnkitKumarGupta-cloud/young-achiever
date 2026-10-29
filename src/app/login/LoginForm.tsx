'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { login } from './actions';
import { ArrowIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '@/components/icons';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="lg-submit" disabled={pending}>
      {pending ? 'Logging in…' : 'Log in'}
      {!pending && <ArrowIcon width={20} height={20} />}
    </button>
  );
}

export default function LoginForm() {
  const [state, action] = useFormState(login, undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="lg-form">
      <div className="lg-field">
        <label htmlFor="username" className="sr-only">
          Username
        </label>
        <UserIcon className="lg-ico" />
        <input
          id="username"
          name="username"
          type="text"
          placeholder="Username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </div>
      <div className="lg-field">
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <LockIcon className="lg-ico" />
        <input
          id="password"
          name="password"
          type={show ? 'text' : 'password'}
          placeholder="Password"
          autoComplete="current-password"
          required
        />
        <button
          type="button"
          className="lg-eye"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
        >
          {show ? <EyeOffIcon width={20} height={20} /> : <EyeIcon width={20} height={20} />}
        </button>
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
