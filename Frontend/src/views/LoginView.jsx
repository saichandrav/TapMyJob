import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingButton from '../components/LoadingButton';
import Notification from '../components/Notification';

/**
 * LoginView — email input + magic link send.
 */
/**
 * Props:
 *   initialError  {string|null}  — error message from magic link verify (passed by App.jsx)
 */
export default function LoginView({ initialError = null }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [notification, setNotification] = useState(
    initialError ? { message: initialError, type: 'error' } : null
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);
    try {
      await login(email);
      setSent(true);
    } catch (err) {
      setNotification({ message: err.message || 'Failed to send magic link', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}

      <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8">
        {/* Logo / brand */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-blue-800">TapMyJob</h1>
          <p className="text-gray-500 text-sm mt-1">AI-powered job search &amp; resume optimizer</p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="text-green-600 text-4xl mb-3">✉️</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Check your inbox</h2>
            <p className="text-gray-500 text-sm">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
            <button
              className="mt-4 text-sm text-blue-700 hover:underline"
              onClick={() => { setSent(false); setEmail(''); }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <LoadingButton
              type="submit"
              isLoading={loading}
              className="w-full"
            >
              Send Magic Link
            </LoadingButton>

            <p className="text-xs text-gray-400 text-center">
              No password needed — we'll email you a one-click sign-in link.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
