import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { createAccessToken, createRefreshToken, JWT_REFRESH_SECRET } from '../config/auth';
import { AuthPayload } from '../types/auth';
import { sendEmail } from './mailer.service';

const VERIFICATION_TTL_MINUTES = 10;
const VERIFICATION_MAX_ATTEMPTS = 5;
const VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function registerUser(name: string, email: string, password: string) {
  await pool.query(
    `INSERT INTO auth_events (event_name, email, metadata)
     VALUES ('register_started', $1, $2::jsonb)`,
    [email, JSON.stringify({ source: 'web' })]
  );
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return { conflict: true as const };
  }

  const verificationToken = generateVerificationCode();
  const welcomeCoupon = `WELCOME${Math.floor(1000 + Math.random() * 9000)}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, is_admin)
     VALUES ($1, $2, $3, false)
     RETURNING id, name, email, is_admin as "isAdmin"`,
    [name, email, passwordHash]
  );
  await pool.query(
    `UPDATE users
     SET verification_token = $2, verification_sent_at = now(), verification_last_sent_at = now(), verification_attempts = 0, welcome_coupon = $3
     WHERE id = $1`,
    [result.rows[0].id, verificationToken, welcomeCoupon]
  );
  await pool.query('INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [result.rows[0].id]);
  await pool.query(
    `INSERT INTO auth_events (event_name, user_id, email, metadata)
     VALUES ('register_completed', $1, $2, $3::jsonb)`,
    [result.rows[0].id, email, JSON.stringify({ source: 'web' })]
  );
  await sendEmail({
    to: email,
    subject: 'Your Fusion verification code',
    text: `Welcome to Fusion. Your verification code is: ${verificationToken}`,
  });
  await sendEmail({
    to: email,
    subject: 'Welcome to Fusion',
    text: `Your welcome coupon is ${welcomeCoupon}. Free shipping starts at $70.`,
  });
  await pool.query(
    `INSERT INTO auth_events (event_name, user_id, email, metadata)
     VALUES ('welcome_email_queued', $1, $2, $3::jsonb)`,
    [result.rows[0].id, email, JSON.stringify({ sequence: ['verify', 'welcome'] })]
  );
  await pool.query(
    `INSERT INTO email_jobs (user_id, email, job_type, payload, run_at)
     VALUES
       ($1, $2, 'welcome_d0', $3::jsonb, now()),
       ($1, $2, 'welcome_d2', $3::jsonb, now() + interval '2 days'),
       ($1, $2, 'welcome_d7', $3::jsonb, now() + interval '7 days')`,
    [result.rows[0].id, email, JSON.stringify({ welcomeCoupon })]
  );

  const user = result.rows[0] as AuthPayload & { name: string };
  const accessToken = createAccessToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
  const refreshToken = createRefreshToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });

  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, now() + interval \'14 days\')',
    [user.id, refreshToken]
  );

  return { conflict: false as const, user, accessToken, refreshToken, verificationToken, welcomeCoupon };
}

export async function loginUser(email: string, password: string) {
  const result = await pool.query(
    'SELECT id, name, email, password_hash, is_admin as "isAdmin", email_verified as "emailVerified", welcome_coupon as "welcomeCoupon" FROM users WHERE email = $1',
    [email]
  );
  const user = result.rows[0] as
    | { id: number; name: string; email: string; password_hash: string; isAdmin: boolean; emailVerified: boolean; welcomeCoupon?: string }
    | undefined;

  if (!user) return null;
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) return null;

  const payload = { id: user.id, email: user.email, isAdmin: user.isAdmin };
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, now() + interval \'14 days\')',
    [user.id, refreshToken]
  );

  return { user, accessToken, refreshToken };
}

export async function refreshAccessToken(token?: string) {
  if (!token) return null;
  const payload = jwt.verify(token, JWT_REFRESH_SECRET) as AuthPayload;
  const tokenResult = await pool.query('SELECT id FROM refresh_tokens WHERE token = $1 AND expires_at > now()', [token]);
  if (!tokenResult.rows.length) return null;
  return createAccessToken(payload);
}

export async function logoutUser(token?: string) {
  if (!token) return;
  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
}

export async function getProfile(userId?: number) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.is_admin as "isAdmin", u.email_verified as "emailVerified", u.welcome_coupon as "welcomeCoupon",
            p.goal, p.diet_type as "dietType", p.training_frequency as "trainingFrequency",
            p.preferred_shipping_address as "preferredShippingAddress", p.preferred_currency as "preferredCurrency",
            p.default_shipping_method as "defaultShippingMethod", p.default_subscribe_frequency as "defaultSubscribeFrequency"
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0];
}

export async function verifyEmailToken(token: string) {
  const candidate = await pool.query(
    `SELECT id, email, verification_sent_at as "verificationSentAt", verification_attempts as "verificationAttempts"
     FROM users
     WHERE verification_token = $1`,
    [token]
  );
  const user = candidate.rows[0] as
    | { id: number; email: string; verificationSentAt?: Date; verificationAttempts: number }
    | undefined;
  if (!user) return { ok: false as const, reason: 'invalid_code' as const };

  const expired =
    !user.verificationSentAt ||
    Date.now() - new Date(user.verificationSentAt).getTime() > VERIFICATION_TTL_MINUTES * 60 * 1000;
  if (expired) return { ok: false as const, reason: 'expired_code' as const };
  if (user.verificationAttempts >= VERIFICATION_MAX_ATTEMPTS) return { ok: false as const, reason: 'max_attempts' as const };

  await pool.query(
    `UPDATE users
     SET email_verified = true, verification_token = null, verification_attempts = 0
     WHERE id = $1`,
    [user.id]
  );
  await pool.query(
    `INSERT INTO auth_events (event_name, user_id, email, metadata)
     VALUES ('verify_completed', $1, $2, $3::jsonb)`,
    [user.id, user.email, JSON.stringify({})]
  );
  return { ok: true as const, user: { id: user.id, email: user.email } };
}

