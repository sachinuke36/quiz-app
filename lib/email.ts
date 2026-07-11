import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || "Quiz App <onboarding@resend.dev>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // Skip if no API key configured
  if (!process.env.RESEND_API_KEY) {
    console.log("Email skipped (RESEND_API_KEY not configured):", { to, subject });
    return { success: true, skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error };
  }
}

// Email Templates
export function paymentReceivedEmailTemplate({
  userName,
  userEmail,
  planName,
  amount,
  utrNumber,
}: {
  userName: string;
  userEmail: string;
  planName: string;
  amount: string;
  utrNumber: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .details p { margin: 8px 0; }
        .label { color: #6b7280; font-size: 14px; }
        .value { font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Payment Received</h1>
        </div>
        <div class="content">
          <p>A new payment has been submitted and requires your verification.</p>

          <div class="details">
            <p><span class="label">User:</span> <span class="value">${userName}</span></p>
            <p><span class="label">Email:</span> <span class="value">${userEmail}</span></p>
            <p><span class="label">Plan:</span> <span class="value">${planName}</span></p>
            <p><span class="label">Amount:</span> <span class="value">${amount}</span></p>
            <p><span class="label">UTR Number:</span> <span class="value">${utrNumber}</span></p>
          </div>

          <p>Please verify this payment in the admin panel.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from Quiz App</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function paymentApprovedEmailTemplate({
  userName,
  planName,
  amount,
  expiryDate,
}: {
  userName: string;
  planName: string;
  amount: string;
  expiryDate: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .details p { margin: 8px 0; }
        .label { color: #6b7280; font-size: 14px; }
        .value { font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .success-icon { font-size: 48px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">&#10004;</div>
          <h1>Payment Approved!</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Great news! Your payment has been verified and your subscription is now active.</p>

          <div class="details">
            <p><span class="label">Plan:</span> <span class="value">${planName}</span></p>
            <p><span class="label">Amount Paid:</span> <span class="value">${amount}</span></p>
            <p><span class="label">Valid Until:</span> <span class="value">${expiryDate}</span></p>
          </div>

          <p>You now have full access to all quizzes. Start learning today!</p>
        </div>
        <div class="footer">
          <p>Thank you for subscribing to Quiz App</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function paymentRejectedEmailTemplate({
  userName,
  planName,
  amount,
  reason,
}: {
  userName: string;
  planName: string;
  amount: string;
  reason?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .details p { margin: 8px 0; }
        .label { color: #6b7280; font-size: 14px; }
        .value { font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Not Approved</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Unfortunately, we were unable to verify your payment.</p>

          <div class="details">
            <p><span class="label">Plan:</span> <span class="value">${planName}</span></p>
            <p><span class="label">Amount:</span> <span class="value">${amount}</span></p>
            ${reason ? `<p><span class="label">Reason:</span> <span class="value">${reason}</span></p>` : ""}
          </div>

          <p>This could be due to:</p>
          <ul>
            <li>Incorrect UTR number</li>
            <li>Payment not received</li>
            <li>Amount mismatch</li>
          </ul>

          <p>Please try again or contact support if you believe this is an error.</p>
        </div>
        <div class="footer">
          <p>Quiz App Support</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
