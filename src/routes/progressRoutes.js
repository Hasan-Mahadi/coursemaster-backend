// src/routes/progressRoutes.js
import express from 'express';
import { markLessonCompleted, getCourseProgress, getLessonStatus } from '../controllers/progressController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require login
router.use(protect);

// Mark lesson completed
router.post('/complete', markLessonCompleted);

// Get course progress
router.get('/course/:courseId', getCourseProgress);

// Get single lesson status
router.get('/lesson/:lessonId', getLessonStatus);

export default router;
