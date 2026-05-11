"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRefreshTokenCookieOptions = createRefreshTokenCookieOptions;
function createRefreshTokenCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 14 * 24 * 60 * 60 * 1000,
    };
}
