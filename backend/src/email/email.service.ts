import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../database/schemas/user.schema';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey !== 're_mockkey' && !apiKey.startsWith('re_test')) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendNotificationEmail(userId: string, type: string, title: string, message: string) {
    try {
      const user = await this.userModel.findById(userId).lean();

      if (!user || !user.email) {
        this.logger.warn(`Cannot send email: user ${userId} has no valid email`);
        return;
      }

      const from = process.env.EMAIL_FROM || 'LPU MentorConnect <noreply@mentorconnect.lpu.in>';

      if (this.resend) {
        this.logger.log(`Sending real email via Resend to ${user.email}: ${title}`);
        await this.resend.emails.send({
          from,
          to: user.email,
          subject: title,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #ea580c;">LPU MentorConnect</h2>
              <h3>${title}</h3>
              <p>${message}</p>
              <br/>
              <hr style="border: none; border-top: 1px solid #eee;" />
              <p style="font-size: 12px; color: #777;">Lovely Professional University Alumni Mentorship Network</p>
            </div>
          `,
        });
      } else {
        this.logger.log(
          `[MOCK EMAIL SENT]
           From: ${from}
           To: ${user.email}
           Subject: ${title}
           Body: ${message}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
    }
  }
}
