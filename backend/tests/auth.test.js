import request from "supertest";
import express from "express";
import { loginSchema, registerSchema, messageSchema } from "../validation.js";

const app=express();
app.use(express.json());
app.post("/api/auth/login",(req,res)=>res.status(401).json({success:false,message:"Invalid email or password"}));

describe("security validation",()=>{
  test("login rejects invalid credentials",async()=>{
    const res=await request(app).post("/api/auth/login").send({email:"x@example.com",password:"bad",role:"student"});
    expect(res.status).toBe(401); expect(res.body.success).toBe(false);
  });
  test("strong registration password is required",()=>{
    const {error}=registerSchema.validate({name:"Test User",email:"test@example.com",password:"weak",role:"student",usn:"1XX23CS001"});
    expect(error).toBeTruthy();
  });
  test("valid registration payload passes schema",()=>{
    const {error}=registerSchema.validate({name:"Test User",email:"test@example.com",password:"Strong@123",role:"student",usn:"1XX23CS001"});
    expect(error).toBeUndefined();
  });
  test("message schema rejects oversized message",()=>{
    const {error}=messageSchema.validate({receiver:"507f1f77bcf86cd799439011",message:"x".repeat(2001)});
    expect(error).toBeTruthy();
  });
});
