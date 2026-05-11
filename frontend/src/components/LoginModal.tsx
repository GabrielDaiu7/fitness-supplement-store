import { FormEvent, useState } from 'react';

type LoginModalProps = {
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<string | null>;
  onRegister: (name: string, email: string, password: string) => Promise<string | null>;
  onVerifyEmail: (token: string) => Promise<boolean>;
  onResendVerification: (email: string) => Promise<string | null>;
};

export function LoginModal({ onClose, onLogin, onRegister, onVerifyEmail, onResendVerification }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [verificationTokenIssued, setVerificationTokenIssued] = useState('');
  const [welcomeCoupon, setWelcomeCoupon] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const passwordScore = Number(password.length >= 8) + Number(/[A-Z]/.test(password)) + Number(/[0-9]/.test(password)) + Number(/[^A-Za-z0-9]/.test(password));
  const passwordStrength = passwordScore <= 1 ? 'Weak' : passwordScore <= 3 ? 'Medium' : 'Strong';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (mode === 'register') {
      const result = await onRegister(name.trim(), email.trim().toLowerCase(), password.trim());
      if (result) {
        setError(result);
      } else {
        setSuccess('Account created. You are now signed in and being redirected to your account.');
      }
      return;
    }
    const result = await onLogin(email.trim().toLowerCase(), password.trim());
    if (result) {
      setError(result);
    }
  }

  return (
    <section className="overlay" role="dialog" aria-modal="true" aria-label="Login">
      <div className="modal login-modal">
        <div className="modal-head">
          <h3>Account Login</h3>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="login-copy">
          {mode === 'login'
            ? 'Sign in to track orders, manage subscriptions, and save your favorite stacks.'
            : 'Create your account to save your stack and checkout faster.'}
        </p>
        {welcomeCoupon && <p className="state">Welcome perk unlocked: <strong>{welcomeCoupon}</strong></p>}

        <div className="auth-switch">
          <button className={mode === 'login' ? 'btn btn-solid' : 'btn btn-ghost'} type="button" onClick={() => { setMode('login'); setError(''); }}>
            Login
          </button>
          <button className={mode === 'register' ? 'btn btn-solid' : 'btn btn-ghost'} type="button" onClick={() => { setMode('register'); setError(''); }}>
            Register
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              Full Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jordan Miles"
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="******"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
          {mode === 'register' && (
            <>
              <label>
                Confirm Password
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="******"
                  autoComplete="new-password"
                />
              </label>
              <p className="state">Password Strength: {passwordStrength}</p>
            </>
          )}
          <button className="btn btn-ghost" type="button" onClick={() => setShowPassword((prev) => !prev)}>
            {showPassword ? 'Hide Password' : 'Show Password'}
          </button>
          {mode === 'register' && (
            <>
              <label>
                Email Verification Code
                <input
                  value={verificationToken}
                  onChange={(event) => setVerificationToken(event.target.value)}
                  placeholder="Enter 6-digit code"
                />
              </label>
              <div className="checkout-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={async () => {
                    const ok = await onVerifyEmail(verificationToken.trim());
                    setError(ok ? '' : 'Verification code is invalid.');
                    setSuccess(ok ? 'Email verified successfully.' : '');
                  }}
                >
                  Verify Email
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={async () => {
                    const token = await onResendVerification(email.trim().toLowerCase());
                    if (!token) {
                      setError('Unable to resend verification.');
                      return;
                    }
                    setVerificationTokenIssued(token);
                    setSuccess('Verification code re-sent.');
                    setError('');
                  }}
                >
                  Resend Verification
                </button>
              </div>
              {verificationTokenIssued && <p className="state">Latest code: {verificationTokenIssued}</p>}
            </>
          )}
          {error && <p className="state warn">{error}</p>}
          {success && <p className="state">{success}</p>}
          <p className="state">We store your name, email, encrypted password, and preferences. See our <a href="/privacy">Privacy Policy</a>.</p>
          <button className="btn btn-solid" type="submit">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </section>
  );
}
