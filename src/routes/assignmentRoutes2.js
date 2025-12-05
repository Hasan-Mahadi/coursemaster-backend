// // src/routes/assignmentRoutes.js
// import express from 'express';
// import { submitAssignment, listAssignmentsForCourse, gradeAssignment } from '../controllers/assignmentController.js';
// import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';
// import { protect, adminOnly } from '../middlewares/authMiddleware.js';


// const router = express.Router();

// // Student routes
// router.post('/submit', authMiddleware, submitAssignment);

// // Admin routes
// router.get('/course/:courseId', authMiddleware, isAdmin, listAssignmentsForCourse);
// router.patch('/grade/:assignmentId', authMiddleware, isAdmin, gradeAssignment);

// export default router;



// src/routes/assignmentRoutes.js
import express from 'express';
import { submitAssignment, listAssignmentsForCourse, gradeAssignment } from '../controllers/assignmentController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js'; // Correct imports

const router = express.Router();

// Student routes
router.post('/submit', protect, submitAssignment);

// Admin routes
router.get('/course/:courseId', protect, adminOnly, listAssignmentsForCourse);
router.patch('/grade/:assignmentId', protect, adminOnly, gradeAssignment);

export default router;
