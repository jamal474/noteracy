import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ModalDelete.css'
import CustomAlert from './CustomAlert';


function ModalDelete(props) {
    const [showAlert, setShowAlert] = React.useState(false);
    const navigate = useNavigate();
    let dotdotdot = "";
    if (!props.show) {
        return null;
    }
    if(props.title.length > 25)
    {
        dotdotdot = ". . ."
    }

    const handleNoteDelete = async (e) => {
        e.preventDefault();
        try {
            await fetch(`/api/v1/dashboard/item-delete/${props.id}?_method=DELETE`, {
                method: "POST",
                credentials: "include"
            })
                .then((response) => response.json())
                .then((data) => {
                    
                    if(data.deletedCount === 1)
                    {
                        setShowAlert(true);
                        setTimeout(() => navigate(`/dashboard`), 1000);
                    }
                    else
                    {
                        console.log("Error in deletion; deleteCount return != 1");
                    }
                    
                });

        } catch (err) {
            console.log(err);
        }
    }

    return (
        <div className="modal">
            <div className="modal-content">
                <h5 className="modal-title">You are about to delete a note</h5>
                <p className="modal-body">This will <b><span style={{ color: "red" }}>delete</span></b> your note <b>{props.title.substring(0, 25)} {dotdotdot}</b><br />
                    Are you sure?</p>
                <div className="modal-buttons">
                    <button onClick={props.onClose} className="modal-close">Close</button>
                    <button onClick={handleNoteDelete} className="modal-delete">Delete</button>
                </div>
            </div>
            {showAlert && (
                <CustomAlert
                    message="Note Deleted"
                    onClose={() => setShowAlert(false)}
                />
            )}
        </div>
    );
}

export default ModalDelete;
