"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const analytics_service_1 = require("./analytics.service");
const analytics_controller_1 = require("./analytics.controller");
const alumni_officer_controller_1 = require("./alumni-officer.controller");
const placement_officer_controller_1 = require("./placement-officer.controller");
const auth_module_1 = require("../auth/auth.module");
const matching_module_1 = require("../matching/matching.module");
const alumni_verification_schema_1 = require("../database/schemas/alumni-verification.schema");
const mentor_profile_schema_1 = require("../database/schemas/mentor-profile.schema");
const student_profile_schema_1 = require("../database/schemas/student-profile.schema");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            matching_module_1.MatchingModule,
            mongoose_1.MongooseModule.forFeature([
                { name: alumni_verification_schema_1.AlumniVerification.name, schema: alumni_verification_schema_1.AlumniVerificationSchema },
                { name: mentor_profile_schema_1.MentorProfile.name, schema: mentor_profile_schema_1.MentorProfileSchema },
                { name: student_profile_schema_1.StudentProfile.name, schema: student_profile_schema_1.StudentProfileSchema },
            ]),
        ],
        controllers: [analytics_controller_1.AnalyticsController, alumni_officer_controller_1.AlumniOfficerController, placement_officer_controller_1.PlacementOfficerController],
        providers: [analytics_service_1.AnalyticsService],
        exports: [analytics_service_1.AnalyticsService],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map