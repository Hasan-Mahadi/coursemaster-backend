// src/controllers/lessonController.js
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';

/**
 * Create a lesson for a course
 */
export const createLesson = async (req, res, next) => {
  try {
    const { courseId, title, description, type, videoUrl, order } = req.body;

    // check course exists
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const lesson = await Lesson.create({ course: courseId, title, description, type, videoUrl, order });

    res.status(201).json({ message: 'Lesson created', lesson });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all lessons for a course (ordered)
 */
export const getLessonsByCourse = async (req, res, next) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId }).sort({ order: 1 });
    res.json({ lessons });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single lesson
 */
export const getLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    res.json(lesson);
  } catch (error) {
    next(error);
  }
};

/**
 * Update lesson
 */
export const updateLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const updatable = ['title', 'description', 'type', 'videoUrl', 'order'];
    updatable.forEach(field => {
      if (req.body[field] !== undefined) lesson[field] = req.body[field];
    });

    await lesson.save();
    res.json({ message: 'Lesson updated', lesson });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete lesson
 */
export const deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    await lesson.remove();
    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    next(error);
  }
};
