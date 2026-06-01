import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createErrorResponse } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id } = await params;

    const quiz = await db.quiz.findUnique({
      where: { id },
      include: {
        category: true,
        questions: {
          include: { options: true },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { attempts: true } },
      },
    });

    if (!quiz) {
      return Response.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: quiz });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();

    const quiz = await db.quiz.update({
      where: { id },
      data: body,
      include: {
        category: true,
        _count: { select: { questions: true, attempts: true } },
      },
    });

    return Response.json({ success: true, data: quiz });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id } = await params;

    await db.quiz.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
