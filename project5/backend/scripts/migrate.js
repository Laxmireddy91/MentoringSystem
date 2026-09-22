const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Student, Mentor } = require('../models');

/**
 * Migration Script: Normalizes all legacy string-based mentor assignments to strict ObjectId references
 */
const migrateLegacyData = async () => {
  try {
    console.log('🔄 Running legacy data migration...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system');

    const students = await Student.find();
    let migratedCount = 0;

    for (const student of students) {
      // If mentorId is missing or stored as a string name in legacy raw collections
      if (!student.mentorId || typeof student.mentorId === 'string') {
        // Look up default mentor or matching mentor in student department
        const mentor = await Mentor.findOne({ department: student.department });
        if (mentor) {
          student.mentorId = mentor._id;
          await student.save();
          migratedCount++;
        }
      }
    }

    console.log(`✅ Migration complete: ${migratedCount} student records updated to strict ObjectId mentor references.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  migrateLegacyData();
}

module.exports = migrateLegacyData;
