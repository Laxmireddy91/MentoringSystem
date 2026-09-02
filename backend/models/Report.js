import mongoose from "mongoose";
const schema=new mongoose.Schema({title:String,category:String,date:String,owner:String,status:String},{timestamps:true});
export default mongoose.model("Report",schema);