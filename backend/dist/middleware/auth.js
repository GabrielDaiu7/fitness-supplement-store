"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authGuard = authGuard;
exports.adminGuard = adminGuard;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../config/auth");
function authGuard(req, res, next) {
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) {
        res.status(401).json({ ok: false, message: 'Unauthorized' });
        return;
    }
    try {
        req.user = jsonwebtoken_1.default.verify(token, auth_1.JWT_ACCESS_SECRET);
        next();
    }
    catch {
        res.status(401).json({ ok: false, message: 'Session expired' });
    }
}
function adminGuard(req, res, next) {
    if (!req.user?.isAdmin) {
        res.status(403).json({ ok: false, message: 'Admin access required' });
        return;
    }
    next();
}
