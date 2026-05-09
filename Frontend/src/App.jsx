import { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import OptimizerView from './views/OptimizerView';

/**
 * App — root component.
 *
 * Handles:
 *  - Auth state via useAuth hook
 *  - Magic link verify flow (?token=&email= in URL)
 *  - View routing: LoginView | DashboardView | OptimizerView
 */
export default function App() {
  const { user, loading, logout, verifyToken } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [verifyError, setVerifyError] = useState(null);

  // On mount: check for magic link verify params in URL
  // Use a ref to prevent double-firing in React StrictMode
  const verifyCalledRef = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    if (token && email && !verifyCalledRef.current) {
      verifyCalledRef.current = true;
      // Clean the URL immediately so refresh doesn't re-trigger verify
      window.history.replaceState({}, document.title, window.location.pathname);
      verifyToken(token, email)
        .catch(err => {
          setVerifyError(err.message || 'Invalid or expired magic link');
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Full-screen loading spinner while auth check is in progress
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <svg
          className="animate-spin h-10 w-10 text-blue-800"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-label="Loading"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  // Unauthenticated — show login (pass any verify error down)
  if (!user) {
    return <LoginView initialError={verifyError} />;
  }

  // Authenticated layout
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation bar */}
      <nav className="bg-blue-800 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <span className="text-lg font-bold tracking-tight">TapMyJob</span>

          {/* Tab links */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-white/20 text-white'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('optimizer')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                activeView === 'optimizer'
                  ? 'bg-white/20 text-white'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Optimizer
            </button>
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-200 hidden sm:block">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm px-3 py-1 rounded border border-blue-400 text-blue-100
                hover:bg-white/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* View content */}
      <main className="flex-1">
        {activeView === 'dashboard' && <DashboardView user={user} />}
        {activeView === 'optimizer' && <OptimizerView />}
      </main>
    </div>
  );
}
