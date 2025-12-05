// src/models/QuizResult.js
import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Quiz.questions' },
  selectedOptionId: { type: mongoose.Schema.Types.ObjectId, required: false } // allow null/skipped
}, { _id: false });

const quizResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  answers: { type: [AnswerSchema], default: [] },
  score: { type: Number, required: true, default: 0 },
  totalMarks: { type: Number, required: false, default: 0 },
  finishedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const QuizResult = mongoose.model('QuizResult', quizResultSchema);
export default QuizResult;
