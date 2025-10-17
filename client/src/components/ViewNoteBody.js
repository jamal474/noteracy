import React from 'react'
import { Link,} from 'react-router-dom';
import CustomAlert from './CustomAlert';
import ModalDelete from './ModalDelete';

const ViewNoteBody = (props) => {
    const [title, setTitle] = React.useState(props.title);
    const [body, setBody] = React.useState(props.body);
    const [showAlert, setShowAlert] = React.useState(false);
    let dotdotdot = "";
    if(props.title.length > 40)
    {
        dotdotdot = ". . ."
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch(`/api/v1/dashboard/item/${props.id}?_method=PUT`, {
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
                });

        } catch (err) {
            console.log(err);
        }
    }

    const [showModal, setShowModal] = React.useState(false);
    const openModal = () => {
        setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false);
    };

    return (
        <div className="viewNoteBody">
            <div className="breadcrumb">
                <Link to="/dashboard" className="bc-d">Dashboard</Link>
                <div className="bc-sep">/</div>
                <div className="bc-p2">{props.title.substring(0, 40)} {dotdotdot}</div>
            </div>
            <div className="view-delete">
                <h4>View Note</h4>
                <div className="openDeleteModal" onClick={openModal}>Delete</div>
            </div>
            <form className="update-form" action={`/api/v1/dashboard/item/${props.id}?_method=PUT`} method="POST" onSubmit={handleSubmit}>
                <input className="up-title" type="text" id="title" name="title" value={title} onChange={(e) => { setTitle(e.target.value)}} placeholder="Title"  required/>
                <textarea className="ip-body" type="text" id="body" name="body" value={body} onChange={(e) => { setBody(e.target.value)}} placeholder="Take a note..." required/>
                <button className="up-submit" type="submit" >Update</button>
            </form>
            <ModalDelete
                title = {props.title} 
                id = {props.id} 
                show = {showModal} 
                onClose = {closeModal} />
            {showAlert && (
                <CustomAlert
                    message="Note updated"
                    onClose={() => setShowAlert(false)}
                />
            )}
        </div>
    )
}

export default ViewNoteBody