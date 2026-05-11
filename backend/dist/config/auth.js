"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_REFRESH_SECRET = exports.JWT_ACCESS_SECRET = void 0;
exports.createAccessToken = createAccessToken;
exports.createRefreshToken = createRefreshToken;
exports.getCorsOrigins = getCorsOrigins;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'access-dev-secret';
exports.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'refresh-dev-secret';
function createAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, exports.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}
function createRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, exports.JWT_REFRESH_SECRET, { expiresIn: '14d' });
}
function getCorsOrigins() {
    return (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}
