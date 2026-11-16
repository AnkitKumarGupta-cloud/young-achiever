'use client';

import { useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createParent } from './actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="primary" disabled={pending}>
      {pending ? 'Creating…' : 'Create parent login'}
    </button>
  );
}

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export default function CreateParentForm() {
  const [state, action] = useFormState(createParent, undefined);
  const pw = useRef<HTMLInputElement>(null);
  return (
    <form action={action} className="card">
      <div className="card-h">
        <h2>Create a parent login</h2>
      </div>
      <div className="grid g-create">
        <div className="field">
          <label htmlFor="child">Child&apos;s full name</label>
          <input id="child" name="child" type="text" required />
        </div>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" autoCapitalize="none" required />
        </div>
        <div className="field">
          <label htmlFor="fide_id">FIDE ID (optional)</label>
          <input id="fide_id" name="fide_id" type="text" inputMode="numeric" placeholder="Ratings sync automatically" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="text" ref={pw} autoComplete="off" required minLength={8} />
        </div>
        <div className="field fixed">
          <button type="button" onClick={() => pw.current && (pw.current.value = generatePassword())}>
            Generate
          </button>
        </div>
      </div>
      <p className="muted" style={{ margin: '12px 0 14px' }}>
        Copy the password before submitting; it can&apos;t be shown again (you can only reset it).
      </p>
      {state?.error && <p className="error">{state.error}</p>}
      {state?.ok && <p className="ok">{state.ok}</p>}
      <Submit />
    </form>
  );
}
