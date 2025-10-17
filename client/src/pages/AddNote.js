import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AddNote.css'
import CustomAlert from '../components/CustomAlert';
import SEO from '../components/SEO'

const AddNote = () => {
    const [title, setTitle] = React.useState("");
    const [body, setBody] = React.useState("");
    const [showAlert, setShowAlert] = React.useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch("/api/v1/dashboard/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: title,
                    body: body
                }),
                credentials: "include"
            })
                .then((response) => response.json())
                .then((data) => {
                    setShowAlert(true);
                    setTimeout(() => navigate(`/dashboard`), 1000);
                });

        } catch (err) {
            console.log(err);
        }
    }
    return (
        <div className="addNote">
            <SEO
                title="Add Note - Noteracy"
                description="Write your thoughts as they come to you, create, update, delete, and search notes effortlessly. A versatile note-taking solution for all your ideas and tasks"
                name="@lamajribbahs"
                image="../assets/icons/icon96.ico" />
            <div className="addNoteBody">
                <div className="breadcrumb">
                    <Link to="/dashboard" className="bc-p1">Dashboard</Link>
                    <div className="bc-sep">/</div>
                    <div className="bc-p2">Add Note</div>
                </div>
                <div className="add-note-title">
                    <h4>View Note</h4>
                </div>
                <form className="add-form" action={`/api/v1/dashboard/add`} method="POST" onSubmit={handleSubmit}>
                    <input className="add-title" type="text" id="title" name="title" value={title} onChange={(e) => { setTitle(e.target.value); }} placeholder="Title" required/>
                    <textarea className="add-body" type="text" id="body" name="body" value={body} onChange={(e) => { setBody(e.target.value);}} placeholder="Take a note..." required/>
                    <button className="add-submit" type="submit" >+ Add Note</button>
                </form>
                {showAlert && (
                    <CustomAlert
                        message="Note Added"
                        onClose={() => setShowAlert(false)}
                    />
                )}
            </div>
        </div>
    )
}

export default AddNote;