// src/models/QuizAttempt.js
import { Schema, model, Types } from 'mongoose';

const AnswerSchema = new Schema({
  questionId: { type: Types.ObjectId, required: true },
  selectedOptionId: { type: Types.ObjectId, required: false } // allow null (skipped)
}, { _id: false });

const QuizAttemptSchema = new Schema({
  quiz: { type: Types.ObjectId, ref: 'Quiz', required: true, index: true },
  student: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  answers: [AnswerSchema],
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
  durationSeconds: { type: Number } // computed
}, { timestamps: true });

QuizAttemptSchema.index({ quiz: 1, student: 1 }, { unique: false });

export default model('QuizAttempt', QuizAttemptSchema);
