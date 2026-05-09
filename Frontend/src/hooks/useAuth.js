import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/auth/me')
      .then(data => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    const handleUnauthorized = () => setUser(null);
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  const login = async (email) => {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const verifyToken = async (token, email) => {
    const data = await apiFetch(`/auth/verify?token=${token}&email=${encodeURIComponent(email)}`);
    setUser(data.user);
    return data;
  };

  return { user, loading, login, logout, verifyToken };
}
