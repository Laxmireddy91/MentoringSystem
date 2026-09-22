import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function TwoFactorPage() {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyTwoFactor } = useAuth();

  const tempToken = location.state?.tempToken;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (verifyTwoFactor) {
        await verifyTwoFactor({ tempToken, code });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-role-primary text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Two-Factor Authentication
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter the 6-digit authentication code sent to your registered device.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm border border-slate-200 dark:border-slate-800 sm:rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-status-error border border-rose-200">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-center">
                Authentication Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full py-3 text-center tracking-widest text-xl font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || code.length < 6}
              className="w-full py-2.5 px-4 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs"
            >
              {submitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Verify & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
