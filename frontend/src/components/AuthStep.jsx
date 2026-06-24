import { useState } from "react";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.4 12s3.5-6 9.6-6 9.6 6 9.6 6-3.5 6-9.6 6-9.6-6-9.6-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M9.6 5.4A10.2 10.2 0 0 1 12 5c6.1 0 9.6 7 9.6 7a16.7 16.7 0 0 1-3 3.8" />
      <path d="M14.1 14.1A3 3 0 0 1 9.9 9.9" />
      <path d="M6.5 6.8C3.9 8.5 2.4 12 2.4 12s3.5 7 9.6 7a9.9 9.9 0 0 0 4.2-.9" />
    </svg>
  );
}

export default function AuthStep({ onSubmit, onBack }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isRegistering = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    const nextUsername = username.trim();
    if (!nextUsername || !password) {
      setError("Enter both a username and password.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await onSubmit(mode, { username: nextUsername, password });
    } catch (err) {
      setError(err.message || "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="section-heading">
          <span>{isRegistering ? "Create account" : "Login"}</span>
          <h2>{isRegistering ? "Create your learner account" : "Welcome back"}</h2>
          <p>Sign in after the landing page so your course dashboard stays tucked behind a simple account step.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete={isRegistering ? "new-password" : "current-password"}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </label>
          {error && <div className="error-banner">{error}</div>}
          <div className="action-row">
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? "Please wait..." : isRegistering ? "Create account" : "Log in"}
            </button>
            <button className="ghost" type="button" onClick={onBack}>Back to landing</button>
          </div>
        </form>
        <button
          className="auth-toggle"
          type="button"
          onClick={() => {
            setMode(isRegistering ? "login" : "register");
            setError("");
          }}
        >
          {isRegistering ? "Already have an account? Log in." : "New here? Create an account."}
        </button>
      </section>
    </main>
  );
}
