import { Loader2 } from 'lucide-react';

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
      <p className="text-sm text-[var(--color-muted)]">Loading…</p>
    </div>
  );
};

export default Loading;