import { isSaasEnabled } from "@/lib/config";
import { logger } from "@/lib/logger";

import { getPasswordResetTemplate } from "./templates/password-reset";

const LOG_SOURCE = "PasswordResetEmail";

interface SendPasswordResetEmailProps {
  email: string;
  name: string;
  resetToken: string;
  expirationDate: Date;
}

/**
 * Sends a password reset email to a user
 */
export async function sendPasswordResetEmail({
  email,
  name,
  resetToken,
  expirationDate,
}: SendPasswordResetEmailProps) {
  try {
    // Generate the reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    // Get the email template
    const html = getPasswordResetTemplate(name, resetLink, expirationDate);

    // Import the correct email service based on SAAS flag
    let EmailService;
    if (isSaasEnabled) {
      const emailModule = await import("./email-service.saas");
      EmailService = emailModule.EmailService;
    } else {
      const emailModule = await import("./email-service.open");
      EmailService = emailModule.EmailService;
    }

    // Send the email using the appropriate service
    const { jobId } = await EmailService.sendEmail({
      from: EmailService.formatSender("FluidCalendar"),
      to: email,
      subject: "Reset Your FluidCalendar Password",
      html,
    });

    logger.info("Password reset email sent", { email, jobId }, LOG_SOURCE);

    return { success: true, jobId };
  } catch (error) {
    logger.error(
      "Failed to send password reset email",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        email,
      },
      LOG_SOURCE
    );

    throw error;
  }
}
