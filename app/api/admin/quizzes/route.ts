import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    await requireAdmin();

    const quizzes = await db.quiz.findMany({
      include: {
        category: true,
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, data: quizzes });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      title,
      description,
      categoryId,
      durationMinutes,
      totalMarks,
      passingMarks,
      isPublished,
    } = body;

    if (!title || !durationMinutes || !totalMarks || !passingMarks) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const quiz = await db.quiz.create({
      data: {
        title,
        description,
        categoryId: categoryId || null,
        durationMinutes,
        totalMarks,
        passingMarks,
        isPublished: isPublished || false,
      },
      include: {
        category: true,
        _count: { select: { questions: true, attempts: true } },
      },
    });

    return Response.json({ success: true, data: quiz }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
