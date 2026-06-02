import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

interface VerificationEmailPayload {
  email: string;
  fullName: string;
  verificationLink: string;
}

interface ResetPasswordEmailPayload {
  email: string;
  fullName: string;
  resetLink: string;
}

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(
    payload: VerificationEmailPayload,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: payload.email,
        subject: 'Verify your Travel Hub account',
        html: `
          <p>Hi ${payload.fullName},</p>
          <p>Please verify your Travel Hub account by clicking the link below:</p>
          <p><a href="${payload.verificationLink}">Verify my email</a></p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });
    } catch (e) {
      console.warn('Failed to send verification email (dev mode):', payload.verificationLink);
    }
  }

  async sendResetPasswordEmail(
    payload: ResetPasswordEmailPayload,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: payload.email,
        subject: 'Reset your Travel Hub password',
        html: `
          <p>Hi ${payload.fullName},</p>
          <p>You requested to reset your password. Click the link below to continue:</p>
          <p><a href="${payload.resetLink}">Reset my password</a></p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });
    } catch (e) {
      console.warn('Failed to send reset password email (dev mode):', payload.resetLink);
    }
  }
}
