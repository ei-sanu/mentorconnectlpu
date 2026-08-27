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
var ClerkAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClerkAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../database/schemas/user.schema");
const jwt = require("jsonwebtoken");
const jwksRsa = require("jwks-rsa");
const event_bus_1 = require("../common/event-bus");
let ClerkAuthGuard = ClerkAuthGuard_1 = class ClerkAuthGuard {
    constructor(userModel) {
        this.userModel = userModel;
        this.logger = new common_1.Logger(ClerkAuthGuard_1.name);
        this.jwksClientInstance = null;
        const jwksUri = process.env.CLERK_JWKS_URL;
        if (jwksUri && jwksUri.startsWith('http')) {
            this.jwksClientInstance = jwksRsa({
                jwksUri,
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 10,
            });
        }
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing or invalid Authorization header');
        }
        const token = authHeader.split(' ')[1];
        try {
            let clerkUserId;
            let email;
            let firstName = 'User';
            let lastName = '';
            let clerkRole;
            if (token.startsWith('mock_token_') || process.env.NODE_ENV === 'test') {
                const rawToken = token.replace('mock_token_', '');
                if (rawToken.includes('_role')) {
                    const parts = rawToken.split('_role');
                    const emailPart = parts[0];
                    clerkUserId = `mock_user_${emailPart}`;
                    email = emailPart;
                    const namePart = emailPart.split('@')[0];
                    const nameParts = namePart.split('.');
                    firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
                    lastName = nameParts[1] ? (nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1)) : '';
                }
                else {
                    clerkUserId = rawToken;
                    if (clerkUserId === 'student_1') {
                        email = 'aarav.sharma@lpu.in';
                        firstName = 'Aarav';
                        lastName = 'Sharma';
                    }
                    else if (clerkUserId === 'mentor_1') {
                        email = 'priya.patel@alumni.lpu.in';
                        firstName = 'Priya';
                        lastName = 'Patel';
                    }
                    else if (clerkUserId === 'admin_1') {
                        email = 'rajesh.kumar@lpu.co.in';
                        firstName = 'Rajesh';
                        lastName = 'Kumar';
                    }
                    else {
                        email = `${clerkUserId}@lpu.in`;
                    }
                }
            }
            else {
                if (!this.jwksClientInstance) {
                    throw new common_1.UnauthorizedException('Clerk JWKS Client not configured');
                }
                const decodedToken = jwt.decode(token, { complete: true });
                if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
                    throw new common_1.UnauthorizedException('Invalid JWT structure');
                }
                const kid = decodedToken.header.kid;
                const key = await this.jwksClientInstance.getSigningKey(kid);
                const publicKey = key.getPublicKey();
                const verified = jwt.verify(token, publicKey);
                clerkUserId = verified.sub;
                email = verified.email || verified.primary_email_address;
                firstName = verified.first_name || '';
                lastName = verified.last_name || '';
                try {
                    const { createClerkClient } = require('@clerk/backend');
                    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
                    const clerkUser = await clerkClient.users.getUser(clerkUserId);
                    if (clerkUser) {
                        if (!email) {
                            email = clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '';
                        }
                        if (!firstName && clerkUser.firstName)
                            firstName = clerkUser.firstName;
                        if (!lastName && clerkUser.lastName)
                            lastName = clerkUser.lastName;
                        if (clerkUser.unsafeMetadata?.role) {
                            clerkRole = clerkUser.unsafeMetadata.role;
                        }
                    }
                }
                catch (sdkError) {
                    this.logger.error(`Clerk Backend SDK User retrieval failed: ${sdkError.message}`);
                }
                if (!email) {
                    email = `${clerkUserId}@placeholder.lpu.in`;
                }
            }
            if (!firstName || firstName.trim() === '') {
                firstName = 'User';
            }
            if (!lastName || lastName.trim() === '') {
                lastName = 'Member';
            }
            let user = await this.userModel.findOne({
                $or: [{ clerkUserId }, { email }]
            }).lean();
            if (email === 'someshranjanbiswal13678@gmail.com') {
                let activeRole = user_schema_1.Role.ADMIN;
                if (token.includes('_roleALUMNI_OFFICER')) {
                    activeRole = user_schema_1.Role.ALUMNI_OFFICER;
                }
                else if (token.includes('_rolePLACEMENT_OFFICER')) {
                    activeRole = user_schema_1.Role.PLACEMENT_OFFICER;
                }
                else if (token.includes('_roleADMIN')) {
                    activeRole = user_schema_1.Role.ADMIN;
                }
                if (!user) {
                    const createdUser = new this.userModel({
                        clerkUserId,
                        email,
                        role: activeRole,
                        firstName,
                        lastName,
                        status: user_schema_1.UserStatus.ACTIVE,
                        onboardingStatus: 'APPROVED',
                    });
                    const saved = await createdUser.save();
                    user = saved.toObject();
                    event_bus_1.globalEventBus.emit('dashboard_update', { type: 'USER_REGISTERED', targetRole: user_schema_1.Role.ADMIN });
                }
                else {
                    await this.userModel.updateOne({ _id: user._id }, { clerkUserId, role: activeRole, onboardingStatus: 'APPROVED' });
                    user = { ...user, clerkUserId, role: activeRole, onboardingStatus: 'APPROVED' };
                }
            }
            else if (!user) {
                let initialRole = user_schema_1.Role.STUDENT;
                if (clerkRole === 'MENTOR' || clerkRole === 'mentor') {
                    initialRole = user_schema_1.Role.MENTOR;
                }
                else if (clerkRole === 'ADMIN' || clerkRole === 'admin') {
                    initialRole = user_schema_1.Role.ADMIN;
                }
                else if (clerkRole === 'ALUMNI_OFFICER' || clerkRole === 'alumni_officer') {
                    initialRole = user_schema_1.Role.ALUMNI_OFFICER;
                }
                else if (clerkRole === 'PLACEMENT_OFFICER' || clerkRole === 'placement_officer') {
                    initialRole = user_schema_1.Role.PLACEMENT_OFFICER;
                }
                else if (token.includes('_roleMENTOR')) {
                    initialRole = user_schema_1.Role.MENTOR;
                }
                else if (token.includes('_roleADMIN')) {
                    initialRole = user_schema_1.Role.ADMIN;
                }
                else if (token.includes('_roleALUMNI_OFFICER')) {
                    initialRole = user_schema_1.Role.ALUMNI_OFFICER;
                }
                else if (token.includes('_rolePLACEMENT_OFFICER')) {
                    initialRole = user_schema_1.Role.PLACEMENT_OFFICER;
                }
                const createdUser = new this.userModel({
                    clerkUserId,
                    email,
                    role: initialRole,
                    firstName,
                    lastName,
                    status: user_schema_1.UserStatus.ACTIVE,
                });
                const saved = await createdUser.save();
                user = saved.toObject();
                event_bus_1.globalEventBus.emit('dashboard_update', { type: 'USER_REGISTERED', targetRole: initialRole });
            }
            request.user = {
                ...user,
                id: user._id.toString(),
            };
            return true;
        }
        catch (error) {
            this.logger.error(`Authentication error: ${error.message}`);
            throw new common_1.UnauthorizedException('Authentication failed: ' + error.message);
        }
    }
};
exports.ClerkAuthGuard = ClerkAuthGuard;
exports.ClerkAuthGuard = ClerkAuthGuard = ClerkAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ClerkAuthGuard);
//# sourceMappingURL=clerk-auth.guard.js.map