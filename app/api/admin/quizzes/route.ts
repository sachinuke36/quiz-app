import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createErrorResponse } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { category: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const [quizzes, total] = await Promise.all([
      db.quiz.findMany({
        where,
        include: {
          category: true,
          plans: true,
          _count: {
            select: { questions: true, attempts: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.quiz.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: quizzes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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
      isFree,
      planIds,
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
        isFree: isFree ?? true,
        plans: planIds?.length > 0 ? {
          connect: planIds.map((id: string) => ({ id })),
        } : undefined,
      },
      include: {
        category: true,
        plans: true,
        _count: { select: { questions: true, attempts: true } },
      },
    });

    return Response.json({ success: true, data: quiz }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
