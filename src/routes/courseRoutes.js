// src/routes/courseRoutes.js
import express from 'express';
import { cacheMiddleware } from '../middlewares/cacheMiddleware.js';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollCourse
} from '../controllers/courseController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public
// router.get('/', getCourses);
router.get(
  '/',
  cacheMiddleware(req => {
    const q = req.query.q || '';
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const sort = req.query.sort || 'createdAt';
    const category = req.query.category || '';
    return `courses:list:q=${q}:page=${page}:limit=${limit}:sort=${sort}:cat=${category}`;
  }),
  getCourses
);
// router.get('/:id', getCourseById);
router.get('/:id', cacheMiddleware(req => `course:${req.params.id}`), getCourseById);

// Protected
router.post('/', protect, adminOnly, createCourse); // admin-only create
router.put('/:id', protect, updateCourse);
router.delete('/:id', protect, deleteCourse);
router.post('/:id/enroll', protect, enrollCourse);

export default router;
