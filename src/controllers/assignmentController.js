// src/controllers/assignmentController.js
import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import { z } from 'zod';

// Validation schemas
const createAssignmentSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().optional(),
  dueDate: z.string().optional()
});

const submissionSchema = z.object({
  assignmentId: z.string().min(1),
  submissionText: z.string().optional(),
  submissionLink: z.string().optional()
});

// Create assignment (admin/instructor)
export const createAssignment = async (req, res, next) => {
  try {
    const parsed = createAssignmentSchema.parse(req.body);
    const ass = await Assignment.create({
      course: parsed.courseId,
      title: parsed.title,
      description: parsed.description,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
      createdBy: req.user._id
    });
    res.status(201).json({ message: 'Assignment created', assignment: ass });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ message: 'Validation error', errors: error.errors });
    next(error);
  }
};

// List assignments for a course (public to enrolled users)
export const listAssignmentsForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const assignments = await Assignment.find({ course: courseId }).sort({ createdAt: -1 });
    res.json({ assignments });
  } catch (error) {
    next(error);
  }
};

// Student submit assignment
export const submitAssignment = async (req, res, next) => {
  try {
    const parsed = submissionSchema.parse(req.body);
    const studentId = req.user._id;

    // ensure assignment exists
    const assignment = await Assignment.findById(parsed.assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // create submission
    const submission = await AssignmentSubmission.create({
      assignment: parsed.assignmentId,
      student: studentId,
      submissionText: parsed.submissionText,
      submissionLink: parsed.submissionLink
    });

    res.status(201).json({ message: 'Submitted successfully', submissionId: submission._id });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ message: 'Validation error', errors: error.errors });
    next(error);
  }
};

// Admin: list submissions for an assignment
export const listSubmissions = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const subs = await AssignmentSubmission.find({ assignment: assignmentId })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });
    res.json({ total: subs.length, submissions: subs });
  } catch (error) {
    next(error);
  }
};

// Admin: review and grade a submission
export const reviewSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback, reviewed } = req.body;

    const sub = await AssignmentSubmission.findById(submissionId);
    if (!sub) return res.status(404).json({ message: 'Submission not found' });

    sub.marks = marks !== undefined ? marks : sub.marks;
    sub.feedback = feedback !== undefined ? feedback : sub.feedback;
    sub.reviewed = reviewed !== undefined ? !!reviewed : true;
    sub.reviewer = req.user._id;

    await sub.save();
    res.json({ message: 'Submission reviewed', submission: sub });
  } catch (error) {
    next(error);
  }
};

export const gradeAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { grade } = req.body;

    // Example: find assignment and update grade
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    assignment.grade = grade;
    await assignment.save();

    res.status(200).json({ message: 'Assignment graded successfully', assignment });
  } catch (error) {
    console.error('Grade assignment error:', error);
    res.status(500).json({ message: 'Server error grading assignment' });
  }
};


// Student: get own submissions
export const getMySubmissions = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const subs = await AssignmentSubmission.find({ student: studentId })
      .populate('assignment', 'title course')
      .sort({ submittedAt: -1 });
    res.json({ submissions: subs });
  } catch (error) {
    next(error);
  }
};
