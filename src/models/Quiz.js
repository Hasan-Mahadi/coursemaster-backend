// src/models/Quiz.js
import { Schema, model, Types } from "mongoose";

const OptionSchema = new Schema(
  {
    text: { type: String, required: true },
     isCorrect: { type: Boolean, default: false } 
   
  },
  { _id: true }
);

const QuestionSchema = new Schema(
  {
    questionText: { type: String, required: true },
    marks: { type: Number, default: 1 },  
    options: [OptionSchema],
 
  },
  { _id: true }
);

const QuizSchema = new Schema(
  {
    course: {
      type: Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    questions: [QuestionSchema],
    timeLimitMinutes: { type: Number }, // optional
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    published: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model("Quiz", QuizSchema);
