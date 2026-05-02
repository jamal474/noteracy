import React from 'react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { StickyNote, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <SEO
        title="Dashboard — Noteracy"
        description="Noteracy: Your connected workspace for managing notes."
        name="@lamajribbahs"
      />

      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-surface-raised)]">
        <StickyNote size={32} className="text-[var(--color-accent)]" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.displayName?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-[var(--color-muted)] max-w-md mx-auto">
          Select a note from the sidebar to start writing, or create a new one.
        </p>
      </div>

      <Link
        to="/dashboard/addNote"
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-[var(--radius)] hover:opacity-90 transition-opacity"
      >
        <Plus size={18} />
        Create a Note
      </Link>
    </div>
  );
};

export default Dashboard;