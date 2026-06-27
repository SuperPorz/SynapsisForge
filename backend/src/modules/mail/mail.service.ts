import { Injectable } from '@nestjs/common';
import type { Transporter } from 'nodemailer';
import type { TemplateDelegate } from 'handlebars';

export interface SendWelcomeEmailInput {
  to: string;
  name: string;
}

export interface SendVerificationEmailInput {
  to: string;
  name: string;
  token: string;
}

export interface SendEnrollmentConfirmationInput {
  to: string;
  userName: string;
  courseTitle: string;
  courseUrl: string;
}

export interface SendDailyDigestInput {
  to: string;
  name: string;
  courseTitle: string;
  progress: number;
}

export interface SendSubscriptionFailedInput {
  to: string;
  name: string;
}

@Injectable()
export class MailService {
  constructor(
    private readonly transporter: Transporter,
    private readonly templates: Record<string, TemplateDelegate>,
    private readonly from: string,
    private readonly frontendUrl: string,
  ) {}

  private async send(
    template: string,
    to: string,
    subject: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    const html = this.templates[template]({
      ...context,
      frontendUrl: this.frontendUrl,
      year: new Date().getFullYear(),
    });
    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }

  async sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<void> {
    await this.send('welcome', input.to, 'Welcome to SynapsisForge!', {
      name: input.name,
    });
  }

  async sendVerificationEmail(
    input: SendVerificationEmailInput,
  ): Promise<void> {
    await this.send(
      'email-verification',
      input.to,
      'Verify your email — SynapsisForge',
      {
        name: input.name,
        token: input.token,
      },
    );
  }

  async sendEnrollmentConfirmation(
    input: SendEnrollmentConfirmationInput,
  ): Promise<void> {
    await this.send(
      'enrollment-confirmation',
      input.to,
      `Enrolled: ${input.courseTitle}`,
      {
        userName: input.userName,
        courseTitle: input.courseTitle,
        courseUrl: input.courseUrl,
      },
    );
  }

  async sendDailyDigest(input: SendDailyDigestInput): Promise<void> {
    await this.send('daily-digest', input.to, 'Your Daily Learning Digest', {
      name: input.name,
      courseTitle: input.courseTitle,
      progress: input.progress,
    });
  }

  async sendSubscriptionFailed(
    input: SendSubscriptionFailedInput,
  ): Promise<void> {
    await this.send(
      'subscription-failed',
      input.to,
      'Payment Failed — Subscription Issue',
      {
        name: input.name,
      },
    );
  }

  async sendTestEmail(to: string): Promise<void> {
    await this.send('welcome', to, 'Test Email from SynapsisForge', {
      name: 'Test User',
    });
  }
}
