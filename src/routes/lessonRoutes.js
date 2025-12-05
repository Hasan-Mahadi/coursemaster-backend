// src/routes/lessonRoutes.js
import express from 'express';
import {
  createLesson,
  getLessonsByCourse,
  getLesson,
  updateLesson,
  deleteLesson
} from '../controllers/lessonController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes protected + adminOnly (for create/update/delete)
router.post('/', protect, adminOnly, createLesson);
router.put('/:id', protect, adminOnly, updateLesson);
router.delete('/:id', protect, adminOnly, deleteLesson);

// Public route: get all lessons for a course
router.get('/course/:courseId', protect, getLessonsByCourse); // student must be logged in
router.get('/:id', protect, getLesson);

export default router;
