import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    await requireAdmin();

    const settings = await db.settings.findMany();

    // Convert array to object
    const settingsObj: Record<string, string> = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    return Response.json({ success: true, data: settingsObj });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return Response.json(
        { success: false, error: "Key is required" },
        { status: 400 }
      );
    }

    // Upsert setting
    await db.settings.upsert({
      where: { key },
      update: { value: value || "" },
      create: { key, value: value || "" },
    });

    return Response.json({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const settings = body.settings as Record<string, string>;

    if (!settings || typeof settings !== "object") {
      return Response.json(
        { success: false, error: "Settings object is required" },
        { status: 400 }
      );
    }

    // Update multiple settings
    for (const [key, value] of Object.entries(settings)) {
      await db.settings.upsert({
        where: { key },
        update: { value: value || "" },
        create: { key, value: value || "" },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
