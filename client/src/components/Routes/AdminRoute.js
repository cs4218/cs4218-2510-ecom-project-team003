import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import axios from 'axios';
import Spinner from "../Spinner";

export default function AdminRoute() {
  const [ok, setOk] = useState(false)
  const [auth, setAuth, logout] = useAuth()

  useEffect(() => {
    const authCheck = async () => {
      try {
        const res = await axios.get("/api/v1/auth/admin-auth");
        if (res.data.ok) {
          setOk(true);
        } else {
          setOk(false);
        }
      } catch (error) {
        console.log(error);
        setOk(false);
      }
    };
    if (auth?.token) authCheck();
  }, [auth?.token]);

  return ok ? <Outlet /> : <Spinner onTimeout={() => {
    logout();
    toast.success("You have been logged out", { duration: 5000 });
  }} />;
}