// src/models/Enrollment.js
import { Schema, model } from 'mongoose';

const EnrollmentSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  batch: { 
    id: { type: Schema.Types.ObjectId, ref: 'Course.batches', required: false },
    name: { type: String }
  },
  enrolledAt: { type: Date, default: Date.now },
  completedLessons: [{ type: Schema.Types.ObjectId }], // store lesson _id values
  progress: { type: Number, default: 0 }, // percent 0-100
  isActive: { type: Boolean, default: true },
  // optional: assignment submissions, quiz scores (array of objects)
  assignments: [{
    moduleId: { type: Schema.Types.ObjectId },
    submission: { type: String }, // drive link or text
    submittedAt: { type: Date, default: Date.now },
    reviewed: { type: Boolean, default: false },
    marks: { type: Number, default: 0 }
  }],
  quizzes: [{
    moduleId: { type: Schema.Types.ObjectId },
    score: { type: Number },
    attemptedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// To ensure a student can't have duplicate enrollment for same course
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment = model('Enrollment', EnrollmentSchema);
export default Enrollment;
