// src/models/AssignmentResult.js
import { Schema, model } from 'mongoose';

const assignmentResultSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  assignmentTitle: { type: String, required: true },
  submissionLink: { type: String }, // Google Drive link
  submissionText: { type: String }, // Text answer
  grade: { type: Number, default: null },
  feedback: { type: String, default: '' },
}, { timestamps: true });

export default model('AssignmentResult', assignmentResultSchema);
