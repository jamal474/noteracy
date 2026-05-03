import React, { useState } from 'react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { StickyNote, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await fetch('/api/v1/dashboard/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: 'Untitled Note', body: '<p></p>' }),
      });
      if (response.ok) {
        const newNote = await response.json();
        navigate(`/dashboard/viewNote/${newNote._id}`);
      }
    } catch (err) {
      console.error('Failed to create note:', err);
    } finally {
      setIsCreating(false);
    }
  };

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

      <button
        onClick={handleCreateNote}
        disabled={isCreating}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-[var(--radius)] hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Plus size={18} />
        {isCreating ? 'Creating...' : 'Create a Note'}
      </button>
    </div>
  );
};

export default Dashboard;