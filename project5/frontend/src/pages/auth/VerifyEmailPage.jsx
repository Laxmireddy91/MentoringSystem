import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CheckCircle, XCircle, ArrowLeft, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    if (token) {
      verifyWithToken(token);
    }
  }, [token]);

  const verifyWithToken = async (tok) => {
    setLoading(true);
    setError('');
    try {
      await axiosClient.post('/auth/verify-email', { token: tok });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Email verification link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken.trim()) {
      verifyWithToken(manualToken.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-role-primary text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
          🎓
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Email Verification
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Confirming your institutional academic email address.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm border border-slate-200 dark:border-slate-800 sm:rounded-2xl">
          {loading ? (
            <div className="text-center py-8 space-y-3">
              <LoadingSpinner size="lg" />
              <p className="text-xs text-slate-500">Verifying your email token...</p>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-status-success dark:bg-status-emerald text-status-success dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Email Verified Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                Your email address has been verified. You can now access all portal features.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-role-primary dark:text-indigo-400 hover:underline pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Continue to Sign In
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {error ? (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-status-error dark:bg-status-error/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Verification Failed
                  </h3>
                  <div className="p-3 rounded-xl bg-rose-50 text-status-error text-xs border border-rose-200">
                    {error}
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleManualSubmit} className="space-y-4 text-xs pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paste Verification Token
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Paste your token from the email"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs"
                >
                  Verify Token
                </button>
              </form>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
