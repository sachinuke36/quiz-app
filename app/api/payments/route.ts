import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { paymentSchema } from "@/lib/validations";
import { createErrorResponse } from "@/lib/errors";
import { sendEmail, paymentReceivedEmailTemplate } from "@/lib/email";
import { formatCurrency } from "@/lib/utils";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payments = await db.payment.findMany({
      where: { userId: user.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, data: payments });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = paymentSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { planId, amount, utrNumber, screenshotUrl } = result.data;

    // Verify plan exists
    const plan = await db.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return Response.json(
        { success: false, error: "Plan not found or inactive" },
        { status: 404 }
      );
    }

    // Check for duplicate UTR
    if (utrNumber) {
      const existingPayment = await db.payment.findFirst({
        where: { utrNumber },
      });
      if (existingPayment) {
        return Response.json(
          { success: false, error: "This UTR number has already been used" },
          { status: 400 }
        );
      }
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        planId,
        amount,
        utrNumber,
        screenshotUrl: screenshotUrl || null,
        status: "PENDING",
      },
    });

    // Send email notification to admin
    const adminEmailSetting = await db.settings.findUnique({
      where: { key: "admin_email" },
    });

    if (adminEmailSetting?.value) {
      await sendEmail({
        to: adminEmailSetting.value,
        subject: `New Payment: ${plan.name} - ${formatCurrency(amount)}`,
        html: paymentReceivedEmailTemplate({
          userName: user.name,
          userEmail: user.email,
          planName: plan.name,
          amount: formatCurrency(amount),
          utrNumber: utrNumber || "N/A",
        }),
      });
    }

    return Response.json({
      success: true,
      message: "Payment submitted successfully",
      data: payment,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
