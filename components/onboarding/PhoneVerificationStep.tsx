'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, CheckCircle2, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────
type VerificationState =
  | 'IDLE'
  | 'LOADING'
  | 'OTP_SENT'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'INVALID_OTP'
  | 'EXPIRED'
  | 'RATE_LIMITED'
  | 'PROVIDER_ERROR'
  | 'NETWORK_ERROR';

interface Country {
  code: string;
  name: string;
  flag: string;
}

interface PhoneVerificationStepProps {
  onVerified: () => void;
  authToken?: string;
}

// ─── Country list ──────────────────────────────────────────────────────────────
const COUNTRIES: Country[] = [
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+1', name: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function useCountdown(initial: number) {
  const [count, setCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback((seconds: number) => {
    setCount(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return { count, start };
}

function pad(n: number) { return n.toString().padStart(2, '0'); }

// ─── OTP Input component (4 digits) ───────────────────────────────────────────
function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // 4 digits code length
  const digits = value.split('').concat(Array(4).fill('')).slice(0, 4);

  const handleChange = (i: number, v: string) => {
    const cleaned = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = cleaned;
    const newVal = next.join('').slice(0, 4);
    onChange(newVal);
    if (cleaned && i < 3) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    onChange(pasted);
    const idx = Math.min(pasted.length, 3);
    inputs.current[idx]?.focus();
  };

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  return (
    <div className="flex gap-3 justify-center" role="group" aria-label="One-time password input">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          aria-label={`OTP digit ${i + 1}`}
          className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all focus:outline-none
            ${d ? 'border-lpu-orange bg-orange-50 text-gray-900' : 'border-lpu-border bg-white text-gray-900'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-lpu-orange focus:ring-2 focus:ring-lpu-orange/20'}
          `}
        />
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PhoneVerificationStep({ onVerified, authToken }: PhoneVerificationStepProps) {
  const [state, setState] = useState<VerificationState>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');
  const [successPhone, setSuccessPhone] = useState('');

  const [countryCode, setCountryCode] = useState('+91');
  const [nationalNumber, setNationalNumber] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');

  const [otp, setOtp] = useState('');

  const { count: cooldown, start: startCooldown } = useCountdown(30);

  const getHeaders = useCallback(async () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      return headers;
    }
    
    // Retrieve Clerk token from window context asynchronously
    const clerk = (window as any).Clerk;
    if (clerk?.session) {
      try {
        const token = await clerk.session.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.error('Error fetching Clerk token:', err);
      }
    }
    
    return headers;
  }, [authToken]);

  const handleSend = async () => {
    if (!nationalNumber.trim()) {
      setErrorMsg('Please enter your mobile number.');
      return;
    }
    setState('LOADING');
    setErrorMsg('');
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/verification/phone/send-otp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phoneNumber: nationalNumber.trim(), countryCode }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error?.message || 'Failed to send OTP.');
      }
      setMaskedPhone(json.data.phone);
      startCooldown(json.data.resendAvailableIn || 30);
      setOtp('');
      setState('OTP_SENT');
    } catch (err: any) {
      const msg: string = err.message || '';
      if (msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('many')) {
        setState('RATE_LIMITED');
      } else if (msg.toLowerCase().includes('network') || err.name === 'TypeError') {
        setState('NETWORK_ERROR');
      } else {
        setState('PROVIDER_ERROR');
      }
      setErrorMsg(msg || 'We couldn\'t send a verification code right now. Please try again.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setState('LOADING');
    setErrorMsg('');
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/verification/phone/resend-otp`, {
        method: 'POST',
        headers,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || json.error?.message || 'Failed to resend OTP.');
      setMaskedPhone(json.data.phone);
      startCooldown(json.data.resendAvailableIn || 30);
      setOtp('');
      setState('OTP_SENT');
    } catch (err: any) {
      const msg: string = err.message || '';
      setState(msg.toLowerCase().includes('rate') ? 'RATE_LIMITED' : 'PROVIDER_ERROR');
      setErrorMsg(msg || 'Could not resend. Please try again.');
    }
  };

  const handleVerify = useCallback(async () => {
    if (otp.length < 4) {
      setErrorMsg('Please enter the complete 4-digit code.');
      return;
    }
    setState('VERIFYING');
    setErrorMsg('');
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/verification/phone/verify-otp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ otp }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg: string = json.message || json.error?.message || '';
        if (msg.toLowerCase().includes('expired')) {
          setState('EXPIRED');
          setErrorMsg('Your verification code has expired. Please request a new code.');
        } else if (msg.toLowerCase().includes('many') || msg.toLowerCase().includes('locked')) {
          setState('RATE_LIMITED');
          setErrorMsg(msg);
        } else {
          setState('INVALID_OTP');
          setErrorMsg(msg || 'The verification code is incorrect.');
        }
        return;
      }
      setSuccessPhone(json.data.phone);
      setState('VERIFIED');
      // Notify parent after a short delay
      setTimeout(() => onVerified(), 1500);
    } catch (err: any) {
      setState('NETWORK_ERROR');
      setErrorMsg(err.message || 'Network error. Please check your connection.');
    }
  }, [otp, getHeaders, onVerified]);

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (otp.length === 4 && state === 'OTP_SENT') {
      const timer = setTimeout(() => {
        handleVerify();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [otp, state, handleVerify]);

  // ── VERIFIED state ──────────────────────────────────────────────────────────
  if (state === 'VERIFIED') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">Phone number verified</p>
          <p className="text-sm text-lpu-text-secondary mt-1">{successPhone}</p>
        </div>
        <Button onClick={onVerified} className="mt-2 bg-lpu-orange hover:bg-lpu-orange/90 text-white rounded-xl px-8">
          Continue
        </Button>
      </div>
    );
  }

  // ── OTP_SENT state ──────────────────────────────────────────────────────────
  if (state === 'OTP_SENT' || state === 'VERIFYING' || state === 'INVALID_OTP' || state === 'EXPIRED' || state === 'RATE_LIMITED') {
    const isVerifying = state === 'VERIFYING';

    return (
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-gray-900">Verification code sent to</p>
          <p className="text-sm text-lpu-text-secondary font-medium">{maskedPhone}</p>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-lpu-text-secondary uppercase text-center">
            Enter 4-digit code
          </label>
          <OtpInput value={otp} onChange={setOtp} disabled={isVerifying} />
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <Button
          onClick={handleVerify}
          disabled={isVerifying || otp.length < 4}
          className="w-full rounded-xl h-11 font-bold bg-lpu-orange hover:bg-lpu-orange/90 text-white"
        >
          {isVerifying ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</span>
          ) : 'Verify Code'}
        </Button>

        <div className="text-center text-xs text-lpu-text-secondary">
          Didn&apos;t receive the code?{' '}
          {cooldown > 0 ? (
            <span className="font-semibold text-gray-500">Resend in {pad(Math.floor(cooldown / 60))}:{pad(cooldown % 60)}</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isVerifying}
              className="text-lpu-orange font-semibold hover:underline disabled:opacity-50"
            >
              <RefreshCw className="inline h-3 w-3 mr-1" />Resend code
            </button>
          )}
        </div>

        <button
          onClick={() => { setState('IDLE'); setErrorMsg(''); setOtp(''); }}
          className="block w-full text-center text-xs text-lpu-text-secondary hover:text-lpu-orange transition-colors"
        >
          ← Change phone number
        </button>
      </div>
    );
  }

  // ── IDLE / LOADING / PROVIDER_ERROR / NETWORK_ERROR states ─────────────────
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-lpu-text-secondary uppercase mb-1">Mobile Number</label>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex gap-2 flex-1">
            {/* Integrated Inline Country Selector */}
            <select
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              disabled={state === 'LOADING'}
              className="h-11 px-3 bg-white border border-lpu-border rounded-xl text-sm font-semibold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-lpu-orange/20"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
            
            <input
              type="tel"
              inputMode="numeric"
              placeholder="9876543210"
              value={nationalNumber}
              onChange={e => setNationalNumber(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={state === 'LOADING'}
              className="flex-1 h-11 px-4 rounded-xl bg-white border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Send button right-aligned on desktop, stacked on mobile */}
          <Button
            onClick={handleSend}
            disabled={state === 'LOADING' || !nationalNumber.trim()}
            className="w-full sm:w-auto px-6 rounded-xl h-11 font-bold bg-lpu-orange hover:bg-lpu-orange/90 text-white shrink-0"
          >
            {state === 'LOADING' ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending...</span>
            ) : (
              <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> Send code</span>
            )}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <p className="text-center sm:text-left text-xs text-lpu-text-secondary">
        We&apos;ll send a 4-digit verification code to your mobile number.
      </p>
    </div>
  );
}
