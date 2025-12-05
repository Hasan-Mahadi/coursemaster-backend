// src/controllers/progressController.js
import Progress from '../models/Progress.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';

/**
 * Mark a lesson as completed
 */
export const markLessonCompleted = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.body;
    const studentId = req.user._id;

    // check lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    // upsert progress
    const progress = await Progress.findOneAndUpdate(
      { student: studentId, course: courseId, lesson: lessonId },
      { completed: true },
      { upsert: true, new: true }
    );

    res.json({ message: 'Lesson marked as completed', progress });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's progress for a course
 */
export const getCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });
    const totalLessons = lessons.length;

    const completedLessons = await Progress.find({ student: studentId, course: courseId, completed: true }).countDocuments();

    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    res.json({ totalLessons, completedLessons, percentage });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lesson status for student (completed or not)
 */
export const getLessonStatus = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const studentId = req.user._id;

    const progress = await Progress.findOne({ student: studentId, lesson: lessonId });
    res.json({ completed: progress ? progress.completed : false });
  } catch (error) {
    next(error);
  }
};
