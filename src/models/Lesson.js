// src/models/Lesson.js
import { Schema, model, Types } from 'mongoose';

const lessonSchema = new Schema(
  {
    course: { type: Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['video', 'text'], default: 'video' },
    videoUrl: { type: String }, // optional if type is text
    order: { type: Number, default: 0 }, // lesson position in course
  },
  { timestamps: true }
);

export default model('Lesson', lessonSchema);
