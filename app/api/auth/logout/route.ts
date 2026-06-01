import { removeAuthCookie } from "@/lib/auth";
import { createErrorResponse } from "@/lib/errors";

export async function POST() {
  try {
    await removeAuthCookie();

    return Response.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return createErrorResponse(error);
  }
}
