import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { planSchema } from "@/lib/validations";
import { createErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    await requireAdmin();

    const plans = await db.plan.findMany({
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { price: "asc" },
    });

    return Response.json({ success: true, data: plans });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const result = planSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const plan = await db.plan.create({
      data: result.data,
    });

    return Response.json({ success: true, data: plan });
  } catch (error) {
    return createErrorResponse(error);
  }
}
