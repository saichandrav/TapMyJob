import { useState } from 'react';

export function useOptimizer() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const optimize = async (jdUrl, resumeFile) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('jd_url', jdUrl);
    formData.append('resume_file', resumeFile);

    try {
      // Don't set Content-Type — browser sets it with the multipart boundary
      const response = await fetch('http://localhost:3000/api/optimize', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, optimize };
}
