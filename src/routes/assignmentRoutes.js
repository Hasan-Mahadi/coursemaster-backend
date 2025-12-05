// src/routes/assignmentRoutes.js
import express from 'express';
import {
  createAssignment,
  listAssignmentsForCourse,
  submitAssignment,
  listSubmissions,
  reviewSubmission,
  getMySubmissions
} from '../controllers/assignmentController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Create assignment (admin/instructor)
router.post('/', protect, adminOnly, createAssignment);

// List assignments for course (students)
router.get('/course/:courseId', protect, listAssignmentsForCourse);

// Student submit
router.post('/submit', protect, submitAssignment);

// Student get own submissions
router.get('/my-submissions', protect, getMySubmissions);

// Admin: list submissions for an assignment
router.get('/:assignmentId/submissions', protect, adminOnly, listSubmissions);

// Admin: review a submission
router.put('/submission/:submissionId/review', protect, adminOnly, reviewSubmission);

export default router;
