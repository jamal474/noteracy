import React, { useCallback, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Search, LogOut, Plus, FileText, LayoutDashboard, MoreHorizontal, Trash2, Edit2, Check, X } from 'lucide-react';
import Loading from './Loading';
import ModalDelete from './ModalDelete';

const Sidebar = ({ onOpenSearch }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';

  const [notes, setNotes] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Rename state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Delete modal state
  const [deletingNote, setDeletingNote] = useState(null); // { id, title }

  const fetchNotes = useCallback(async (pageNum = 1) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      const res = await fetch(`/api/v1/dashboard?page=${pageNum}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.notes) {
        if (pageNum === 1) {
          setNotes(data.notes);
        } else {
          setNotes(prev => [...prev, ...data.notes]);
        }
        setHasMore(pageNum < data.pages);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotes(page);
  }, [page, fetchNotes]);

  const loadMore = () => setPage(p => p + 1);

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutText = isMac ? '⌘K' : 'Ctrl K';

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/dashboard/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: 'Untitled Note', body: '<p></p>' }),
      });
      if (response.ok) {
        const newNote = await response.json();
        // Insert at the top of the list and navigate
        setNotes([newNote, ...notes]);
        navigate(`/dashboard/viewNote/${newNote._id}`);
      }
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleRenameSubmit = async (e, id, originalBody) => {
    e.preventDefault();
    if (!editTitle.trim()) return setEditingId(null);
    try {
      const response = await fetch(`/api/v1/dashboard/item/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, body: originalBody }), // backend requires body
        credentials: 'include',
      });
      if (response.ok) {
        setNotes(notes.map(n => n._id === id ? { ...n, title: editTitle } : n));
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <aside className="w-72 h-full flex flex-col bg-[var(--color-bg)] border-r border-[var(--color-border)] relative">
      {/* User Profile Dropdown */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center w-full gap-3 p-2 rounded-[var(--radius)] hover:bg-[var(--color-surface-raised)] transition-colors outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
              <img
                className="w-8 h-8 rounded-full object-cover"
                src={user.profileImage}
                alt={user.displayName}
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-semibold truncate text-[var(--color-fg)]">{user.displayName}</p>
                <p className="text-xs text-[var(--color-muted)] truncate">My Workspace</p>
              </div>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="w-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] p-1 shadow-float z-50"
              sideOffset={8}
              align="start"
            >
              <DropdownMenu.Label className="px-2 py-1.5 text-xs text-[var(--color-muted)] font-medium">
                {user.displayName}
              </DropdownMenu.Label>
              <DropdownMenu.Separator className="h-px bg-[var(--color-border)] my-1" />
              <DropdownMenu.Item asChild>
                <a
                  href={`${apiBaseUrl}/logout`}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-inner outline-none cursor-pointer transition-colors text-[var(--color-destructive)] hover:bg-[var(--color-surface-raised)] focus:bg-[var(--color-surface-raised)]"
                >
                  <LogOut size={16} />
                  Log out
                </a>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Navigation */}
      <div className="p-3 space-y-1">
        <button
          onClick={onOpenSearch}
          className="flex items-center justify-between w-full px-3 py-2 text-sm text-[var(--color-muted)] rounded-[var(--radius)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-fg)] transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Search size={16} className="group-hover:text-[var(--color-accent)] transition-colors" />
            Search notes
          </div>
          <span className="text-[10px] font-mono border border-[var(--color-border)] px-1.5 py-0.5 rounded opacity-60">
            {shortcutText}
          </span>
        </button>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-muted)] rounded-[var(--radius)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-fg)] transition-colors"
        >
          <LayoutDashboard size={16} />
          Dashboard
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 relative pb-20">
        <h3 className="px-3 mb-2 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
          Notes
        </h3>
        
        {isLoading ? (
          <div className="py-4"><Loading /></div>
        ) : notes.length === 0 ? (
          <p className="px-3 py-2 text-sm text-[var(--color-muted)]">No notes yet.</p>
        ) : (
          <div className="space-y-0.5">
            {notes.map(note => (
              <div key={note._id} className="relative group">
                {editingId === note._id ? (
                  <form 
                    onSubmit={(e) => handleRenameSubmit(e, note._id, note.body)}
                    className="flex items-center gap-1 px-3 py-2 rounded-[var(--radius)] bg-[var(--color-surface-raised)]"
                  >
                    <FileText size={14} className="shrink-0 opacity-70" />
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm font-medium text-[var(--color-fg)] min-w-0"
                      onBlur={() => setEditingId(null)}
                    />
                  </form>
                ) : (
                  <NavLink
                    to={`/dashboard/viewNote/${note._id}`}
                    className={({ isActive }) => 
                      `flex items-center justify-between px-3 py-2 rounded-[var(--radius)] transition-colors ${
                        isActive 
                          ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)]' 
                          : 'text-[var(--color-fg)] hover:bg-[var(--color-surface-raised)]'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <FileText size={14} className="shrink-0 opacity-70" />
                      <span className="text-sm font-medium truncate">{note.title}</span>
                    </div>

                    {/* Actions Menu */}
                    <div className="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" onClick={e => e.preventDefault()}>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="p-1 rounded-md hover:bg-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-fg)] outline-none">
                            <MoreHorizontal size={14} />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="min-w-[120px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] p-1 shadow-float z-50"
                            sideOffset={4}
                            align="end"
                          >
                            <DropdownMenu.Item
                              onSelect={() => {
                                setEditTitle(note.title);
                                setEditingId(note._id);
                              }}
                              className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-inner cursor-pointer hover:bg-[var(--color-surface-raised)] outline-none"
                            >
                              <Edit2 size={12} /> Rename
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onSelect={() => setDeletingNote({ id: note._id, title: note.title })}
                              className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-inner cursor-pointer hover:bg-[var(--color-surface-raised)] text-[var(--color-destructive)] outline-none"
                            >
                              <Trash2 size={12} /> Delete
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  </NavLink>
                )}
              </div>
            ))}
            
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full mt-2 py-2 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors text-center"
              >
                {isLoadingMore ? 'Loading...' : 'Load more notes...'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Note Button pinned to bottom */}
      <div className="absolute bottom-0 w-72 p-4 bg-[var(--color-bg)] border-t border-[var(--color-border)]">
        <button
          onClick={handleCreateNote}
          className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-[var(--radius)] hover:opacity-90 transition-opacity shadow-lg"
        >
          <Plus size={16} />
          New Note
        </button>
      </div>

      {/* Delete Modal rendered at Sidebar level to avoid z-index issues */}
      <ModalDelete 
        show={!!deletingNote} 
        id={deletingNote?.id} 
        title={deletingNote?.title || ''} 
        onClose={() => {
          setDeletingNote(null);
          // Refresh list if we just deleted
          setPage(1);
          fetchNotes(1);
        }} 
      />
    </aside>
  );
};

export default Sidebar;
