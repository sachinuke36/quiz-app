import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createErrorResponse } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id: quizId } = await params;
    const body = await request.json();
    const { question, type, marks, explanation, options } = body;

    if (!question || !type || !marks || !options || options.length < 2) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newQuestion = await db.question.create({
      data: {
        quizId,
        question,
        type,
        marks,
        explanation: explanation || null,
        options: {
          create: options.map((opt: { text: string; isCorrect: boolean }) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        },
      },
      include: { options: true },
    });

    return Response.json({ success: true, data: newQuestion }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id: quizId } = await params;

    const questions = await db.question.findMany({
      where: { quizId },
      include: { options: true },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({ success: true, data: questions });
  } catch (error) {
    return createErrorResponse(error);
  }
}
