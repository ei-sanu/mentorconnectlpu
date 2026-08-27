"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardEventsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("../database/schemas/user.schema");
const dashboard_events_gateway_1 = require("./dashboard-events.gateway");
const dashboard_events_service_1 = require("./dashboard-events.service");
let DashboardEventsModule = class DashboardEventsModule {
};
exports.DashboardEventsModule = DashboardEventsModule;
exports.DashboardEventsModule = DashboardEventsModule = __decorate([
    (0, common_1.Module)({
        imports: [mongoose_1.MongooseModule.forFeature([{ name: user_schema_1.User.name, schema: user_schema_1.UserSchema }])],
        providers: [dashboard_events_gateway_1.DashboardEventsGateway, dashboard_events_service_1.DashboardEventsService],
        exports: [dashboard_events_service_1.DashboardEventsService],
    })
], DashboardEventsModule);
//# sourceMappingURL=dashboard-events.module.js.map