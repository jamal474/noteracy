import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

const SearchRes = ({ id, title }) => {
  return (
    <Link
      to={`/dashboard/viewNote/${id}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] hover:bg-[var(--color-surface-raised)] transition-colors group"
    >
      <FileText size={16} className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)] shrink-0" />
      <span className="text-sm font-medium truncate group-hover:text-[var(--color-accent)] transition-colors">
        {title}
      </span>
    </Link>
  );
};

export default SearchRes;