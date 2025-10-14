import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/v1/check-auth-status')
            .then(res => {
                if (res.ok) {
                    console.log("returning res");
                    return res.json();
                }
                return null; 
            })
            .then(data => {
                setUser(data);
                console.log(user);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to check auth status:", err);
                setUser(null);
                setIsLoading(false);
            });
    }, []);

    const value = {
        user,
        isLoading
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
}