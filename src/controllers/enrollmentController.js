// src/controllers/enrollmentController.js
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import { z } from 'zod';

// validation schemas
const enrollSchema = z.object({
  courseId: z.string().min(1),
  batchId: z.string().optional()
});

const lessonCompleteSchema = z.object({
  enrollmentId: z.string().min(1),
  lessonId: z.string().min(1)
});

export const enrollToCourse = async (req, res, next) => {
  try {
    const parsed = enrollSchema.parse(req.body);
    const studentId = req.user._id;
    const { courseId, batchId } = parsed;

    // ensure course exists and published
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // check duplicate enrollment (Enrollment model unique index will also enforce)
    const exists = await Enrollment.findOne({ student: studentId, course: courseId });
    if (exists) return res.status(400).json({ message: 'Already enrolled in this course' });

    // optional: check batch seat availability -> omitted for brevity

    const batchObj = batchId ? { id: batchId, name: (course.batches.find(b => b._id.toString() === batchId)?.name || '') } : undefined;

    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      batch: batchObj,
      progress: 0,
      completedLessons: []
    });

    // update course's enrolledStudents and totalEnrolled (optional atomic approach)
    course.enrolledStudents.push(studentId);
    course.totalEnrolled = course.enrolledStudents.length;
    await course.save();

    res.status(201).json({ message: 'Enrolled successfully', enrollmentId: enrollment._id });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ message: 'Validation error', errors: error.errors });
    if (error.code === 11000) return res.status(400).json({ message: 'Already enrolled' }); // duplicate index
    next(error);
  }
};

export const markLessonComplete = async (req, res, next) => {
  try {
    const parsed = lessonCompleteSchema.parse(req.body);
    const userId = req.user._id;
    const { enrollmentId, lessonId } = parsed;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    if (enrollment.student.toString() !== userId.toString()) return res.status(403).json({ message: 'Not authorized' });

    if (enrollment.completedLessons.some(id => id.toString() === lessonId.toString())) {
      return res.status(200).json({ message: 'Lesson already marked as complete', progress: enrollment.progress });
    }

    // push lessonId
    enrollment.completedLessons.push(lessonId);

    // calculate progress: need total lessons count from course
    const course = await Course.findById(enrollment.course).select('lessons');
    const totalLessons = Array.isArray(course.lessons) ? course.lessons.length : 0;

    if (totalLessons > 0) {
      enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
    } else {
      enrollment.progress = enrollment.completedLessons.length > 0 ? 100 : 0;
    }

    await enrollment.save();
    res.json({ message: 'Marked complete', progress: enrollment.progress, completedLessonsCount: enrollment.completedLessons.length });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ message: 'Validation error', errors: error.errors });
    next(error);
  }
};

export const getStudentDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const enrollments = await Enrollment.find({ student: userId })
      .populate({
        path: 'course',
        select: 'title slug thumbnail price category totalEnrolled lessons',
      })
      .sort({ enrolledAt: -1 });

    // map to dashboard format
    const dashboard = enrollments.map(en => {
      const course = en.course;
      const totalLessons = course?.lessons?.length || 0;
      return {
        enrollmentId: en._id,
        courseId: course?._id,
        title: course?.title,
        slug: course?.slug,
        thumbnail: course?.thumbnail,
        category: course?.category,
        price: course?.price,
        enrolledAt: en.enrolledAt,
        progress: en.progress,
        completedLessonsCount: en.completedLessons.length,
        totalLessons
      };
    });

    res.json({ dashboard });
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentDetail = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params; // enrollment id

    const enrollment = await Enrollment.findById(id)
      .populate({
        path: 'course',
        select: 'title slug thumbnail price category lessons instructor',
        populate: { path: 'instructor', select: 'name email' }
      });

    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    if (enrollment.student.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // prepare lessons with completed flag
    const course = enrollment.course;
    const lessons = (course.lessons || []).map(ls => ({
      _id: ls._id,
      title: ls.title,
      videoUrl: ls.videoUrl,
      order: ls.order,
      duration: ls.duration,
      completed: enrollment.completedLessons.some(id => id.toString() === ls._id.toString())
    }));

    res.json({
      enrollmentId: enrollment._id,
      course: {
        _id: course._id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        instructor: course.instructor,
      },
      enrolledAt: enrollment.enrolledAt,
      progress: enrollment.progress,
      lessons,
      assignments: enrollment.assignments,
      quizzes: enrollment.quizzes
    });
  } catch (error) {
    next(error);
  }
};

// Admin: list enrollments for a course
export const listEnrollmentsForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    // only admin allowed - ensure route uses adminOnly middleware
    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'name email')
      .sort({ enrolledAt: -1 });

    res.json({ total: enrollments.length, enrollments });
  } catch (error) {
    next(error);
  }
};
