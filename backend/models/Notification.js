import mongoose from "mongoose";
const schema=new mongoose.Schema({title:String,text:String,type:String,read:{type:Boolean,default:false},user:{type:mongoose.Schema.Types.ObjectId,ref:"User"}},{timestamps:true});
export default mongoose.model("Notification",schema);