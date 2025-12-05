// src/routes/quizRoutes.js
import express from 'express';
import {
  createQuiz,
  getQuizForStudent,
  submitQuiz,
  getMyAttempts,
  listAttemptsForQuiz
} from '../controllers/quizController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { cacheMiddleware } from '../middlewares/cacheMiddleware.js';

const router = express.Router();

// Create quiz (admin/instructor)
router.post('/', protect, adminOnly, createQuiz);

// Get quiz (student)
// router.get('/:quizId', protect, getQuizForStudent);
// src/routes/quizRoutes.js
router.get('/:quizId', cacheMiddleware(req => `quiz:view:${req.params.quizId}:student`), getQuizForStudent);


// Submit quiz (student)
router.post('/submit', protect, submitQuiz);

// Student: get own attempts
router.get('/:quizId/attempts/me', protect, getMyAttempts);

// Admin: list attempts
router.get('/:quizId/attempts', protect, adminOnly, listAttemptsForQuiz);

export default router;
