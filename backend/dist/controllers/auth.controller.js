"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerController = registerController;
exports.loginController = loginController;
exports.refreshController = refreshController;
exports.logoutController = logoutController;
exports.meController = meController;
exports.verifyEmailController = verifyEmailController;
exports.resendVerificationController = resendVerificationController;
exports.updateOnboardingController = updateOnboardingController;
exports.trackAuthEventController = trackAuthEventController;
exports.dataRequestController = dataRequestController;
exports.sendWelcomePerkController = sendWelcomePerkController;
const cookies_1 = require("../utils/cookies");
const auth_service_1 = require("../services/auth.service");
const mailer_service_1 = require("../services/mailer.service");
async function registerController(req, res) {
    try {
        const name = String(req.body?.name ?? '').trim();
        const email = String(req.body?.email ?? '').trim().toLowerCase();
        const password = String(req.body?.password ?? '').trim();
        if (!name || !email || password.length < 6) {
            res.status(400).json({ ok: false, message: 'Invalid registration payload' });
            return;
        }
        const result = await (0, auth_service_1.registerUser)(name, email, password);
        if (result.conflict) {
            res.status(409).json({ ok: false, message: 'An account with this email already exists. Try logging in instead.' });
            return;
        }
        res.cookie('fusion_refresh', result.refreshToken, (0, cookies_1.createRefreshTokenCookieOptions)());
        const exposeToken = !(0, mailer_service_1.isRealEmailEnabled)();
        res.json({
            ok: true,
            accessToken: result.accessToken,
            user: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                isAdmin: result.user.isAdmin,
                emailVerified: false,
                welcomeCoupon: result.welcomeCoupon,
            },
            verification: { required: true, token: exposeToken ? result.verificationToken : undefined },
            welcome: { couponCode: result.welcomeCoupon, freeShippingOver: 70 },
        });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Registration failed' });
    }
}
async function loginController(req, res) {
    try {
        const email = String(req.body?.email ?? '').trim().toLowerCase();
        const password = String(req.body?.password ?? '').trim();
        const result = await (0, auth_service_1.loginUser)(email, password);
        if (!result) {
            res.status(401).json({ ok: false, message: 'Invalid credentials' });
            return;
        }
        res.cookie('fusion_refresh', result.refreshToken, (0, cookies_1.createRefreshTokenCookieOptions)());
        res.json({
            ok: true,
            accessToken: result.accessToken,
            user: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                isAdmin: result.user.isAdmin,
                emailVerified: result.user.emailVerified,
                welcomeCoupon: result.user.welcomeCoupon,
            },
        });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Login failed' });
    }
}
async function refreshController(req, res) {
    try {
        const accessToken = await (0, auth_service_1.refreshAccessToken)(req.cookies?.fusion_refresh);
        if (!accessToken) {
            res.json({ ok: false });
            return;
        }
        res.json({ ok: true, accessToken });
    }
    catch {
        res.json({ ok: false });
    }
}
async function logoutController(req, res) {
    await (0, auth_service_1.logoutUser)(req.cookies?.fusion_refresh);
    res.clearCookie('fusion_refresh');
    res.json({ ok: true });
}
async function meController(req, res) {
    try {
        const user = await (0, auth_service_1.getProfile)(req.user?.id);
        res.json({ ok: true, user });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load profile' });
    }
}
async function verifyEmailController(req, res) {
    const token = String(req.body?.token ?? '').trim();
    if (!token) {
        res.status(400).json({ ok: false, message: 'Token required' });
        return;
    }
    const verified = await (0, auth_service_1.verifyEmailToken)(token);
    if (!verified.ok) {
        await (0, auth_service_1.recordVerificationFailure)(token);
        const message = verified.reason === 'expired_code'
            ? 'Verification code expired. Request a new code.'
            : verified.reason === 'max_attempts'
                ? 'Too many failed attempts. Request a new code.'
                : 'Invalid verification code.';
        res.status(400).json({ ok: false, message });
        return;
    }
    res.json({ ok: true, message: 'Email verified successfully' });
}
async function resendVerificationController(req, res) {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    if (!email) {
        res.status(400).json({ ok: false, message: 'Email required' });
        return;
    }
    const result = await (0, auth_service_1.resendVerification)(email);
    if (!result) {
        res.status(404).json({ ok: false, message: 'Account not found' });
        return;
    }
    if ('alreadyVerified' in result && result.alreadyVerified) {
        res.status(400).json({ ok: false, message: 'Email is already verified.' });
        return;
    }
    if ('cooldown' in result && result.cooldown) {
        res.status(429).json({ ok: false, message: 'Please wait before requesting another code.' });
        return;
    }
    res.json({
        ok: true,
        message: 'Verification re-sent',
        verificationToken: (0, mailer_service_1.isRealEmailEnabled)() ? undefined : result.token,
    });
}
async function updateOnboardingController(req, res) {
    if (!req.user?.id) {
        res.status(401).json({ ok: false, message: 'Unauthorized' });
        return;
    }
    const profile = await (0, auth_service_1.updateOnboardingProfile)(req.user.id, {
        goal: typeof req.body?.goal === 'string' ? req.body.goal.trim() : undefined,
        dietType: typeof req.body?.dietType === 'string' ? req.body.dietType.trim() : undefined,
        trainingFrequency: typeof req.body?.trainingFrequency === 'string' ? req.body.trainingFrequency.trim() : undefined,
        preferredShippingAddress: typeof req.body?.preferredShippingAddress === 'string' ? req.body.preferredShippingAddress.trim() : undefined,
        preferredCurrency: typeof req.body?.preferredCurrency === 'string' ? req.body.preferredCurrency.trim() : undefined,
        defaultShippingMethod: typeof req.body?.defaultShippingMethod === 'string' ? req.body.defaultShippingMethod.trim() : undefined,
        defaultSubscribeFrequency: typeof req.body?.defaultSubscribeFrequency === 'string' ? req.body.defaultSubscribeFrequency.trim() : undefined,
    });
    res.json({ ok: true, profile });
}
async function trackAuthEventController(req, res) {
    const eventName = String(req.body?.eventName ?? '').trim();
    if (!eventName) {
        res.status(400).json({ ok: false, message: 'eventName is required' });
        return;
    }
    await (0, auth_service_1.trackAuthEvent)(eventName, req.user?.id, typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : undefined, typeof req.body?.metadata === 'object' && req.body?.metadata ? req.body.metadata : {});
    res.json({ ok: true });
}
async function dataRequestController(req, res) {
    if (!req.user?.id) {
        res.status(401).json({ ok: false, message: 'Unauthorized' });
        return;
    }
    const requestType = String(req.body?.requestType ?? '').trim().toLowerCase();
    if (!['export', 'delete'].includes(requestType)) {
        res.status(400).json({ ok: false, message: 'Invalid request type' });
        return;
    }
    await (0, auth_service_1.trackAuthEvent)(`data_${requestType}_requested`, req.user.id, req.user.email, {});
    res.json({ ok: true, message: `Data ${requestType} request submitted.` });
}
async function sendWelcomePerkController(req, res) {
    if (!req.user?.id) {
        res.status(401).json({ ok: false, message: 'Unauthorized' });
        return;
    }
    const sent = await (0, auth_service_1.sendWelcomePerkEmail)(req.user.id);
    if (!sent) {
        res.status(404).json({ ok: false, message: 'Account not found' });
        return;
    }
    res.json({
        ok: true,
        message: sent.alreadyClaimed ? 'Welcome perk already claimed previously.' : 'Welcome perks sent to your email.',
        alreadyClaimed: sent.alreadyClaimed,
    });
}
