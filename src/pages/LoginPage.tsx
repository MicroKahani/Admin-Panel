import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendOTP, verifyOTP } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'email' | 'otp';

// ─── Utility: format countdown as M:SS ────────────────────────────────────────
const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ─── LoginPage ────────────────────────────────────────────────────────────────
const LoginPage: React.FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devOtp, setDevOtp] = useState(''); // DEV mode only: OTP shown on-screen
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [animating, setAnimating] = useState(false);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const { setAdmin } = useAuth();
  const navigate = useNavigate();

  // ─── Countdown timers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (otpExpiry <= 0) return;
    const id = setInterval(() => setOtpExpiry(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(id);
  }, [otpExpiry]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  // ─── OTP digit handlers ───────────────────────────────────────────────────────
  const handleOtpDigit = useCallback((index: number, value: string) => {
    // Accept only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtpDigits(prev => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    // Auto-advance focus
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        // Clear current digit
        setOtpDigits(prev => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      } else if (index > 0) {
        // Move to previous box and clear it
        otpRefs.current[index - 1]?.focus();
        setOtpDigits(prev => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      handleVerifyOTP();
    }
  }, [otpDigits]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const digits = Array(6).fill('');
    pasted.split('').forEach((ch, i) => { digits[i] = ch; });
    setOtpDigits(digits);
    // Focus the last filled box or last box
    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();
  }, []);

  // ─── Transition helper ────────────────────────────────────────────────────────
  const goToStep = (nextStep: Step) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setError('');
      setSuccess('');
      setAnimating(false);
      if (nextStep === 'otp') {
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      }
    }, 250);
  };

  // ─── Send OTP ─────────────────────────────────────────────────────────────────
  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    try {
      const response: any = await sendOTP(email.trim().toLowerCase());
      if (response.success) {
        setSuccess(response.message || 'OTP sent to your email!');
        setOtpExpiry(response.expiresIn || 180);
        setResendCooldown(60);
        // DEV MODE: auto-fill OTP boxes if backend returned devOtp
        if (response.devOtp) {
          const digits = response.devOtp.toString().split('').slice(0, 6);
          setOtpDigits([...digits, ...Array(6 - digits.length).fill('')]);
          setDevOtp(response.devOtp);
        } else {
          setOtpDigits(Array(6).fill(''));
          setDevOtp('');
        }
        goToStep('otp');
      } else {
        setError(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        setError('Too many OTP requests. Please wait a few minutes and try again.');
      } else if (status === 404) {
        // Don't reveal that the email doesn't exist (matches backend enumeration protection)
        setSuccess('If this email is registered, an OTP will be sent.');
        setOtpExpiry(180);
        setResendCooldown(60);
        goToStep('otp');
      } else {
        setError(err?.response?.data?.message || 'Failed to send OTP. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify OTP ───────────────────────────────────────────────────────────────
  const handleVerifyOTP = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) { setError('Please enter all 6 digits.'); return; }
    setError('');
    setLoading(true);
    try {
      const response: any = await verifyOTP(email, otp);
      if (response.success) {
        setSuccess('Login successful! Redirecting...');
        setAdmin(response.data.admin); // Sync setter — no await needed (BUG-008 fix)
        navigate('/dashboard', { replace: true });
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
        // Shake the OTP boxes on error
        setOtpDigits(Array(6).fill(''));
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        setError('Too many failed attempts. Please request a new OTP.');
        setOtpExpiry(0); // Disable the expired OTP submit button
      } else {
        const msg = err?.response?.data?.message || 'Verification failed. Please try again.';
        setError(msg);
        setOtpDigits(Array(6).fill(''));
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      }
    } finally {
      setLoading(false);
    }
  }, [email, otpDigits, setAdmin, navigate]);

  const isOtpComplete = otpDigits.every(d => d !== '');
  const otpExpired = step === 'otp' && otpExpiry === 0;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Animated background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={{ ...styles.card, opacity: animating ? 0 : 1, transform: animating ? 'translateY(12px)' : 'translateY(0)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}>

        {/* Logo / Brand */}
        <div style={styles.brandRow}>
          <div style={styles.logoCircle}>
            <span style={styles.logoIcon}>🔐</span>
          </div>
          <div>
            <h1 style={styles.brandName}>Micro Kahani</h1>
            <p style={styles.brandSub}>Admin Panel</p>
          </div>
        </div>

        {/* Step Header */}
        <div style={styles.stepHeader}>
          <h2 style={styles.stepTitle}>
            {step === 'email' ? 'Sign In' : 'Enter OTP'}
          </h2>
          <p style={styles.stepSubtitle}>
            {step === 'email'
              ? 'Enter your admin email to receive a one-time password'
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div style={styles.alertError}>
            <span style={styles.alertIcon}>⚠️</span> {error}
          </div>
        )}
        {success && !error && (
          <div style={styles.alertSuccess}>
            <span style={styles.alertIcon}>✅</span> {success}
          </div>
        )}

        {/* ── STEP 1: Email ─────────────────────────────────────────────────── */}
        {step === 'email' && (
          <form onSubmit={handleSendOTP} style={styles.form} noValidate>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="admin-email">Email Address</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="admin@microkahani.com"
                autoComplete="email"
                autoFocus
                disabled={loading}
                required
                style={{
                  ...styles.input,
                  borderColor: error ? '#ef4444' : '#d1d5db',
                  opacity: loading ? 0.7 : 1,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                ...styles.btn,
                opacity: loading || !email.trim() ? 0.6 : 1,
                cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? <Spinner /> : 'Send OTP →'}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ───────────────────────────────────────────────────── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} style={styles.form} noValidate>
            {/* Dev Mode OTP Banner */}
            {devOtp && (
              <div style={styles.devBanner}>
                <span style={{ fontSize: 15 }}>🛠️</span>
                <div>
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 2 }}>DEV MODE — OTP auto-filled</strong>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>Your OTP is: <strong style={{ letterSpacing: 3 }}>{devOtp}</strong> (not sent to email)</span>
                </div>
              </div>
            )}

            {/* 6 Individual Digit Boxes */}
            <div style={styles.otpRow} onPaste={handleOtpPaste}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpDigit(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  disabled={loading || otpExpired}
                  autoComplete="one-time-code"
                  style={{
                    ...styles.otpBox,
                    borderColor: digit ? '#3b82f6' : error ? '#ef4444' : '#d1d5db',
                    background: digit ? '#eff6ff' : '#fff',
                    color: digit ? '#1d4ed8' : '#111827',
                    transform: digit ? 'scale(1.05)' : 'scale(1)',
                    opacity: otpExpired ? 0.5 : 1,
                  }}
                />
              ))}
            </div>

            {/* Expiry + Resend */}
            <div style={styles.timerRow}>
              {otpExpiry > 0 ? (
                <span style={styles.timerText}>
                  Code expires in <strong style={{ color: otpExpiry < 30 ? '#ef4444' : '#1f2937' }}>{formatTime(otpExpiry)}</strong>
                </span>
              ) : (
                <span style={{ ...styles.timerText, color: '#ef4444', fontWeight: 600 }}>
                  ⏰ OTP expired
                </span>
              )}

              <button
                type="button"
                onClick={() => handleSendOTP()}
                disabled={resendCooldown > 0 || loading}
                style={{
                  ...styles.resendBtn,
                  opacity: resendCooldown > 0 || loading ? 0.5 : 1,
                  cursor: resendCooldown > 0 || loading ? 'not-allowed' : 'pointer',
                }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !isOtpComplete || otpExpired}
              style={{
                ...styles.btn,
                opacity: loading || !isOtpComplete || otpExpired ? 0.6 : 1,
                cursor: loading || !isOtpComplete || otpExpired ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? <Spinner /> : 'Verify & Sign In →'}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpDigits(Array(6).fill(''));
                setOtpExpiry(0);
                setResendCooldown(0);
                goToStep('email');
              }}
              disabled={loading}
              style={styles.backBtn}
            >
              ← Change Email
            </button>
          </form>
        )}

        {/* Step indicator */}
        <div style={styles.stepIndicatorRow}>
          <div style={{ ...styles.stepDot, background: '#3b82f6' }} />
          <div style={{ ...styles.stepDot, background: step === 'otp' ? '#3b82f6' : '#e5e7eb' }} />
        </div>
      </div>
    </div>
  );
};

