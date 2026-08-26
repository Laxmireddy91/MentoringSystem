import "dotenv/config";
import bcrypt from "bcryptjs";
import {connectDB} from "../config/db.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import Attendance from "../models/Attendance.js";
import Session from "../models/Session.js";
import Notification from "../models/Notification.js";
import Task from "../models/Task.js";
import Report from "../models/Report.js";

const students=[
["1MS22CS001","Aarav Sharma","Computer Science & Engineering","3rd Year","Dr. Rajesh Kumar",91,80,0],
["1MS22CS002","Ananya Rao","Computer Science & Engineering","3rd Year","Prof. Priya Sharma",88,71,1],
["1MS23IS003","Rohan Patel","Information Science","2nd Year","Dr. Amit Patel",94,86,0],
["1MS21EC004","Meera Nair","Electronics & Communication","4th Year","Prof. Sneha Reddy",79,68,2],
["1MS22CS005","Vikram Singh","Computer Science & Engineering","3rd Year","Dr. Vikram Singh",73,61,3]
];
await connectDB(); await Promise.all([User.deleteMany({}),Student.deleteMany({}),Mentor.deleteMany({}),Attendance.deleteMany({}),Session.deleteMany({}),Notification.deleteMany({}),Task.deleteMany({}),Report.deleteMany({})]);
const pwd=await bcrypt.hash("Password@123",12);
const accounts=[
["Aarav Sharma","aarav@student.edu","student","1MS22CS001"],["Dr. Rajesh Kumar","rajesh@mentorconnect.edu","mentor",""],["Dr. Meena Joshi","hod@mentorconnect.edu","hod",""],["Dr. Anil Verma","principal@mentorconnect.edu","principal",""]
];
const users={}; for(const [name,email,role,usn] of accounts) users[role]=await User.create({name,email,password:pwd,role,usn,department:role==="principal"?"Institution Administration":"Computer Science & Engineering",designation:role});
for(const [usn,name,dept,year,mentor,attendance,total,backlog] of students) await Student.create({usn,name,dept,year,mentor,attendance,total,backlog,cie1:80,cie2:78,cie3:82,final:80,set:75,grade:total>=80?"A":total>=70?"B+":"C",subjects:[],user:usn==="1MS22CS001"?users.student._id:undefined});
for(const [id,name] of [["M001","Dr. Rajesh Kumar"],["M002","Prof. Priya Sharma"],["M003","Dr. Amit Patel"],["M004","Prof. Sneha Reddy"],["M005","Dr. Vikram Singh"]]) await Mentor.create({mentorId:id,name,students:20,performance:8.2,status:id==="M005"?"Inactive":"Active",lastActive:"2026-08-20",email:name.toLowerCase().replaceAll(" ",".")+"@mentorconnect.edu"});
const ss=await Student.find().limit(5); for(let i=0;i<ss.length;i++) await Attendance.create({date:"2026-08-18",student:ss[i]._id,course:i<3?"Web Development":"Data Structures",present:i!==1&&i!==4,markedBy:users.mentor._id});
await Session.insertMany([{title:"Monthly Mentor Review",date:"2026-08-22",time:"10:30",owner:"Dr. Rajesh Kumar"},{title:"Student Progress Follow-up",date:"2026-08-24",time:"14:00",owner:"Prof. Priya Sharma"},{title:"Department Academic Meeting",date:"2026-08-28",time:"11:00",owner:"HOD Office"}]);
await Notification.insertMany([{title:"Performance review window is open",text:"Update CIE and final marks before the monthly review.",type:"Academic"},{title:"Attendance exception detected",text:"Two students are below the department attendance threshold.",type:"Alert"},{title:"Mentoring report submitted",text:"Prof. Priya Sharma submitted the August mentoring report.",type:"Report",read:true}]);
await Task.insertMany([{title:"Review pending performance records",due:"2026-08-20",owner:"Mentor",priority:"High"},{title:"Complete monthly mentoring report",due:"2026-08-25",owner:"Mentor",priority:"Medium"},{title:"Verify attendance exceptions",due:"2026-08-19",owner:"HOD",priority:"High",done:true}]);
await Report.insertMany([{title:"Department Performance Report",category:"Academic",date:"2026-08-18",owner:"HOD",status:"Ready"},{title:"Attendance Overview",category:"Attendance",date:"2026-08-17",owner:"Mentor Office",status:"Ready"},{title:"At-Risk Student Report",category:"Student Support",date:"2026-08-15",owner:"Mentor Office",status:"Review"}]);
console.log("Seed complete. Demo password: Password@123"); process.exit(0);