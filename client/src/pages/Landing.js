import React from 'react';
import SEO from '../components/SEO';
import { ArrowRight, StickyNote, Zap, Lock } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Landing = () => {
  const { user } = useAuth();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <SEO
        title="Noteracy — Your Personal Note-Taking Tool"
        description="Write your thoughts as they come to you. A versatile, modern note-taking solution."
        name="@lamajribbahs"
      />

      <div className="max-w-2xl space-y-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Write your thoughts
          <br />
          <span className="text-[var(--color-accent)]">as they come to you</span>
        </h1>
        <p className="text-lg text-[var(--color-muted)] max-w-md mx-auto">
          A beautifully simple workspace for capturing, organizing, and finding your ideas.
        </p>
        
        {user ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-[var(--radius)] hover:opacity-90 transition-opacity group"
          >
            Go to dashboard
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <a
            href={`${apiBaseUrl}/auth/google`}
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-[var(--radius)] hover:opacity-90 transition-opacity group"
          >
            Get started free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
        )}
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 max-w-3xl w-full">
        {[
          { icon: StickyNote, label: 'Create & Edit', desc: 'Write notes with a clean, distraction-free editor' },
          { icon: Zap, label: 'Instant Search', desc: 'Find any note in milliseconds with full-text search' },
          { icon: Lock, label: 'Private & Secure', desc: 'Sign in with Google, your data stays yours' },
        ].map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-3 p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] text-center"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-raised)]">
              <Icon size={20} className="text-[var(--color-accent)]" />
            </div>
            <h3 className="text-sm font-semibold">{label}</h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Landing;