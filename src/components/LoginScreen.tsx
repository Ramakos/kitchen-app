import { useState } from 'react';
import { Delete } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

import ramakosLogoFull from '../assets/ramakos-logo-full.png';

type LoginScreenProps = {
  onLogin: (staffId: string, staffName: string) => void;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: staff, error: queryError } = await supabase
        .from('user_profiles')
        .select('id, full_name, pin, is_active')
        .eq('pin', pin)
        .eq('is_active', true)
        .maybeSingle();

      if (queryError) throw queryError;

      if (!staff) {
        setError('Invalid PIN. Please try again.');
        setLoading(false);
        return;
      }

      const staffName = staff.full_name || 'Kitchen Staff';
      showToast(`Welcome, ${staffName}!`, 'success');
      onLogin(staff.id, staffName);
    } catch {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-72 h-72 bg-brand rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-dark rounded-full blur-3xl" />
      </div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header band */}
        <div className="bg-gradient-brand px-8 pt-7 pb-8 text-center">
          <div className="inline-block bg-white rounded-xl p-2.5 mb-3 shadow-md max-w-[220px]">
            <img
              src={ramakosLogoFull}
              alt="Ramakos Catering Service"
              className="h-14 w-auto mx-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kitchen Display</h1>
          <p className="text-white/80 text-xs mt-1">Enter your 4-digit PIN to continue</p>
        </div>

        <div className="p-8">
          {/* PIN display */}
          <div className="mb-6">
            <div className="bg-slate-50 rounded-xl p-6 text-center border-2 border-slate-100">
              <div className="text-4xl font-mono tracking-[0.3em] text-slate-800 h-12 flex items-center justify-center">
                {pin.length > 0 ? (
                  pin.split('').map((_, i) => (
                    <span key={i} className="mx-1.5 text-brand text-2xl">●</span>
                  ))
                ) : (
                  <span className="text-slate-300 text-lg font-normal tracking-normal">Enter PIN</span>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center font-medium animate-fade-in">
              {error}
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePinInput(num.toString())}
                className="bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-2xl font-semibold py-5 rounded-xl transition-all border border-slate-200 hover:border-slate-300 active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-500 text-sm font-semibold py-5 rounded-xl transition-all border border-slate-200 active:scale-95"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handlePinInput('0')}
              className="bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-2xl font-semibold py-5 rounded-xl transition-all border border-slate-200 active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-500 py-5 rounded-xl transition-all border border-slate-200 active:scale-95 flex items-center justify-center"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            onClick={handleLogin}
            disabled={loading || pin.length === 0}
            className="w-full bg-gradient-brand hover:opacity-90 active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-xl transition-all shadow-brand"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-xs text-slate-400 text-center mt-6 font-medium">
            Demo PINs: 1234 or 5678
          </p>
        </div>
      </div>
    </div>
  );
}
