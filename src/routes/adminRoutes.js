// src/routes/adminRoutes.js
import express from 'express';
import {
  getDashboardStats,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  listCoursesAdmin,
  toggleCoursePublish
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes under /api/admin require protect + adminOnly
router.use(protect, adminOnly);

// Dashboard stats
router.get('/stats', getDashboardStats);

// Users
router.get('/users', listUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Courses admin view
router.get('/courses', listCoursesAdmin);
router.put('/courses/:id/publish', toggleCoursePublish);

export default router;
