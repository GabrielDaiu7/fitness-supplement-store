import { FormEvent, useState } from 'react';

type LoginModalProps = {
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<string | null>;
  onRegister: (name: string, email: string, password: string) => Promise<string | null>;
};

export function LoginModal({ onClose, onLogin, onRegister }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

    if (mode === 'register') {
      const result = await onRegister(name.trim(), email.trim().toLowerCase(), password.trim());
      if (result) {
        setError(result);
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
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="******"
              autoComplete="current-password"
            />
          </label>
          {error && <p className="state warn">{error}</p>}
          <button className="btn btn-solid" type="submit">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </section>
  );
}
