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
    const { attemptId, questionId, selectedOptionIds } = body;

    // Verify attempt belongs to user and is not submitted
    const attempt = await db.quizAttempt.findFirst({
      where: {
        id: attemptId,
        userId: user.id,
        quizId,
        submittedAt: null,
      },
      include: {
        quiz: true,
      },
    });

    if (!attempt) {
      return Response.json(
        { success: false, error: "Invalid attempt" },
        { status: 400 }
      );
    }

    // Check if attempt has expired
    const startTime = new Date(attempt.startedAt).getTime();
    const endTime = startTime + attempt.quiz.durationMinutes * 60 * 1000;

    if (Date.now() > endTime) {
      return Response.json(
        { success: false, error: "Attempt has expired" },
        { status: 400 }
      );
    }

    // Upsert answer
    await db.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      create: {
        attemptId,
        questionId,
        selectedOptionIds,
      },
      update: {
        selectedOptionIds,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
