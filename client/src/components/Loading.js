import React from 'react'
import load from '../assets/images/noteracyLoad.gif'
import "../styles/Loading.css"
const Loading = () => {

    return (
        <div className="loadingScreen">
            <div id="animation-container">
                <img src = {load}/>
            </div>
        </div>
    )
}

export default Loading