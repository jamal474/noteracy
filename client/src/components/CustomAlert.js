import React, { useState, useEffect } from 'react';
import * as Toast from '@radix-ui/react-toast';
import { CheckCircle2 } from 'lucide-react';

function CustomAlert({ message, onClose }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose && onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Toast.Root
      className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-float px-4 py-3 data-[state=open]:animate-slide-in data-[state=closed]:animate-hide"
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen && onClose) onClose();
      }}
      duration={3000}
    >
      <CheckCircle2 size={16} className="text-[var(--color-success)] shrink-0" />
      <Toast.Description className="text-sm text-[var(--color-fg)]">
        {message}
      </Toast.Description>
    </Toast.Root>
  );
}

export default CustomAlert;
