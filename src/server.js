import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import assignmentRoutess from './routes/assignmentRoutes2.js';
import quizRoutes from './routes/quizRoutes.js';
import { connectRedis } from './config/redisClient.js';








dotenv.config();
connectDB();

// connect redis (optional - fail gracefully)
try {
  await connectRedis();
} catch (err) {
  console.warn('Redis connect failed, continuing without cache', err.message);
}

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/assignmentss', assignmentRoutess);



// Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
