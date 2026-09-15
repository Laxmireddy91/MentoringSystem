import React,{useEffect,useState} from "react";
import {useNavigate,useSearchParams} from "react-router-dom";
import api from "../api";
export default function VerifyEmail(){const [params]=useSearchParams();const [msg,setMsg]=useState("Verifying...");const navigate=useNavigate();useEffect(()=>{api.auth.verifyEmail(params.get("token")).then(r=>{setMsg(r.message);setTimeout(()=>navigate("/login"),1200)}).catch(e=>setMsg(e.message))},[]);return <div className="auth-page"><div className="auth-card"><h1>Email Verification</h1><p>{msg}</p></div></div>}
