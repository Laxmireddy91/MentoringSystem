const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Mentor, User, StaffRecord } = require('../models');
const { ROLES } = require('../config/constants');

async function runMigration() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system';
    console.log(`🔌 Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    console.log('🔍 Inspecting mentors and staff records for backfill...');

    let createdCount = 0;
    let updatedCount = 0;
    let alreadySyncedCount = 0;

    // 1. Process all Mentor documents
    const mentors = await Mentor.find().populate('userId');
    console.log(`Found ${mentors.length} mentor profile(s) to evaluate.`);

    for (const mentor of mentors) {
      const empId = (mentor.employeeId || '').trim().toUpperCase();
      const user = mentor.userId;
      const email = (user?.email || `${empId.toLowerCase()}@institution.edu`).trim().toLowerCase();

      if (!empId) {
        console.warn(`⚠️ Mentor ${mentor._id} has missing employeeId, skipping.`);
        continue;
      }

      let staffRecord = await StaffRecord.findOne({
        $or: [{ employeeId: empId }, { email }],
      });

      if (!staffRecord) {
        staffRecord = await StaffRecord.create({
          employeeId: empId,
          email,
          name: user?.name || 'Faculty Mentor',
          role: ROLES.MENTOR,
          department: mentor.department || user?.department || 'CSE',
          designation: mentor.designation || 'Assistant Professor',
          phone: user?.phone || '',
          isActivated: user?.isActivated !== undefined ? user.isActivated : true,
          activatedAt: user?.activatedAt || (user?.isActivated ? new Date() : null),
          activatedUserId: user?._id || null,
        });
        console.log(`  [+] Created StaffRecord for Mentor ${empId} (${email})`);
        createdCount++;
      } else {
        let changed = false;
        if (!staffRecord.activatedUserId && user?._id) {
          staffRecord.activatedUserId = user._id;
          changed = true;
        }
        if (user && user.isActivated && !staffRecord.isActivated) {
          staffRecord.isActivated = true;
          staffRecord.activatedAt = user.activatedAt || new Date();
          changed = true;
        }
        if (changed) {
          await staffRecord.save();
          console.log(`  [*] Updated existing StaffRecord for Mentor ${empId}`);
          updatedCount++;
        } else {
          alreadySyncedCount++;
        }
      }
    }

    // 2. Process other staff roles (HOD, Coordinator, Exam Coordinator, TPO)
    const staffRoles = [
      ROLES.HOD,
      ROLES.MENTORING_COORDINATOR,
      ROLES.EXAM_COORDINATOR,
      ROLES.TPO,
    ];

    const staffUsers = await User.find({ role: { $in: staffRoles } });
    console.log(`Found ${staffUsers.length} institutional staff user(s) to evaluate.`);

    for (const sUser of staffUsers) {
      const email = sUser.email.toLowerCase();
      const empId = (sUser.employeeId || sUser.staffProfile?.employeeId || `STF_${sUser.role}_${sUser._id.toString().slice(-4)}`).toUpperCase();

      let staffRecord = await StaffRecord.findOne({
        $or: [{ email }, { employeeId: empId }],
      });

      if (!staffRecord) {
        await StaffRecord.create({
          employeeId: empId,
          email,
          name: sUser.name,
          role: sUser.role,
          department: sUser.department || 'CSE',
          designation: sUser.staffProfile?.designation || (sUser.role === ROLES.HOD ? 'HOD & Professor' : 'Coordinator'),
          phone: sUser.phone || '',
          isActivated: sUser.isActivated !== undefined ? sUser.isActivated : true,
          activatedAt: sUser.activatedAt || new Date(),
          activatedUserId: sUser._id,
        });
        console.log(`  [+] Created StaffRecord for Staff User ${sUser.name} (${sUser.role})`);
        createdCount++;
      } else {
        if (!staffRecord.activatedUserId) {
          staffRecord.activatedUserId = sUser._id;
          staffRecord.isActivated = true;
          staffRecord.activatedAt = sUser.activatedAt || new Date();
          await staffRecord.save();
          updatedCount++;
        } else {
          alreadySyncedCount++;
        }
      }
    }

    console.log('───────────────────────────────────────────────────────');
    console.log(`🎉 Migration Complete:`);
    console.log(`   - Created StaffRecords:        ${createdCount}`);
    console.log(`   - Updated StaffRecords:        ${updatedCount}`);
    console.log(`   - Already Synced StaffRecords: ${alreadySyncedCount}`);
    console.log('───────────────────────────────────────────────────────');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed with error:', err);
    process.exit(1);
  }
}

runMigration();
