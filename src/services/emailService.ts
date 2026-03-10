import { env } from "../config/env";

class EmailService {
  /**
   * Check whether the email service is configured and available.
   */
  isConfigured(): boolean {
    const url = env.emailFlowUrl;
    return !!url && url !== "your-power-automate-http-trigger-url";
  }

  /**
   * Send an email notification via Power Automate HTTP trigger.
   * Returns silently if the service is not configured.
   */
  async sendEmailNotification(to: string, subject: string, body: string): Promise<void> {
    if (!this.isConfigured()) {
      console.warn("[EmailService] Email flow URL not configured — skipping email");
      return;
    }

    const response = await fetch(env.emailFlowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, subject, body }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Email send failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  }
}

export const emailService = new EmailService();
