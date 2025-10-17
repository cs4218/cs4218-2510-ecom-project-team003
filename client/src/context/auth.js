import React, { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [auth, _setAuth] = useState({
    user: null,
    token: "",
  });

  const setAuth = (value) => {
    _setAuth(value);

    axios.defaults.headers.common["Authorization"] = value?.token;
    localStorage.setItem("auth", JSON.stringify(value));
  }

  const logout = () => {
    _setAuth({ user: null, token: "" });
    delete axios.defaults.headers.common["Authorization"];
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
  }, []);

  return (
    <AuthContext.Provider value={[auth, setAuth, logout]}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

export { useAuth, AuthProvider };