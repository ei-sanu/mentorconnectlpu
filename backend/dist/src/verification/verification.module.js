"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationModule = void 0;
const common_1 = require("@nestjs/common");
const verification_service_1 = require("./verification.service");
const verification_controller_1 = require("./verification.controller");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const notifications_module_1 = require("../notifications/notifications.module");
const msg91_module_1 = require("../integrations/msg91/msg91.module");
const dashboard_events_module_1 = require("../events/dashboard-events.module");
let VerificationModule = class VerificationModule {
};
exports.VerificationModule = VerificationModule;
exports.VerificationModule = VerificationModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, audit_module_1.AuditModule, notifications_module_1.NotificationsModule, msg91_module_1.Msg91Module, dashboard_events_module_1.DashboardEventsModule],
        controllers: [verification_controller_1.VerificationController],
        providers: [verification_service_1.VerificationService],
        exports: [verification_service_1.VerificationService],
    })
], VerificationModule);
//# sourceMappingURL=verification.module.js.map