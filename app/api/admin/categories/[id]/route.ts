import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validations";
import { createErrorResponse } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const result = categorySchema.partial().safeParse(body);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const category = await db.category.update({
      where: { id },
      data: result.data,
    });

    return Response.json({ success: true, data: category });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if category has quizzes
    const quizCount = await db.quiz.count({ where: { categoryId: id } });

    if (quizCount > 0) {
      return Response.json(
        { success: false, error: "Cannot delete category with quizzes. Move or delete quizzes first." },
        { status: 400 }
      );
    }

    await db.category.delete({ where: { id } });

    return Response.json({ success: true, message: "Category deleted" });
  } catch (error) {
    return createErrorResponse(error);
  }
}
