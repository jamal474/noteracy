import React from 'react'
import '../styles/Landing.css'
import SEO from '../components/SEO'

const Landing = () => {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    return (
        <div className="Landing">
            <SEO
                title=" Noteracy - Your Personal Note-Taking and Organization Tool"
                description="Noteracy: Your connected workspace for taking, managing, and organizing notes. Write your thoughts as they come to you, create, update, delete, and search notes effortlessly. A versatile note-taking solution for all your ideas and tasks"
                name="@lamajribbahs"
                image="../assets/icons/icon96.ico" />
            <div className="Landing-body">
                <h1 className = "bd-1">write your thoughts as they come to you</h1>
                <p className = "bd-2">Noteracy is simple to use</p>
                <a href={`${apiBaseUrl}/auth/google`} className = "signin">Try Noteracy, its Free</a>
            </div>
        </div>
    )
}

export default Landing