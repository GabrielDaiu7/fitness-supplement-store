"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const auth_1 = require("./config/auth");
const admin_routes_1 = require("./modules/admin.routes");
const auth_routes_1 = __importDefault(require("./modules/auth.routes"));
const public_routes_1 = __importDefault(require("./modules/public.routes"));
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({ origin: (0, auth_1.getCorsOrigins)(), credentials: true }));
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.use('/api', public_routes_1.default);
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/account', admin_routes_1.accountRouter);
    app.use('/api/admin', admin_routes_1.adminRouter);
    return app;
}
