import './App.css';
import React from 'react';
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard';
import Unauth from './components/Unauth';
import ViewNote from './pages/ViewNote';
import AddNote from './pages/AddNote'
import SearchNote from './pages/SearchNote'
import Header from './components/Header'
import Footer from './components/Footer'


function App() {
  return (
    <div className = "app-container">
      <AuthProvider>

        <Header/>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Landing/>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/viewNote/:nId" element={<ViewNote />} />
              <Route path="/dashboard/addNote" element={<AddNote />} />
              <Route path="/dashboard/search/:query" element={<SearchNote />} />
            </Route>
            <Route path="/unauthorized" element={<Unauth />} />
          </Routes>
          <Footer/>
        </main>
      </AuthProvider>
    </div>
  );
}

export default App;
