import React, { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        user: null,
        token: "",
    });

    //default axios
    useEffect(() => {
        if (auth?.token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${auth?.token}`;
        } else {
            delete axios.defaults.headers.common["Authorization"];
        }
    }, [auth?.token]); // Set axios authorization header when token changes

    const logout = () => {
        setAuth((prev) => ({
            ...prev,
            user: null,
            token: "",
        }));
        localStorage.removeItem("auth");
        delete axios.defaults.headers.common["Authorization"];
    };

    useEffect(() => {
       const data = localStorage.getItem("auth");
       if (data) {
            try {
                const parseData = JSON.parse(data);
                setAuth({
                    user: parseData.user,
                    token: parseData.token,
                });
            } catch (error) {
                localStorage.removeItem("auth");
            }
       }
       //eslint-disable-next-line
    }, []);
    return (
        <AuthContext.Provider value={[auth, setAuth, logout]}>
            {children}
        </AuthContext.Provider>
    );
};

// custom hook
const useAuth = () => useContext(AuthContext);

export {useAuth, AuthProvider};