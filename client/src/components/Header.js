import '../styles/Header.css'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const { user } = useAuth();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  
  const handleSearch = (e) => {
    navigate(`/dashboard/search/${query}`);
  }

  return (
    <div className="header">
      <h1 className="logo"><Link to="/">Noteracy</Link></h1>
      {user ? (
                    <>
                        <div className="search-bar">
                          <form role="search" onSubmit={handleSearch}>
                            <input className="search-input" type="search" name="searchTerm" value={query} onChange={(e) => { setQuery(e.target.value)}} placeholder="Search..." aria-label="Search" required />
                          </form>
                        </div>

                        <ul className = "ProfileDropdown">
                          <li>
                            <img className = "ProfileImage"  src = {user.profileImage}/>
                            <ul className = "dropdown">
                                <li><a href={`${apiBaseUrl}/logout`} className="logout">Log Out</a></li>
                            </ul>
                          </li>
                        </ul>
                    </>

                ) : (
                    <div className="sign-actions">
                      <a href={`${apiBaseUrl}/auth/google`} type="button" className="signup">Sign Up</a>
                      <a href={`${apiBaseUrl}/auth/google`} type="button" className="signin">Sign In</a>
                    </div>
                )}
    </div>
  )
}

export default Header;