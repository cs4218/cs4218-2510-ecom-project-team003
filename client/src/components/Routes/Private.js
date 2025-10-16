import React, { useState,useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from 'axios';
import Spinner from "../Spinner";
import toast from "react-hot-toast";

export default function PrivateRoute(){
    const [ok,setOk] = useState(false);
    const [auth ,logout] = useAuth();

    useEffect(()=> {
        const authCheck = async() => {
            try {
                const res = await axios.get("/api/v1/auth/user-auth");
                if (res.data.ok) {
                    setOk(true);
                } else {
                    setOk(false);
                }
            } catch (error) {
                setOk(false);
            }
        };
        if (auth?.token) {
            authCheck();
        } else {
            setOk(false);
        }
    }, [auth?.token]);

    return ok ? <Outlet /> : <Spinner onTimeout={() => {
        logout();
        toast.success("You have been logged out", { duration: 5000 });
    }} />;
}