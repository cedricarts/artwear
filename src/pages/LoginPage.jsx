import { useState }              from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth }               from "../hooks/useAuth";
import styles                    from "../styles/LoginPage.module.css";

const AUTH_ERRORS = {
  "auth/invalid-credential":     "Invalid email or password.",
  "auth/user-not-found":         "No account found with that email.",
  "auth/wrong-password":         "Incorrect password.",
  "auth/too-many-requests":      "Too many attempts. Please wait.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/popup-closed-by-user":   "Sign-in cancelled.",
  "auth/popup-blocked":          "Sign-in blocked. Please allow popups.",
};

export default function LoginPage() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? "/";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate(from);
    } catch (err) {
      setError(AUTH_ERRORS[err.code] ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate(from);
    } catch (err) {
      setError(AUTH_ERRORS[err.code] ?? "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Sign In</h1>
        <button onClick={handleGoogleLogin} className={styles.googleBtn} disabled={loading}>Continue with Google</button>
        <div className={styles.divider}>
          <span className={styles.dividerLine} /><span className={styles.dividerText}>or</span><span className={styles.dividerLine} />
        </div>
        <form onSubmit={handleEmailLogin} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} required autoComplete="email" />
          </div>
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} required autoComplete="current-password" />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
        </form>
        <p className={styles.footer}>Don't have an account? Just sign in — we'll create one automatically.</p>
      </div>
    </div>
  );
}
