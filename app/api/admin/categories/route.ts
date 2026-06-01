import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validations";
import { createErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    await requireAdmin();

    const categories = await db.category.findMany({
      include: { _count: { select: { quizzes: true } } },
      orderBy: { name: "asc" },
    });

    return Response.json({ success: true, data: categories });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: result.data,
    });

    return Response.json({ success: true, data: category });
  } catch (error) {
    return createErrorResponse(error);
  }
}
