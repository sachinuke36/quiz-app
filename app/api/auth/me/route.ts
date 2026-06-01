import { getCurrentUser } from "@/lib/auth";
import { createErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return createErrorResponse(error);
  }
}
