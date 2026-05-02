import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import CustomAlert from './CustomAlert';
import { Trash2 } from 'lucide-react';

function ModalDelete({ title, id, show, onClose }) {
  const [showAlert, setShowAlert] = React.useState(false);
  const navigate = useNavigate();

  const truncatedTitle = title.length > 25 ? title.substring(0, 25) + '…' : title;

  const handleNoteDelete = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/v1/dashboard/item-delete/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.deletedCount === 1) {
        setShowAlert(true);
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <AlertDialog.Root open={show} onOpenChange={(open) => !open && onClose()}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-float p-6 focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 size={20} className="text-[var(--color-destructive)]" />
              </div>
              <AlertDialog.Title className="text-base font-semibold">
                Delete note
              </AlertDialog.Title>
            </div>
            <AlertDialog.Description className="text-sm text-[var(--color-muted)] mb-6">
              This will permanently delete <strong className="text-[var(--color-fg)]">"{truncatedTitle}"</strong>. This action cannot be undone.
            </AlertDialog.Description>
            <div className="flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm font-medium rounded-[var(--radius)] border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] transition-colors"
                >
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleNoteDelete}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-destructive)] rounded-[var(--radius)] hover:opacity-90 transition-opacity"
                >
                  Delete
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      {showAlert && (
        <CustomAlert message="Note deleted" onClose={() => setShowAlert(false)} />
      )}
    </>
  );
}

export default ModalDelete;
