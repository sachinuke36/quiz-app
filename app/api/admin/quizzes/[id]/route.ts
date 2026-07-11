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
        plans: true,
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

    // Extract planIds from body if present
    const { planIds, ...updateData } = body;

    // Build the update data
    const data: Record<string, unknown> = { ...updateData };

    // Handle plan connections if planIds is provided
    if (planIds !== undefined) {
      data.plans = {
        set: planIds.map((planId: string) => ({ id: planId })),
      };
    }

    const quiz = await db.quiz.update({
      where: { id },
      data,
      include: {
        category: true,
        plans: true,
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
