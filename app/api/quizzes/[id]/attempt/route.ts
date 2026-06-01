import { getCurrentUser, getUserWithSubscription } from "@/lib/auth";
import { db } from "@/lib/db";
import { createErrorResponse } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await getUserWithSubscription();
    if (!user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription
    if (user.subscriptions.length === 0) {
      return Response.json(
        { success: false, error: "Active subscription required" },
        { status: 403 }
      );
    }

    const { id: quizId } = await params;

    // Get quiz with questions
    const quiz = await db.quiz.findUnique({
      where: { id: quizId, isPublished: true },
      include: {
        questions: {
          include: {
            options: {
              select: { id: true, text: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!quiz) {
      return Response.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    // Check for existing incomplete attempt
    let attempt = await db.quizAttempt.findFirst({
      where: {
        userId: user.id,
        quizId,
        submittedAt: null,
      },
      include: {
        answers: true,
      },
    });

    // Check if attempt has expired
    if (attempt) {
      const startTime = new Date(attempt.startedAt).getTime();
      const endTime = startTime + quiz.durationMinutes * 60 * 1000;

      if (Date.now() > endTime) {
        // Auto-submit expired attempt
        await submitAttempt(attempt.id, quiz);
        attempt = null;
      }
    }

    // Create new attempt if none exists
    if (!attempt) {
      attempt = await db.quizAttempt.create({
        data: {
          userId: user.id,
          quizId,
          startedAt: new Date(),
        },
        include: {
          answers: true,
        },
      });
    }

    // Convert answers to map
    const answersMap: Record<string, string[]> = {};
    attempt.answers.forEach((answer) => {
      answersMap[answer.questionId] = answer.selectedOptionIds;
    });

    return Response.json({
      success: true,
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          durationMinutes: quiz.durationMinutes,
          totalMarks: quiz.totalMarks,
          questions: quiz.questions.map((q) => ({
            id: q.id,
            question: q.question,
            marks: q.marks,
            type: q.type,
            options: q.options,
          })),
        },
        attempt: {
          id: attempt.id,
          startedAt: attempt.startedAt,
          answers: answersMap,
        },
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

async function submitAttempt(attemptId: string, quiz: { totalMarks: number; passingMarks: number }) {
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
      quiz: {
        include: {
          questions: {
            include: { options: true },
          },
        },
      },
    },
  });

  if (!attempt) return;

  let score = 0;

  // Calculate score
  for (const answer of attempt.answers) {
    const question = attempt.quiz.questions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    const correctOptionIds = question.options
      .filter((o) => o.isCorrect)
      .map((o) => o.id)
      .sort();
    const selectedIds = [...answer.selectedOptionIds].sort();

    const isCorrect =
      correctOptionIds.length === selectedIds.length &&
      correctOptionIds.every((id, i) => id === selectedIds[i]);

    if (isCorrect) {
      score += question.marks;
    }

    await db.answer.update({
      where: { id: answer.id },
      data: { isCorrect },
    });
  }

  const percentage = (score / quiz.totalMarks) * 100;
  const passed = score >= quiz.passingMarks;

  await db.quizAttempt.update({
    where: { id: attemptId },
    data: {
      score,
      percentage,
      passed,
      submittedAt: new Date(),
    },
  });
}
