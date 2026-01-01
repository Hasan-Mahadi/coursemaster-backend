// src/controllers/quizController.js
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { z } from "zod";
import mongoose from "mongoose";
import QuizResult from "../models/QuizResult.js";

// Validation
const createQuizSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().optional(),
  timeLimitMinutes: z.number().optional(),
  questions: z
    .array(
      z.object({
        questionText: z.string().min(1),
        options: z
          .array(z.object({ text: z.string().min(1), isCorrect: z.boolean() }))
          .min(2),
        marks: z.number().optional(),
      })
    )
    .min(1),
});

const submitQuizSchema = z.object({
  quizId: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOptionId: z.string().optional(),
    })
  ),
});

// Create quiz (admin/instructor)
export const createQuiz = async (req, res, next) => {
  try {
    const parsed = createQuizSchema.parse(req.body);
    const quiz = await Quiz.create({
      course: parsed.courseId,
      title: parsed.title,
      description: parsed.description,
      timeLimitMinutes: parsed.timeLimitMinutes,
      questions: parsed.questions,
      createdBy: req.user._id,
      published: true,
    });

      // ✅ Redis cache invalidate
    await delCacheByPattern('quiz:view:*'); // সমস্ত quiz view cache remove
    await delCache(`quiz:view:${quiz._id}:student`); // যদি student-specific cache থাকে

    res.status(201).json({ message: "Quiz created", quiz });
  } catch (error) {
    if (error.name === "ZodError")
      return res
        .status(400)
        .json({ message: "Validation error", errors: error.errors });
    next(error);
  }
};

// Get quiz (for taking) — do NOT send isCorrect flags in options
export const getQuizForStudent = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // in quizController.getQuizForStudent (after quiz found)
    const safeQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      marks: q.marks,
      options: q.options.map((opt) => ({ _id: opt._id, text: opt.text })),
    }));
    const payload = {
      quizId: quiz._id,
      title: quiz.title,
      description: quiz.description,
      timeLimitMinutes: quiz.timeLimitMinutes,
      questions: safeQuestions,
    };
    if (req.cacheKey) await setCache(req.cacheKey, payload);
    return res.json(payload);

    // remove isCorrect from options before sending
    // const safeQuestions = quiz.questions.map(q => ({
    //   _id: q._id,
    //   questionText: q.questionText,
    //   marks: q.marks,
    //   options: q.options.map(opt => ({ _id: opt._id, text: opt.text })) // do NOT include isCorrect
    // }));

    // res.json({
    //   quizId: quiz._id,
    //   title: quiz.title,
    //   description: quiz.description,
    //   timeLimitMinutes: quiz.timeLimitMinutes,
    //   questions: safeQuestions
    // });
  } catch (error) {
    next(error);
  }
};

// Submit quiz (auto-grade MCQ)
// export const submitQuiz = async (req, res, next) => {
//   try {
//     const parsed = submitQuizSchema.parse(req.body);
//     const studentId = req.user._id;
//     const { quizId, answers } = parsed;

//     const quiz = await Quiz.findById(quizId);
//     if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

//     // Build maps for quick grading
//     const questionMap = new Map();
//     quiz.questions.forEach(q => questionMap.set(q._id.toString(), q));

//     let totalMarks = 0;
//     let obtained = 0;

//     // compute total marks
//     quiz.questions.forEach(q => { totalMarks += (q.marks || 1); });

//     // grade each answer
//     for (const ans of answers) {
//       const q = questionMap.get(ans.questionId);
//       if (!q) continue; // invalid question id skip
//       const selectedOptId = ans.selectedOptionId;
//       // find matching option in q.options and check isCorrect
//       const selectedOpt = q.options.find(o => o._id.toString() === (selectedOptId || '').toString());
//       if (selectedOpt && selectedOpt.isCorrect) {
//         obtained += (q.marks || 1);
//       }
//     }

//     // create attempt
//     const attempt = await QuizAttempt.create({
//       quiz: quiz._id,
//       student: studentId,
//       answers: answers.map(a => ({ questionId: mongoose.Types.ObjectId(a.questionId), selectedOptionId: a.selectedOptionId ? mongoose.Types.ObjectId(a.selectedOptionId) : null })),
//       score: obtained,
//       totalMarks,
//       finishedAt: new Date()
//     });

//     res.json({ message: 'Quiz submitted', attemptId: attempt._id, score: obtained, totalMarks });
//   } catch (error) {
//     if (error.name === 'ZodError') return res.status(400).json({ message: 'Validation error', errors: error.errors });
//     next(error);
//   }
// };

