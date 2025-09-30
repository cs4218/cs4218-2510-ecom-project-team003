import React from 'react';
import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from 'axios';
import Spinner from "../Spinner";
import Loader from "../Loader";

export default function AdminRoute() {
  const [state, setState] = useState("loading");
  const [auth, setAuth] = useAuth();

  const handleLogout = () => {
    setAuth({
      ...auth,
      user: null,
      token: "",
    });
    localStorage.removeItem("auth");
  };

  useEffect(() => {
    const authCheck = async () => {
      try {
        const res = await axios.get("/api/v1/auth/admin-auth");
        if (res.data?.ok) {
          setState("authorized");
        } else {
          setState("unauthorized");
        }
      } catch (error) {
        console.log(error);
        setState("unauthorized");
      }
    };
    if (auth?.token) {
      authCheck();
    } else {
      setState("unauthorized");
    }
  }, [auth?.token]);

  useEffect(() => {
    if (state === "unauthorized") {
      handleLogout();
    }
  }, [state]);

  switch (state) {
    case "authorized":
      return <Outlet />;
    case "unauthorized":
      return <Spinner />;
    default:
      return <Loader />;
  }
}