// src/controllers/adminController.js
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import mongoose from 'mongoose';

/**
 * Get overall stats for admin dashboard
 * - totalUsers
 * - totalCourses
 * - totalEnrollments
 * - revenue (sum of course.price for enrollments) — best-effort
 * - enrollmentsOverTime (monthly)
 * - topCourses (by totalEnrolled)
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    // const totalUsers = await User.countDocuments();
    // const totalCourses = await Course.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();

    // revenue approximation: sum of course.price for each enrollment (note: if you implement payments, store order amounts separately)
    const revenueAgg = await Enrollment.aggregate([
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseInfo' } },
      { $unwind: '$courseInfo' },
      { $group: { _id: null, totalRevenue: { $sum: '$courseInfo.price' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // enrollments over time (monthly for last 12 months)
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const enrollmentsOverTime = await Enrollment.aggregate([
      { $match: { enrolledAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$enrolledAt' }, month: { $month: '$enrolledAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Normalize to array of months (label + count) — build in memory
    const monthsMap = {};
    enrollmentsOverTime.forEach(item => {
      const { year, month } = item._id;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      monthsMap[key] = item.count;
    });

    // build last 12 months array
    const monthly = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthly.push({ month: key, count: monthsMap[key] || 0 });
    }

    // top courses by totalEnrolled
    const topCourses = await Course.find({})
      .sort({ totalEnrolled: -1 })
      .limit(6)
      .select('title totalEnrolled price thumbnail');

    res.json({
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      enrollmentsMonthly: monthly,
      topCourses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List users with pagination & search
 */
export const listUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const q = req.query.q || '';

    const filter = {};
    if (q) {
      // simple email/name search (case-insensitive)
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).skip(skip).limit(limit).select('-password').sort({ createdAt: -1 })
    ]);

    res.json({ total, page, pages: Math.ceil(total / limit), users });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single user
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user's role or basic info
 */
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updatable = ['name', 'email', 'role'];
    updatable.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    // if password provided, hash handled by User model pre-save
    if (req.body.password) user.password = req.body.password;

    await user.save();
    res.json({ message: 'User updated', user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    // duplicate email check
    if (error.code === 11000) return res.status(400).json({ message: 'Email already in use' });
    next(error);
  }
};

/**
 * Delete user (admin)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // optional: prevent deleting yourself
    if (req.user && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Admin cannot delete own account' });
    }

    await user.remove();
    res.json({ message: 'User removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * List courses (admin view) with ability to remove/change published state
 */
export const listCoursesAdmin = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const q = req.query.q || '';

    const filter = {};
    if (q) {
      filter.$or = [{ title: { $regex: q, $options: 'i' } }, { category: { $regex: q, $options: 'i' } }];
    }

    const [total, courses] = await Promise.all([
      Course.countDocuments(filter),
      Course.find(filter).skip(skip).limit(limit).populate('instructor', 'name email').sort({ createdAt: -1 })
    ]);

    res.json({ total, page, pages: Math.ceil(total / limit), courses });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle publish / unpublish a course
 */
export const toggleCoursePublish = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.published = !!req.body.published;
    await course.save();
    res.json({ message: 'Course updated', published: course.published });
  } catch (error) {
    next(error);
  }
};
