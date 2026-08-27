"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../database/schemas/user.schema");
const resend_1 = require("resend");
let EmailService = EmailService_1 = class EmailService {
    constructor(userModel) {
        this.userModel = userModel;
        this.logger = new common_1.Logger(EmailService_1.name);
        this.resend = null;
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey && apiKey !== 're_mockkey' && !apiKey.startsWith('re_test')) {
            this.resend = new resend_1.Resend(apiKey);
        }
    }
    async sendNotificationEmail(userId, type, title, message) {
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
            }
            else {
                this.logger.log(`[MOCK EMAIL SENT]
           From: ${from}
           To: ${user.email}
           Subject: ${title}
           Body: ${message}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to send email: ${error.message}`);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], EmailService);
//# sourceMappingURL=email.service.js.map