import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createErrorResponse } from "@/lib/errors";
import { addDays, format } from "date-fns";
import { sendEmail, paymentApprovedEmailTemplate, paymentRejectedEmailTemplate } from "@/lib/email";
import { formatCurrency } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const { status } = body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return Response.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // Get payment
    const payment = await db.payment.findUnique({
      where: { id },
      include: { plan: true, user: true },
    });

    if (!payment) {
      return Response.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    if (payment.status !== "PENDING") {
      return Response.json(
        { success: false, error: "Payment already processed" },
        { status: 400 }
      );
    }

    // Update payment status
    await db.payment.update({
      where: { id },
      data: {
        status,
        verifiedById: admin.id,
      },
    });

    // If approved, create or extend subscription
    if (status === "APPROVED") {
      // Check for existing active subscription
      const existingSubscription = await db.subscription.findFirst({
        where: {
          userId: payment.userId,
          status: "ACTIVE",
          endDate: { gte: new Date() },
        },
      });

      const startDate = existingSubscription
        ? existingSubscription.endDate
        : new Date();
      const endDate = addDays(startDate, payment.plan.durationDays);

      if (existingSubscription) {
        // Extend existing subscription
        await db.subscription.update({
          where: { id: existingSubscription.id },
          data: { endDate },
        });
      } else {
        // Create new subscription
        await db.subscription.create({
          data: {
            userId: payment.userId,
            planId: payment.planId,
            startDate,
            endDate,
            status: "ACTIVE",
          },
        });
      }

      // Send approval email to user
      await sendEmail({
        to: payment.user.email,
        subject: "Payment Approved - Subscription Activated!",
        html: paymentApprovedEmailTemplate({
          userName: payment.user.name,
          planName: payment.plan.name,
          amount: formatCurrency(payment.amount),
          expiryDate: format(endDate, "MMMM d, yyyy"),
        }),
      });
    } else {
      // Send rejection email to user
      await sendEmail({
        to: payment.user.email,
        subject: "Payment Not Approved",
        html: paymentRejectedEmailTemplate({
          userName: payment.user.name,
          planName: payment.plan.name,
          amount: formatCurrency(payment.amount),
        }),
      });
    }

    return Response.json({
      success: true,
      message: `Payment ${status.toLowerCase()}`,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
