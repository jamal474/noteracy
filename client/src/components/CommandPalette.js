import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Loader2 } from 'lucide-react';
import '../styles/cmdk.css';

const CommandPalette = ({ open, setOpen }) => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  // Handle keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  // Handle search fetching
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/dashboard/search/${encodeURIComponent(search)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const data = await response.json();
        if (data && data.notes) {
          setResults(data.notes);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] bg-black/40 backdrop-blur-sm transition-all duration-200 p-4"
    >
      <div className="w-full max-w-xl bg-[var(--color-surface)] rounded-xl shadow-2xl overflow-hidden border border-[var(--color-border)] flex flex-col animate-in fade-in zoom-in-95">
        <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)] gap-3">
          <Search size={20} className="text-[var(--color-muted)] shrink-0" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Search notes... (e.g., ideas, meeting, etc.)"
            className="flex-1 bg-transparent border-none outline-none text-[var(--color-fg)] placeholder:text-[var(--color-muted)] text-lg"
          />
          {loading && <Loader2 size={16} className="animate-spin text-[var(--color-muted)]" />}
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          {search.trim() === '' && (
            <div className="p-8 text-center text-[var(--color-muted)] text-sm">
              Type to search through your notes.
            </div>
          )}
          
          {search.trim() !== '' && !loading && results.length === 0 && (
            <Command.Empty className="p-8 text-center text-[var(--color-muted)] text-sm">
              No results found for "{search}".
            </Command.Empty>
          )}

          {results.length > 0 && (
            <Command.Group heading="Notes" className="text-xs font-medium text-[var(--color-muted)] px-2 py-1 uppercase tracking-wider">
              {results.map((note) => (
                <Command.Item
                  key={note._id}
                  value={note.title + ' ' + note.body} // Searchable text
                  onSelect={() => {
                    navigate(`/dashboard/viewNote/${note._id}`);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="flex items-center gap-3 px-3 py-3 mt-1 rounded-[var(--radius)] cursor-pointer aria-selected:bg-[var(--color-accent)] aria-selected:text-[var(--color-accent-fg)] hover:bg-[var(--color-surface-raised)] transition-colors group"
                >
                  <FileText size={16} className="text-[var(--color-muted)] group-aria-selected:text-[var(--color-accent-fg)] shrink-0" />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-sm font-medium truncate">{note.title}</span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
};

export default CommandPalette;
