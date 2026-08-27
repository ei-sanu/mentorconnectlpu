"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Msg91Module = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const msg91_service_1 = require("./msg91.service");
let Msg91Module = class Msg91Module {
};
exports.Msg91Module = Msg91Module;
exports.Msg91Module = Msg91Module = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [msg91_service_1.Msg91Service],
        exports: [msg91_service_1.Msg91Service],
    })
], Msg91Module);
//# sourceMappingURL=msg91.module.js.map