import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { planSchema } from "@/lib/validations";
import { createErrorResponse } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const result = planSchema.partial().safeParse(body);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const plan = await db.plan.update({
      where: { id },
      data: result.data,
    });

    return Response.json({ success: true, data: plan });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if plan has active subscriptions
    const activeSubscriptions = await db.subscription.count({
      where: { planId: id, status: "ACTIVE" },
    });

    if (activeSubscriptions > 0) {
      return Response.json(
        { success: false, error: "Cannot delete plan with active subscriptions" },
        { status: 400 }
      );
    }

    await db.plan.delete({ where: { id } });

    return Response.json({ success: true, message: "Plan deleted" });
  } catch (error) {
    return createErrorResponse(error);
  }
}
