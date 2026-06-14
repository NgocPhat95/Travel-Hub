import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: process.env.MAIL_HOST
        ? {
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT || 587),
            secure: process.env.MAIL_SECURE === 'true',
            auth: {
              user: process.env.MAIL_USER,
              pass: process.env.MAIL_PASS,
            },
          }
        : {
            name: 'dev-mock-transport',
            version: '1.0.0',
            send: (mail: any, callback: any) => {
              console.log('📬 [Dev Mail Mock] Email captured:', {
                to: mail.data.to,
                subject: mail.data.subject,
                text: mail.data.text,
              });
              callback(null, { messageId: 'dev-mock-id-' + Date.now() });
            },
            verify: (callback?: any) => {
              if (callback) {
                callback(null, true);
              }
              return Promise.resolve(true);
            },
          } as any,
      defaults: {
        from:
          process.env.MAIL_FROM || '"Travel Hub" <no-reply@travelhub.local>',
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

