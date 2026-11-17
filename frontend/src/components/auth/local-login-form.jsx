import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// Local installs (install.sh) enable an email and password login on the
// backend; production answers { enabled: false } and keeps Google only.
const STATUS_URL = '/auth/local/status';
const LOGIN_URL = '/auth/local/login';

const inputClassName = 'w-full rounded-sm border border-border bg-secondary px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring';

function LocalLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.access_token) {
        setError(body.message || 'No se pudo iniciar sesión.');
        setSubmitting(false);
        return;
      }
      // Reuse the same hand-off as the Google callback (AuthProvider reads it).
      const params = new URLSearchParams({
        auth: 'success',
        token: body.access_token,
        user: body.user?.name || body.user?.email || email,
        email: body.user?.email || email,
      });
      window.location.assign(`/?${params.toString()}`);
    } catch {
      setError('No se pudo conectar con el servidor.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <label htmlFor="local-login-email" className="text-[12px] font-semibold text-muted-foreground">Email</label>
      <input id="local-login-email" type="email" autoComplete="username" required value={email}
        onChange={(event) => setEmail(event.target.value)} className={inputClassName} />
      <label htmlFor="local-login-password" className="text-[12px] font-semibold text-muted-foreground">Contraseña</label>
      <input id="local-login-password" type="password" autoComplete="current-password" required value={password}
        onChange={(event) => setPassword(event.target.value)} className={inputClassName} />
      {error && <p role="alert" className="text-[13px] text-destructive">{error}</p>}
      <button type="submit" disabled={submitting}
        className="mt-1 min-h-11 rounded-sm bg-primary px-4 font-sans text-[14px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
        {submitting ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}

export function LocalLoginGate({ fallback }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(STATUS_URL, { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : { enabled: false }))
      .then((body) => { if (active) setEnabled(body?.enabled === true); })
      .catch(() => { /* keep the Google login */ });
    return () => { active = false; };
  }, []);

  return enabled ? <LocalLoginForm /> : fallback;
}

LocalLoginGate.propTypes = { fallback: PropTypes.node };

export default LocalLoginGate;
