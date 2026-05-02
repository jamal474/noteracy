import React from 'react';
import ViewNoteBody from '../components/ViewNoteBody';
import Loading from '../components/Loading';
import { useParams } from 'react-router-dom';
import SEO from '../components/SEO';

const ViewNote = () => {
  const { nId } = useParams();
  const [noteData, setNoteData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const fetchNote = async () => {
      try {
        const res = await fetch(`/api/v1/dashboard/item/${nId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const data = await res.json();
        if (!cancelled && data.note) {
          setNoteData(data.note);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchNote();
    return () => { cancelled = true; };
  }, [nId]);

  return (
    <div>
      <SEO
        title="View Note — Noteracy"
        description="Edit and manage your note."
        name="@lamajribbahs"
      />
      {isLoading ? (
        <Loading />
      ) : noteData ? (
        <ViewNoteBody
          key={noteData._id}
          id={noteData._id}
          title={noteData.title}
          body={noteData.body}
        />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
          <p className="text-[var(--color-muted)]">Note not found.</p>
        </div>
      )}
    </div>
  );
};

export default ViewNote;