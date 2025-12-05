// src/controllers/courseController.js
import Course from '../models/Course.js';
import slugify from 'slugify';
import { z } from 'zod';
import { setCache, delCacheByPattern } from '../utils/cache.js';
import {  delCache } from '../utils/cache.js';

// Validation schemas
const createCourseSchema = z.object({
  title: z.string().min(3),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lessons: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    videoUrl: z.string().optional(),
    order: z.number().optional(),
    duration: z.number().optional()
  })).optional(),
  batches: z.array(z.object({
    name: z.string().optional(),
    startDate: z.string().optional(), // ISO string
    endDate: z.string().optional(),
    seats: z.number().optional()
  })).optional(),
  thumbnail: z.string().optional(),
  published: z.boolean().optional()
});

const updateCourseSchema = createCourseSchema.partial();

export const createCourse = async (req, res, next) => {
  try {
    const parsed = createCourseSchema.parse(req.body);
    const slug = slugify(parsed.title, { lower: true, strict: true });

    const existing = await Course.findOne({ slug });
    if (existing) return res.status(400).json({ message: 'Course with similar title exists. Change title.' });

    const course = await Course.create({
      ...parsed,
      slug,
      instructor: req.user._id,
    });

     await delCacheByPattern('courses:list*');   // সমস্ত course listing cache remove
    await delCache(`course:${course._id}`);     // single course cache (যদি কোথাও ব্যবহার করা হয়)

    res.status(201).json(course);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    next(error);
  }
};

export const getCourses = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const { q, category, tag, instructor, sort } = req.query;
    const filter = { published: true }; // only published by default

    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (instructor) filter.instructor = instructor;

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'popular') sortOption = { totalEnrolled: -1 };

    const [total, courses] = await Promise.all([
      Course.countDocuments(filter),
      Course.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('instructor', 'name email')
        .select('-lessons') // remove lessons for listing
    ]);


    const payload = {
      total,
      page,
      pages: Math.ceil(total / limit),
      courses,
    };

    // set cache if middleware provided req.cacheKey
    if (req.cacheKey) {
      await setCache(req.cacheKey, payload);
    }
    return res.json(payload);
  } catch (err) {
    next(err);
  }
};

//     res.json({
//       total,
//       page,
//       pages: Math.ceil(total / limit),
//       courses,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const parsed = updateCourseSchema.parse(req.body);
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this course' });
    }

    Object.keys(parsed).forEach(key => {
      course[key] = parsed[key];
    });

    if (parsed.title) {
      course.slug = slugify(parsed.title, { lower: true, strict: true });
    }


    const updated = await course.save();
    // ✅ invalidate caches after DB operation
    await delCacheByPattern('courses:list*');
    await delCache(`course:${course._id}`);

    res.json(updated);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    await course.remove();
     // ✅ invalidate caches
    await delCacheByPattern('courses:list*');
    await delCache(`course:${course._id}`);

    res.json({ message: 'Course removed' });
  } catch (error) {
    next(error);
  }
};

export const enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const userId = req.user._id;
    if (course.enrolledStudents.some(id => id.toString() === userId.toString())) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    course.enrolledStudents.push(userId);
    course.totalEnrolled = course.enrolledStudents.length;
    await course.save();

    res.json({ message: 'Enrolled successfully', courseId: course._id });
  } catch (error) {
    next(error);
  }
};
