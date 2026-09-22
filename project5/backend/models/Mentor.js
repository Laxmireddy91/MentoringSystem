const mongoose = require('mongoose');

const officeHourSlotSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    required: true,
    min: 0,
    max: 6,
  },
  dayName: {
    type: String,
    enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true,
  },
  startTime: {
    type: String, // 'HH:MM' 24-hour
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  slotDurationMinutes: {
    type: Number,
    default: 30,
    min: 15,
    max: 120,
  },
  maxBookingsPerSlot: {
    type: Number,
    default: 1,
  },
  location: {
    type: String,
    default: 'Faculty Cabin / Online',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const mentorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      index: true,
    },
    designation: {
      type: String,
      default: 'Assistant Professor',
    },
    specialization: {
      type: [String],
      default: [],
    },
    officeHours: [officeHourSlotSchema],
    maxMentees: {
      type: Number,
      default: 30,
    },
    // Whether this mentor is eligible for new allocations
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

mentorSchema.index({ department: 1, ratingAverage: -1 });
mentorSchema.index({ department: 1, isActive: 1 });

const Mentor = mongoose.model('Mentor', mentorSchema);
module.exports = Mentor;
