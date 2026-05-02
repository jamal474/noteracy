import { ExternalLink } from 'lucide-react';
import * as Separator from '@radix-ui/react-separator';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="flex items-center justify-end gap-4 px-4 sm:px-6 h-12 text-xs text-[var(--color-muted)] border-t border-[var(--color-border)]">
      <span>&copy; {currentYear} Noteracy</span>
      <Separator.Root orientation="vertical" className="w-px h-3 bg-[var(--color-border)]" />
      <a
        href="https://github.com/jamal474/NoteracyApp"
        className="flex items-center gap-1 hover:text-[var(--color-fg)] transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink size={12} /> GitHub
      </a>
      <a
        href="https://www.linkedin.com/in/md-shabbir-jamal-0620781a0/"
        className="flex items-center gap-1 hover:text-[var(--color-fg)] transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink size={12} /> LinkedIn
      </a>
    </footer>
  );
};

export default Footer;