// ─── Inline Spinner ───────────────────────────────────────────────────────────
const Spinner: React.FC = () => (
  <span style={{
    display: 'inline-block',
    width: 18, height: 18,
    border: '2.5px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  }} />
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute', top: '-120px', right: '-120px',
    width: 400, height: 400,
    background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-100px', left: '-100px',
    width: 350, height: 350,
    background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(255,255,255,0.97)',
    backdropFilter: 'blur(20px)',
    borderRadius: 20,
    padding: '40px 40px 32px',
    width: '100%',
    maxWidth: 460,
    boxShadow: '0 25px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)',
    position: 'relative',
    zIndex: 1,
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
  },
  logoCircle: {
    width: 48, height: 48,
    background: 'linear-gradient(135deg,#1f2937,#3b82f6)',
    borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  logoIcon: { fontSize: 22 },
  brandName: {
    margin: 0, fontSize: 18, fontWeight: 700, color: '#111827',
    fontFamily: '"Inter","Segoe UI",sans-serif', letterSpacing: '-0.4px',
  },
  brandSub: {
    margin: '2px 0 0', fontSize: 12, color: '#6b7280', fontFamily: '"Inter","Segoe UI",sans-serif',
  },
  stepHeader: { marginBottom: 24 },
  stepTitle: {
    margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#111827',
    fontFamily: '"Inter","Segoe UI",sans-serif', letterSpacing: '-0.5px',
  },
  stepSubtitle: {
    margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.5,
    fontFamily: '"Inter","Segoe UI",sans-serif',
  },
  alertError: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
    padding: '12px 14px', marginBottom: 18,
    color: '#991b1b', fontSize: 13, fontFamily: '"Inter","Segoe UI",sans-serif',
    display: 'flex', alignItems: 'flex-start', gap: 8,
  },
  alertSuccess: {
    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
    padding: '12px 14px', marginBottom: 18,
    color: '#166534', fontSize: 13, fontFamily: '"Inter","Segoe UI",sans-serif',
    display: 'flex', alignItems: 'flex-start', gap: 8,
  },
  alertIcon: { flexShrink: 0, fontSize: 15 },
  form: { display: 'flex', flexDirection: 'column', gap: 0 },
  fieldGroup: { marginBottom: 20 },
  label: {
    display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600,
    color: '#374151', fontFamily: '"Inter","Segoe UI",sans-serif',
  },
  input: {
    width: '100%', boxSizing: 'border-box',
    padding: '13px 16px', border: '1.5px solid #d1d5db',
    borderRadius: 10, fontSize: 15, color: '#111827',
    outline: 'none', fontFamily: '"Inter","Segoe UI",sans-serif',
    background: '#fff',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  otpRow: {
    display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20,
  },
  otpBox: {
    width: 54, height: 60,
    border: '2px solid #d1d5db', borderRadius: 12,
    fontSize: 26, fontWeight: 700, textAlign: 'center',
    outline: 'none', fontFamily: '"Courier New",monospace',
    cursor: 'text', transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  timerRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20, minHeight: 24,
  },
  timerText: {
    fontSize: 13, color: '#6b7280', fontFamily: '"Inter","Segoe UI",sans-serif',
  },
  resendBtn: {
    background: 'none', border: 'none', fontSize: 13, fontWeight: 600,
    color: '#3b82f6', fontFamily: '"Inter","Segoe UI",sans-serif',
    padding: '4px 2px', borderBottom: '1px solid #3b82f6',
    transition: 'opacity 0.15s',
  },
  btn: {
    width: '100%', padding: '15px', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg,#1f2937 0%,#3b82f6 100%)',
    color: '#fff', fontSize: 16, fontWeight: 700,
    fontFamily: '"Inter","Segoe UI",sans-serif',
    cursor: 'pointer', letterSpacing: '-0.2px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'transform 0.1s, opacity 0.15s',
    boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
    marginBottom: 12,
  },
  backBtn: {
    width: '100%', padding: '11px', borderRadius: 10, border: '1.5px solid #e5e7eb',
    background: 'transparent', color: '#6b7280',
    fontSize: 14, fontWeight: 500, fontFamily: '"Inter","Segoe UI",sans-serif',
    cursor: 'pointer', transition: 'opacity 0.15s, background 0.15s',
  },
  stepIndicatorRow: {
    display: 'flex', gap: 6, justifyContent: 'center', marginTop: 24,
  },
  stepDot: {
    width: 8, height: 8, borderRadius: '50%', transition: 'background 0.3s',
  },
  devBanner: {
    background: '#fefce8', border: '1px solid #fde047', borderRadius: 10,
    padding: '12px 14px', marginBottom: 16,
    color: '#713f12', fontSize: 13, fontFamily: '"Inter","Segoe UI",sans-serif',
    display: 'flex', alignItems: 'flex-start', gap: 10,
  },
};

// ─── CSS for spinner animation ────────────────────────────────────────────────
const styleTag = document.createElement('style');
styleTag.textContent = `@keyframes spin { to { transform: rotate(360deg); } } input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }`;
if (!document.head.querySelector('[data-login-styles]')) {
  styleTag.dataset.loginStyles = 'true';
  document.head.appendChild(styleTag);
}

export default LoginPage;