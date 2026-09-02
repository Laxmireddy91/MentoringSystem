import mongoose from "mongoose";
const schema=new mongoose.Schema({title:{type:String,required:true},date:{type:String,required:true},time:String,owner:String,status:{type:String,default:"Scheduled"},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"}},{timestamps:true});
export default mongoose.model("Session",schema);