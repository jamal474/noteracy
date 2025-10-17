import React from 'react'
import '../styles/ViewNote.css'
import ViewNoteBody from '../components/ViewNoteBody'
import Loading from '../components/Loading.js'
import { useParams } from 'react-router-dom';
import SEO from '../components/SEO'

const ViewNote = () => {
    const { nId } = useParams();
    const [bd,setBd] = React.useState();
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        try {
            fetch(`/api/v1/dashboard/item/${nId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            })
                .then(res => res.json())
                .then(data => {
                    const noteEle = <ViewNoteBody
                    key = {data.note._id}
                    id={data.note._id}
                    title={data.note.title}
                    body={data.note.body}
                    />
                    setBd(noteEle);
                })
                .finally(() => {
                setIsLoading(false);
                });
        }
        catch (error) {
            console.log(error);
            setIsLoading(false);
        }
    }, [nId] )
  return (
    <div className = "ViewNote">
        <SEO
                title="View Note - Noteracy"
                description="Noteracy: Your connected workspace for taking, managing, and organizing notes. Write your thoughts as they come to you, create, update, delete, and search notes effortlessly. A versatile note-taking solution for all your ideas and tasks"
                name="@lamajribbahs"
                image="../assets/icons/icon96.ico" />
        {isLoading ? (
                <Loading />
            ) : (
                bd
        )}
    </div>
  )
}

export default ViewNote;