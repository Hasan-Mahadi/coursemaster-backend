// src/models/AssignmentSubmission.js
import { Schema, model, Types } from 'mongoose';

const SubmissionSchema = new Schema({
  assignment: { type: Types.ObjectId, ref: 'Assignment', required: true, index: true },
  student: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  submissionText: { type: String }, // text answer or description
  submissionLink: { type: String }, // google drive link, file URL, etc.
  submittedAt: { type: Date, default: Date.now },
  reviewed: { type: Boolean, default: false },
  reviewer: { type: Types.ObjectId, ref: 'User' },
  marks: { type: Number, default: 0 },
  feedback: { type: String }
}, { timestamps: true });

// prevent duplicate submission by same student for same assignment if desired
SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: false });

export default model('AssignmentSubmission', SubmissionSchema);
