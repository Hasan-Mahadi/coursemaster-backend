// src/models/Progress.js
import { Schema, model, Types } from 'mongoose';

const progressSchema = new Schema(
  {
    student: { type: Types.ObjectId, ref: 'User', required: true },
    course: { type: Types.ObjectId, ref: 'Course', required: true },
    lesson: { type: Types.ObjectId, ref: 'Lesson', required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model('Progress', progressSchema);
