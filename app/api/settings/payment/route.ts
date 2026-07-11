import { db } from "@/lib/db";
import { createErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const settings = await db.settings.findMany({
      where: {
        key: {
          in: ["payment_qr_code", "payment_upi_id"],
        },
      },
    });

    const settingsObj: Record<string, string> = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    return Response.json({
      success: true,
      data: {
        qrCodeUrl: settingsObj["payment_qr_code"] || null,
        upiId: settingsObj["payment_upi_id"] || null,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
