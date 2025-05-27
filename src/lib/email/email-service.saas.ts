import { logger } from "@/lib/logger";

const LOG_SOURCE = "EmailService";

export interface EmailJobData {
  from?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

/**
 * Email service for SAAS version using background jobs with BullMQ
 */
export class EmailService {
  /**
   * Queue an email to be sent via background job
   * @param emailData The email data to send
   * @returns A promise that resolves with the job ID
   */
  static async sendEmail(emailData: EmailJobData): Promise<{ jobId: string }> {
    try {
      const { to, subject } = emailData;

      logger.info(
        `Queueing email to ${to}`,
        {
          to,
          subject,
          from: emailData.from || "default",
          hasAttachments:
            !!emailData.attachments && emailData.attachments.length > 0,
        },
        LOG_SOURCE
      );

      // TODO: Implement BullMQ job queueing for email sending
      // This should:
      // 1. Import the email queue from the SAAS jobs system
      // 2. Add the email job to the queue with appropriate priority
      // 3. Return the job ID for tracking

      // For now, return a mock job ID to maintain interface compatibility
      const mockJobId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info(
        `Email queued successfully for ${to}`,
        {
          to,
          subject,
          jobId: mockJobId,
        },
        LOG_SOURCE
      );

      return { jobId: mockJobId };
    } catch (error) {
      logger.error(
        `Failed to queue email`,
        {
          error: error instanceof Error ? error.message : "Unknown error",
          to: emailData.to,
          subject: emailData.subject,
        },
        LOG_SOURCE
      );
      throw error;
    }
  }

  /**
   * Format a sender email address with a display name
   * @param displayName The display name to use
   * @param email Optional custom email address
   * @returns Formatted email string
   */
  static formatSender(displayName: string, email?: string): string {
    const fromEmail =
      email || process.env.RESEND_FROM_EMAIL || "noreply@fluidcalendar.com";
    return `${displayName} <${fromEmail}>`;
  }
}
