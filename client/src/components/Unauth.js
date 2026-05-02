import React from 'react';
import { ShieldAlert } from 'lucide-react';

const Unauth = () => {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-surface-raised)]">
        <ShieldAlert size={24} className="text-[var(--color-accent)]" />
      </div>
      <h2 className="text-2xl font-bold">401 — Unauthorized</h2>
      <p className="text-[var(--color-muted)] max-w-sm">
        You need to be signed in to view this page.
      </p>
      <a
        href={`${apiBaseUrl}/auth/google`}
        className="px-4 py-2 text-sm font-medium bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-[var(--radius)] hover:opacity-90 transition-opacity"
      >
        Sign in with Google
      </a>
    </div>
  );
};

export default Unauth;