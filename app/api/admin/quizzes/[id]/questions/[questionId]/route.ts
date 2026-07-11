import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createErrorResponse } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string; questionId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id: quizId, questionId } = await params;
    const body = await request.json();
    const { question, type, marks, explanation, options } = body;

    // Verify question belongs to quiz
    const existingQuestion = await db.question.findFirst({
      where: { id: questionId, quizId },
      include: { options: true },
    });

    if (!existingQuestion) {
      return Response.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    // Update question
    const updatedQuestion = await db.question.update({
      where: { id: questionId },
      data: {
        question: question ?? existingQuestion.question,
        type: type ?? existingQuestion.type,
        marks: marks ?? existingQuestion.marks,
        explanation: explanation !== undefined ? explanation : existingQuestion.explanation,
      },
    });

    // Update options if provided
    if (options && Array.isArray(options)) {
      // Get existing option IDs
      const existingOptionIds = existingQuestion.options.map((o) => o.id);
      const providedOptionIds = options
        .filter((o: { id?: string }) => o.id)
        .map((o: { id: string }) => o.id);

      // Delete options that are no longer present
      const optionsToDelete = existingOptionIds.filter(
        (id) => !providedOptionIds.includes(id)
      );

      if (optionsToDelete.length > 0) {
        await db.option.deleteMany({
          where: {
            id: { in: optionsToDelete },
            questionId,
          },
        });
      }

      // Update or create options
      for (const option of options) {
        if (option.id && existingOptionIds.includes(option.id)) {
          // Update existing option
          await db.option.update({
            where: { id: option.id },
            data: {
              text: option.text,
              isCorrect: option.isCorrect,
            },
          });
        } else {
          // Create new option
          await db.option.create({
            data: {
              questionId,
              text: option.text,
              isCorrect: option.isCorrect,
            },
          });
        }
      }
    }

    // Fetch updated question with options
    const finalQuestion = await db.question.findUnique({
      where: { id: questionId },
      include: { options: true },
    });

    return Response.json({ success: true, data: finalQuestion });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id: quizId, questionId } = await params;

    // Verify question belongs to quiz
    const existingQuestion = await db.question.findFirst({
      where: { id: questionId, quizId },
    });

    if (!existingQuestion) {
      return Response.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    // Delete question (options will be deleted via cascade)
    await db.question.delete({
      where: { id: questionId },
    });

    return Response.json({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
