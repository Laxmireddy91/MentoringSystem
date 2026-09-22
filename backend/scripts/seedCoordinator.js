import 'dotenv/config';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

async function seed() {
  await connectDB();
  const email = 'coordinator@mentorconnect.edu';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Coordinator account already exists:', email);
    process.exit(0);
  }
  const password = await bcryptjs.hash('Coord@1234', 10);
  const user = await User.create({
    name: 'Mentoring Coordinator',
    email,
    password,
    role: 'mentoring_coordinator',
    department: 'Computer Science & Engineering',
    active: true,
  });
  console.log('Coordinator created:', user.email);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
