import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import CustomAlert from './CustomAlert';
import { ChevronRight } from 'lucide-react';

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  body: z.string().min(1, 'Body is required'),
});

const ViewNoteBody = ({ id, title, body }) => {
  const [showAlert, setShowAlert] = React.useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(noteSchema),
    defaultValues: { title, body },
  });

  const onSubmit = async (data) => {
    try {
      const response = await fetch(`/api/v1/dashboard/item/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (response.ok) setShowAlert(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[var(--color-muted)] mb-6">
        <Link to="/dashboard" className="hover:text-[var(--color-accent)] transition-colors">
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <span className="text-[var(--color-fg)] truncate max-w-[200px]">{title}</span>
      </nav>

      {/* Title bar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Edit note</h2>
      </div>

      {/* Editor form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <input
            type="text"
            {...register('title')}
            placeholder="Note title"
            className="w-full text-2xl font-medium bg-transparent border-none outline-none placeholder:text-[var(--color-muted)] py-2"
          />
          {errors.title && (
            <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.title.message}</p>
          )}
        </div>
        <div>
          <textarea
            {...register('body')}
            placeholder="Start writing…"
            rows={16}
            className="w-full text-base leading-relaxed bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] p-4 outline-none resize-y placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
          />
          {errors.body && (
            <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.body.message}</p>
          )}
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-[var(--radius)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      {showAlert && <CustomAlert message="Note updated" onClose={() => setShowAlert(false)} />}
    </div>
  );
};

export default ViewNoteBody;