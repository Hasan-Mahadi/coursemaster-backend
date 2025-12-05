// src/models/Course.js
import { Schema, model } from 'mongoose';



const LessonSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String }, // embed links (YouTube/Vimeo)
  order: { type: Number, default: 0 },
  duration: { type: Number }, // seconds or minutes
}, { _id: true });



const BatchSchema = new Schema({
  name: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  seats: { type: Number, default: 0 },
}, { _id: true });




const CourseSchema = new Schema({
  title: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  shortDescription: { type: String },
  description: { type: String },
  instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  price: { type: Number, default: 0 },
  category: { type: String, index: true },
  tags: [{ type: String, index: true }],
  lessons: [LessonSchema],
  batches: [BatchSchema],
  totalEnrolled: { type: Number, default: 0 },
  enrolledStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  thumbnail: { type: String },
  published: { type: Boolean, default: false },
}, { timestamps: true });



// text index for search
CourseSchema.index({ title: 'text', shortDescription: 'text', tags: 'text' });


const Course = model('Course', CourseSchema);
export default Course;
