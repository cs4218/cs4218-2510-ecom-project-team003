import React, { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        user: null,
        token: "",
    });

    const didMount = React.useRef(false);

    useEffect(() => {
        try {
            if (auth?.token) {
                axios.defaults.headers.common["Authorization"] = auth.token;
            } else if (!didMount.current) {
                // fallback only during initial mount
                const storedAuth = localStorage.getItem("auth");
                if (!storedAuth) return;
                const parsed = JSON.parse(storedAuth);
                if (parsed?.token) {
                    axios.defaults.headers.common["Authorization"] = parsed.token;
                }
            } else {
                // on logout or loss of auth, clear header
                axios.defaults.headers.common["Authorization"] = "";
            }
        } catch (error) {
            localStorage.removeItem("auth");
            setAuth({ user: null, token: "" });
        }
        didMount.current = true;
    }, [auth?.token]);


    const logout = () => {
        setAuth((prev) => ({
            ...prev,
            user: null,
            token: "",
        }));
        localStorage.removeItem("auth");
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