import './App.css';
import React from 'react';
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Unauth from './components/Unauth';
import ViewNote from './pages/ViewNote';
import AddNote from './pages/AddNote';
import SearchNote from './pages/SearchNote';
import Header from './components/Header';
import Footer from './components/Footer';
import DashboardLayout from './components/DashboardLayout';
import * as Toast from '@radix-ui/react-toast';

// A wrapper for marketing/unauth pages
const PublicLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
    <Header />
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {children}
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <Toast.Provider swipeDirection="right">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
          
          {/* Authenticated Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/viewNote/:nId" element={<ViewNote />} />
              <Route path="/dashboard/addNote" element={<AddNote />} />
              <Route path="/dashboard/search/:query" element={<SearchNote />} />
            </Route>
          </Route>

          <Route path="/unauthorized" element={<PublicLayout><Unauth /></PublicLayout>} />
        </Routes>
      </AuthProvider>
      <Toast.Viewport className="fixed bottom-0 right-0 flex flex-col gap-2 p-6 w-[360px] max-w-[100vw] z-[2147483647] outline-none" />
    </Toast.Provider>
  );
}

export default App;
