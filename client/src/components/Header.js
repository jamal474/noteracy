import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user } = useAuth();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';

  return (
    <header className="sticky top-0 z-50 flex items-center h-14 px-4 sm:px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md">
      <Link to={user ? '/dashboard' : '/'} className="text-lg font-bold tracking-tight mr-auto hover:text-[var(--color-accent)] transition-colors">
        Noteracy
      </Link>

      <div className="flex items-center gap-2">
        {user ? (
          <Link
            to="/dashboard"
            className="px-4 py-1.5 text-sm font-medium bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-[var(--radius)] hover:opacity-90 transition-opacity"
          >
            Go to dashboard
          </Link>
        ) : (
          <>
            <a
              href={`${apiBaseUrl}/auth/google`}
              className="px-3 py-1.5 text-sm font-medium rounded-[var(--radius)] text-[var(--color-fg)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Sign in
            </a>
            <a
              href={`${apiBaseUrl}/auth/google`}
              className="px-3 py-1.5 text-sm font-medium bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-[var(--radius)] hover:opacity-90 transition-opacity"
            >
              Get started
            </a>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;