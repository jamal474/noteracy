import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

const NoteElement = ({ id, title, body }) => {
  return (
    <Link
      to={`/dashboard/viewNote/${id}`}
      className="group flex flex-col p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] hover:border-[var(--color-accent)] hover:shadow-float transition-all"
    >
      <div className="flex items-start gap-2 mb-2">
        <FileText size={16} className="text-[var(--color-accent)] mt-0.5 shrink-0" />
        <h3 className="text-sm font-semibold leading-tight line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
          {title}
        </h3>
      </div>
      <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
        {body}
      </p>
    </Link>
  );
};

export default NoteElement;