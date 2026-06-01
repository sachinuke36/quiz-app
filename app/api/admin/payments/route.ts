import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    await requireAdmin();

    const payments = await db.payment.findMany({
      include: {
        user: { select: { name: true, email: true } },
        plan: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, data: payments });
  } catch (error) {
    return createErrorResponse(error);
  }
}
