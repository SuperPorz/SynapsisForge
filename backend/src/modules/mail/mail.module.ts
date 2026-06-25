import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { createTransport } from 'nodemailer';
import { compile } from 'handlebars';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

function loadTemplates(): Record<string, ReturnType<typeof compile>> {
  const templatesDir = join(__dirname, 'templates');
  if (!existsSync(templatesDir)) return {};
  const files = readdirSync(templatesDir).filter((f) => f.endsWith('.hbs'));
  const templates: Record<string, ReturnType<typeof compile>> = {};
  for (const file of files) {
    const name = file.replace('.hbs', '');
    templates[name] = compile(readFileSync(join(templatesDir, file), 'utf-8'));
  }
  return templates;
}

@Module({
  imports: [],
  providers: [
    {
      provide: MailService,
      useFactory: (configService: ConfigService) => {
        const transporter = createTransport({
          host: configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
          port: configService.get<number>('SMTP_PORT', 587),
          secure: false,
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        });
        const templates = loadTemplates();
        return new MailService(
          transporter,
          templates,
          configService.get<string>('SMTP_FROM', 'noreply@synapsisforge.com'),
          configService.get<string>('FRONTEND_URL', 'http://localhost:4200'),
        );
      },
      inject: [ConfigService],
    },
  ],
  exports: [MailService],
})
export class MailModule {}
