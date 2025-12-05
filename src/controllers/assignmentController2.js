// src/controllers/assignmentController.js
import AssignmentResult from '../models/AssignmentResult.js';
import { z } from 'zod';

// Submit assignment (Student)
export const submitAssignment = async (req, res, next) => {
  try {
    const schema = z.object({
      courseId: z.string().min(1),
      assignmentTitle: z.string().min(3),
      submissionLink: z.string().optional(),
      submissionText: z.string().optional()
    });
    const parsed = schema.parse(req.body);

    const assignment = await AssignmentResult.create({
      student: req.user._id,
      course: parsed.courseId,
      assignmentTitle: parsed.assignmentTitle,
      submissionLink: parsed.submissionLink,
      submissionText: parsed.submissionText
    });

    res.status(201).json({ message: 'Assignment submitted successfully', assignment });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ message: 'Validation error', errors: error.errors });
    next(error);
  }
};

// Admin: List all submissions for a course
export const listAssignmentsForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const assignments = await AssignmentResult.find({ course: courseId })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    res.json({ total: assignments.length, assignments });
  } catch (error) {
    next(error);
  }
};

// Admin: Grade an assignment
export const gradeAssignment = async (req, res, next) => {
  try {
    const schema = z.object({
      grade: z.number().min(0),
      feedback: z.string().optional()
    });
    const { grade, feedback } = schema.parse(req.body);
    const { assignmentId } = req.params;

    const assignment = await AssignmentResult.findByIdAndUpdate(
      assignmentId,
      { grade, feedback },
      { new: true }
    );

    res.json({ message: 'Assignment graded', assignment });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ message: 'Validation error', errors: error.errors });
    next(error);
  }
};