// export const submitQuiz = async (req, res) => {
//   try {
//     const { quizId, answers } = req.body;

//     const quiz = await Quiz.findById(quizId);
//     if (!quiz) return res.status(404).json({ message: "Quiz not found" });

//     let score = 0;

//     // FIXED: ObjectId must use "new"
//     answers.forEach((ans) => {
//       const q = quiz.questions.id(ans.questionId);
//       if (!q) return;

//       if (String(q.correctOption) === String(ans.selectedOptionId)) {
//         score += 1;
//       }
//     });

//     const result = await QuizResult.create({
//       user: req.user._id,
//       quiz: quizId,
//       answers: answers.map((ans) => ({
//         questionId: new mongoose.Types.ObjectId(ans.questionId),   // FIXED
//         selectedOptionId: new mongoose.Types.ObjectId(ans.selectedOptionId) // FIXED
//       })),
//       score,
//     });

//     res.json({
//       message: "Quiz submitted successfully",
//       score,
//       result,
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// replace existing submitQuiz with this
export const submitQuiz = async (req, res, next) => {
  try {
    const parsed = submitQuizSchema.parse(req.body);
    const studentId = req.user._id;
    const { quizId, answers } = parsed;

    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // build quick maps
    const qMap = new Map(); // questionId -> question obj
    quiz.questions.forEach((q) => {
      qMap.set(String(q._id), q);
    });

    let totalMarks = 0;
    let obtained = 0;

    // compute total marks and score
    for (const q of quiz.questions) {
      const marks = typeof q.marks === "number" ? q.marks : 1;
      totalMarks += marks;

      // find student's answer for this question
      const ans = answers.find((a) => String(a.questionId) === String(q._id));
      if (!ans) continue; // unanswered

      // find selected option in question options
      const selectedOpt = (q.options || []).find(
        (opt) => String(opt._id) === String(ans.selectedOptionId)
      );
      if (selectedOpt && selectedOpt.isCorrect) {
        obtained += marks;
      }
    }

    // save QuizAttempt (optional, used earlier)
    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: studentId,
      answers: answers.map((a) => ({
        questionId: a.questionId
          ? new mongoose.Types.ObjectId(a.questionId)
          : null,
        selectedOptionId: a.selectedOptionId
          ? new mongoose.Types.ObjectId(a.selectedOptionId)
          : null,
      })),
      score: obtained,
      totalMarks,
      finishedAt: new Date(),
    });

    // save QuizResult (optional separate collection)
    const result = await QuizResult.create({
      user: studentId,
      quiz: quiz._id,
      answers: answers.map((a) => ({
        questionId: a.questionId
          ? new mongoose.Types.ObjectId(a.questionId)
          : null,
        selectedOptionId: a.selectedOptionId
          ? new mongoose.Types.ObjectId(a.selectedOptionId)
          : null,
      })),
      score: obtained,
      totalMarks,
      finishedAt: new Date(),
    });

    return res.json({
      message: "Quiz submitted successfully",
      score: obtained,
      totalMarks,
      attemptId: attempt._id,
      resultId: result._id,
    });
  } catch (error) {
    if (error.name === "ZodError")
      return res
        .status(400)
        .json({ message: "Validation error", errors: error.errors });
    next(error);
  }
};

// Get student's attempts for a quiz
export const getMyAttempts = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { quizId } = req.params;
    const attempts = await QuizAttempt.find({
      quiz: quizId,
      student: studentId,
    }).sort({ createdAt: -1 });
    res.json({ attempts });
  } catch (error) {
    next(error);
  }
};

// Admin: get all attempts for a quiz
export const listAttemptsForQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const attempts = await QuizAttempt.find({ quiz: quizId })
      .populate("student", "name email")
      .sort({ createdAt: -1 });
    res.json({ total: attempts.length, attempts });
  } catch (error) {
    next(error);
  }
};


//-----------------------
export const updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // ✅ Redis cache invalidate
    await delCacheByPattern('quiz:view:*');
    await delCache(`quiz:view:${quiz._id}:student`);

    res.json({ message: 'Quiz updatedddddddddddddd', quiz });
  } catch (error) {
    next(error);
  }
};


export const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // ✅ Redis cache invalidate
    await delCacheByPattern('quiz:view:*');
    await delCache(`quiz:view:${quiz._id}:student`);

    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    next(error);
  }
};

