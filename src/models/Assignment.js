// src/models/Assignment.js
import { Schema, model, Types } from 'mongoose';

const AssignmentSchema = new Schema({
  course: { type: Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  createdBy: { type: Types.ObjectId, ref: 'User', required: true }, // instructor/admin
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default model('Assignment', AssignmentSchema);
