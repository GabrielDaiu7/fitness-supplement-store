import express from 'express';
import { createRefreshTokenCookieOptions } from '../utils/cookies';
import {
  getProfile,
  loginUser,
  recordVerificationFailure,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendVerification,
  sendWelcomePerkEmail,
  trackAuthEvent,
  updateOnboardingProfile,
  verifyEmailToken,
} from '../services/auth.service';
import { isRealEmailEnabled } from '../services/mailer.service';
import { AuthedRequest } from '../types/auth';

export async function registerController(req: express.Request, res: express.Response) {
  try {
    const name = String(req.body?.name ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '').trim();

    if (!name || !email || password.length < 6) {
      res.status(400).json({ ok: false, message: 'Invalid registration payload' });
      return;
    }

    const result = await registerUser(name, email, password);
    if (result.conflict) {
      res.status(409).json({ ok: false, message: 'An account with this email already exists. Try logging in instead.' });
      return;
    }

    res.cookie('fusion_refresh', result.refreshToken, createRefreshTokenCookieOptions());
    const exposeToken = !isRealEmailEnabled();
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
        welcomePerkClaimedAt: null,
      },
      verification: { required: true, token: exposeToken ? result.verificationToken : undefined },
      welcome: { couponCode: result.welcomeCoupon, freeShippingOver: 70 },
    });
  } catch {
    res.status(500).json({ ok: false, message: 'Registration failed' });
  }
}

export async function loginController(req: express.Request, res: express.Response) {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '').trim();

    const result = await loginUser(email, password);
    if (!result) {
      res.status(401).json({ ok: false, message: 'Invalid credentials' });
      return;
    }

    res.cookie('fusion_refresh', result.refreshToken, createRefreshTokenCookieOptions());
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
        welcomePerkClaimedAt: result.user.welcomePerkClaimedAt ?? null,
      },
    });
  } catch {
    res.status(500).json({ ok: false, message: 'Login failed' });
  }
}

export async function refreshController(req: express.Request, res: express.Response) {
  try {
    const accessToken = await refreshAccessToken(req.cookies?.fusion_refresh as string | undefined);
    if (!accessToken) {
      res.json({ ok: false });
      return;
    }
    res.json({ ok: true, accessToken });
  } catch {
    res.json({ ok: false });
  }
}

export async function logoutController(req: express.Request, res: express.Response) {
  await logoutUser(req.cookies?.fusion_refresh as string | undefined);
  res.clearCookie('fusion_refresh');
  res.json({ ok: true });
}

export async function meController(req: AuthedRequest, res: express.Response) {
  try {
    const user = await getProfile(req.user?.id);
    res.json({ ok: true, user });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load profile' });
  }
}

export async function verifyEmailController(req: express.Request, res: express.Response) {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const token = String(req.body?.token ?? '').trim();
  if (!email || !token) {
    res.status(400).json({ ok: false, message: 'Email and token required' });
    return;
  }
  const verified = await verifyEmailToken(email, token);
  if (!verified.ok) {
    await recordVerificationFailure(email);
    const message =
      verified.reason === 'expired_code'
        ? 'Verification code expired. Request a new code.'
        : verified.reason === 'max_attempts'
          ? 'Too many failed attempts. Request a new code.'
          : 'Invalid verification code.';
    res.status(400).json({ ok: false, message });
    return;
  }
  res.json({ ok: true, message: 'Email verified successfully' });
}

export async function resendVerificationController(req: express.Request, res: express.Response) {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!email) {
    res.status(400).json({ ok: false, message: 'Email required' });
    return;
  }
  const result = await resendVerification(email);
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
    verificationToken: isRealEmailEnabled() ? undefined : result.token,
  });
}

export async function updateOnboardingController(req: AuthedRequest, res: express.Response) {
  if (!req.user?.id) {
    res.status(401).json({ ok: false, message: 'Unauthorized' });
    return;
  }
  const profile = await updateOnboardingProfile(req.user.id, {
    goal: typeof req.body?.goal === 'string' ? req.body.goal.trim() : undefined,
    dietType: typeof req.body?.dietType === 'string' ? req.body.dietType.trim() : undefined,
    trainingFrequency: typeof req.body?.trainingFrequency === 'string' ? req.body.trainingFrequency.trim() : undefined,
    preferredShippingAddress:
      typeof req.body?.preferredShippingAddress === 'string' ? req.body.preferredShippingAddress.trim() : undefined,
    preferredCurrency: typeof req.body?.preferredCurrency === 'string' ? req.body.preferredCurrency.trim() : undefined,
    defaultShippingMethod:
      typeof req.body?.defaultShippingMethod === 'string' ? req.body.defaultShippingMethod.trim() : undefined,
    defaultSubscribeFrequency:
      typeof req.body?.defaultSubscribeFrequency === 'string' ? req.body.defaultSubscribeFrequency.trim() : undefined,
  });
  res.json({ ok: true, profile });
}

export async function trackAuthEventController(req: AuthedRequest, res: express.Response) {
  const eventName = String(req.body?.eventName ?? '').trim();
  if (!eventName) {
    res.status(400).json({ ok: false, message: 'eventName is required' });
    return;
  }
  await trackAuthEvent(
    eventName,
    req.user?.id,
    typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : undefined,
    typeof req.body?.metadata === 'object' && req.body?.metadata ? req.body.metadata : {}
  );
  res.json({ ok: true });
}

export async function dataRequestController(req: AuthedRequest, res: express.Response) {
  if (!req.user?.id) {
    res.status(401).json({ ok: false, message: 'Unauthorized' });
    return;
  }
  const requestType = String(req.body?.requestType ?? '').trim().toLowerCase();
  if (!['export', 'delete'].includes(requestType)) {
    res.status(400).json({ ok: false, message: 'Invalid request type' });
    return;
  }
  await trackAuthEvent(`data_${requestType}_requested`, req.user.id, req.user.email, {});
  res.json({ ok: true, message: `Data ${requestType} request submitted.` });
}

export async function sendWelcomePerkController(req: AuthedRequest, res: express.Response) {
  if (!req.user?.id) {
    res.status(401).json({ ok: false, message: 'Unauthorized' });
    return;
  }
  const sent = await sendWelcomePerkEmail(req.user.id);
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
