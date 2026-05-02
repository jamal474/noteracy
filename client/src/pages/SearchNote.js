import React, { useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import SearchRes from '../components/SearchRes';
import SEO from '../components/SEO';
import Loading from '../components/Loading';
import { SearchX, ChevronRight } from 'lucide-react';

const SearchNote = () => {
  const { query } = useParams();
  const [results, setResults] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasSearched, setHasSearched] = React.useState(false);

  const fetchResults = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/dashboard/search/${query}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      if (data?.notes) {
        setResults(data.notes);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  }, [query]);

  React.useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const content = useMemo(() => {
    if (results.length === 0 && hasSearched) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-surface-raised)]">
            <SearchX size={24} className="text-[var(--color-muted)]" />
          </div>
          <h2 className="text-lg font-semibold">No results found</h2>
          <p className="text-sm text-[var(--color-muted)]">
            No notes match "<strong>{query}</strong>". Try a different search term.
          </p>
          <Link
            to="/dashboard"
            className="px-4 py-2 text-sm font-medium bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-[var(--radius)] hover:opacity-90 transition-opacity"
          >
            Back to dashboard
          </Link>
        </div>
      );
    }
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] divide-y divide-[var(--color-border)]">
        {results.map((note) => (
          <SearchRes key={note._id} id={note._id} title={note.title} />
        ))}
      </div>
    );
  }, [results, hasSearched, query]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SEO
        title="Search Notes — Noteracy"
        description="Find your notes instantly."
        name="@lamajribbahs"
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[var(--color-muted)]">
        <Link to="/dashboard" className="hover:text-[var(--color-accent)] transition-colors">
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <span className="text-[var(--color-fg)]">Search</span>
      </nav>

      <h2 className="text-xl font-semibold">
        Results for "<span className="text-[var(--color-accent)]">{query}</span>"
      </h2>

      {isLoading ? <Loading /> : content}
    </div>
  );
};

export default SearchNote;