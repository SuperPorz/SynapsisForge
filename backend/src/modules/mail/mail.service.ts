import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface SendWelcomeEmailInput {
  to: string;
  name: string;
}

export interface SendEnrollmentConfirmationInput {
  to: string;
  userName: string;
  courseTitle: string;
  courseUrl: string;
}

@Injectable()
export class MailService {
  private readonly frontendUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
  }

  async sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<void> {
    await this.mailerService.sendMail({
      to: input.to,
      subject: 'Welcome to SynapsisForge!',
      template: './welcome',
      context: {
        name: input.name,
        frontendUrl: this.frontendUrl,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendEnrollmentConfirmation(
    input: SendEnrollmentConfirmationInput,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: input.to,
      subject: `Enrolled: ${input.courseTitle}`,
      template: './enrollment-confirmation',
      context: {
        userName: input.userName,
        courseTitle: input.courseTitle,
        courseUrl: input.courseUrl,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendTestEmail(to: string): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Test Email from SynapsisForge',
      template: './welcome',
      context: {
        name: 'Test User',
        frontendUrl: this.frontendUrl,
        year: new Date().getFullYear(),
      },
    });
  }
}
