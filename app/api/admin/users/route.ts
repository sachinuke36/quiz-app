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
    const role = searchParams.get("role") || "";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (role && ["ADMIN", "USER"].includes(role)) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total, adminCount, activeSubCount] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          subscriptions: {
            where: { status: "ACTIVE" },
            take: 1,
          },
          _count: {
            select: { attempts: true, payments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
      db.user.count({ where: { role: "ADMIN" } }),
      db.subscription.count({ where: { status: "ACTIVE" } }),
    ]);

    return Response.json({
      success: true,
      data: users,
      stats: {
        adminCount,
        activeSubCount,
      },
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