export async function recordVerificationFailure(token: string) {
  await pool.query(
    `UPDATE users
     SET verification_attempts = verification_attempts + 1
     WHERE verification_token = $1`,
    [token]
  );
}

export async function isUserEmailVerified(userId: number) {
  const result = await pool.query('SELECT email_verified as "emailVerified" FROM users WHERE id = $1', [userId]);
  return Boolean(result.rows[0]?.emailVerified);
}

export async function resendVerification(email: string) {
  const token = generateVerificationCode();
  const userResult = await pool.query(
    `SELECT id, email, verification_last_sent_at as "verificationLastSentAt", email_verified as "emailVerified"
     FROM users
     WHERE email = $1`,
    [email]
  );
  const user = userResult.rows[0] as
    | { id: number; email: string; verificationLastSentAt?: Date; emailVerified: boolean }
    | undefined;
  if (!user) return null;
  if (user.emailVerified) return { email: user.email, token: '', alreadyVerified: true as const };
  if (
    user.verificationLastSentAt &&
    Date.now() - new Date(user.verificationLastSentAt).getTime() < VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000
  ) {
    return { email: user.email, token: '', cooldown: true as const };
  }

  const result = await pool.query(
    `UPDATE users
     SET verification_token = $2, verification_sent_at = now(), verification_last_sent_at = now(), verification_attempts = 0
     WHERE email = $1
     RETURNING id, email`,
    [email, token]
  );
  if (!result.rows[0]) {
    return null;
  }
  await sendEmail({
    to: result.rows[0].email as string,
    subject: 'Your new Fusion verification code',
    text: `Use this code to verify your email: ${token}`,
  });
  return { email: result.rows[0].email as string, token };
}

export async function trackAuthEvent(eventName: string, userId?: number, email?: string, metadata: Record<string, unknown> = {}) {
  await pool.query(
    `INSERT INTO auth_events (event_name, user_id, email, metadata)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [eventName, userId ?? null, email ?? null, JSON.stringify(metadata)]
  );
}

export async function updateOnboardingProfile(
  userId: number,
  input: {
    goal?: string;
    dietType?: string;
    trainingFrequency?: string;
    preferredShippingAddress?: string;
    preferredCurrency?: string;
    defaultShippingMethod?: string;
    defaultSubscribeFrequency?: string;
  }
) {
  const result = await pool.query(
    `INSERT INTO user_profiles (user_id, goal, diet_type, training_frequency, preferred_shipping_address, preferred_currency, default_shipping_method, default_subscribe_frequency)
     VALUES ($1, COALESCE($2, ''), COALESCE($3, ''), COALESCE($4, ''), COALESCE($5, ''), COALESCE($6, 'USD'), COALESCE($7, 'standard'), COALESCE($8, ''))
     ON CONFLICT (user_id) DO UPDATE SET
       goal = COALESCE(NULLIF($2, ''), user_profiles.goal),
       diet_type = COALESCE(NULLIF($3, ''), user_profiles.diet_type),
       training_frequency = COALESCE(NULLIF($4, ''), user_profiles.training_frequency),
       preferred_shipping_address = COALESCE(NULLIF($5, ''), user_profiles.preferred_shipping_address),
       preferred_currency = COALESCE(NULLIF($6, ''), user_profiles.preferred_currency),
       default_shipping_method = COALESCE(NULLIF($7, ''), user_profiles.default_shipping_method),
       default_subscribe_frequency = COALESCE($8, user_profiles.default_subscribe_frequency),
       updated_at = now()
     RETURNING user_id as "userId", goal, diet_type as "dietType", training_frequency as "trainingFrequency",
               preferred_shipping_address as "preferredShippingAddress", preferred_currency as "preferredCurrency",
               default_shipping_method as "defaultShippingMethod", default_subscribe_frequency as "defaultSubscribeFrequency"`,
    [
      userId,
      input.goal ?? '',
      input.dietType ?? '',
      input.trainingFrequency ?? '',
      input.preferredShippingAddress ?? '',
      input.preferredCurrency ?? '',
      input.defaultShippingMethod ?? '',
      input.defaultSubscribeFrequency ?? '',
    ]
  );
  await pool.query(
    `INSERT INTO auth_events (event_name, user_id, metadata)
     VALUES ('onboarding_profile_updated', $1, $2::jsonb)`,
    [userId, JSON.stringify(input)]
  );
  return result.rows[0];
}

export async function sendWelcomePerkEmail(userId: number) {
  const result = await pool.query(
    'SELECT email, welcome_coupon as "welcomeCoupon", welcome_perk_claimed_at as "welcomePerkClaimedAt" FROM users WHERE id = $1',
    [userId]
  );
  const user = result.rows[0] as { email: string; welcomeCoupon?: string; welcomePerkClaimedAt?: Date } | undefined;
  if (!user) return null;
  if (user.welcomePerkClaimedAt) {
    return { email: user.email, coupon: user.welcomeCoupon || 'WELCOME10', alreadyClaimed: true as const };
  }
  const coupon = user.welcomeCoupon || 'WELCOME10';
  await sendEmail({
    to: user.email,
    subject: 'Your Fusion welcome perks',
    text: `Coupon: ${coupon}\nFree shipping starts at $70.\nStarter bundle: http://localhost:5173/category/stacks`,
  });
  await pool.query('UPDATE users SET welcome_perk_claimed_at = now() WHERE id = $1', [userId]);
  await trackAuthEvent('welcome_perk_emailed', userId, user.email, { coupon });
  return { email: user.email, coupon, alreadyClaimed: false as const };
}
