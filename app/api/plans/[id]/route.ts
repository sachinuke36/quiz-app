import { db } from "@/lib/db";
import { createErrorResponse } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const plan = await db.plan.findUnique({
      where: { id, isActive: true },
    });

    if (!plan) {
      return Response.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: plan });
  } catch (error) {
    return createErrorResponse(error);
  }
}
