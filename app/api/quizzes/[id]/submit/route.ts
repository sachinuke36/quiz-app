import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createErrorResponse } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: quizId } = await params;
    const body = await request.json();
    const { attemptId } = body;

    // Verify attempt belongs to user and is not submitted
    const attempt = await db.quizAttempt.findFirst({
      where: {
        id: attemptId,
        userId: user.id,
        quizId,
        submittedAt: null,
      },
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

    if (!attempt) {
      return Response.json(
        { success: false, error: "Invalid attempt or already submitted" },
        { status: 400 }
      );
    }

    let score = 0;

    // Calculate score for each answer
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

      // Update answer with correctness
      await db.answer.update({
        where: { id: answer.id },
        data: { isCorrect },
      });
    }

    const percentage = (score / attempt.quiz.totalMarks) * 100;
    const passed = score >= attempt.quiz.passingMarks;

    // Update attempt with results
    const updatedAttempt = await db.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        percentage,
        passed,
        submittedAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      data: {
        score,
        percentage,
        passed,
        totalMarks: attempt.quiz.totalMarks,
        passingMarks: attempt.quiz.passingMarks,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
