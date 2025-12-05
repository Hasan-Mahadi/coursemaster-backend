// src/routes/enrollmentRoutes.js
import express from 'express';
import {
  enrollToCourse,
  markLessonComplete,
  getStudentDashboard,
  getEnrollmentDetail,
  listEnrollmentsForCourse
} from '../controllers/enrollmentController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Enroll in a course (protected)
router.post('/enroll', protect, enrollToCourse);

// Mark a lesson complete (protected)
router.post('/lesson/complete', protect, markLessonComplete);

// Student dashboard (protected)
router.get('/me/dashboard', protect, getStudentDashboard);

// Get enrollment detail (protected)
router.get('/:id', protect, getEnrollmentDetail);

// Admin: list enrollments for course
router.get('/course/:courseId', protect, adminOnly, listEnrollmentsForCourse);

export default router;
