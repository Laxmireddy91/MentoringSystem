import mongoose from "mongoose";
const schema=new mongoose.Schema({title:{type:String,required:true},due:String,owner:String,priority:{type:String,default:"Medium"},done:{type:Boolean,default:false},user:{type:mongoose.Schema.Types.ObjectId,ref:"User"}},{timestamps:true});
export default mongoose.model("Task",schema);