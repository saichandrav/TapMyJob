import { useState } from 'react';
import { apiFetch } from '../api/client';

export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/jobs/search', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const saveJob = async (job) => {
    try {
      const data = await apiFetch('/api/jobs/save', {
        method: 'POST',
        body: JSON.stringify({ job }),
      });
      setSavedJobs(data.jobs || []);
    } catch (err) {
      setError(err.message || 'Failed to save job');
    }
  };

  const removeJob = async (job) => {
    // Optimistically remove from local state
    setSavedJobs(prev => prev.filter(j => j.apply_link !== job.apply_link));
    try {
      // Backend DELETE route uses :id which is MD5 of apply_link
      // We encode the apply_link as a URI component for the path
      const id = encodeURIComponent(job.apply_link || '');
      await apiFetch(`/api/jobs/save/${id}`, { method: 'DELETE' });
    } catch {
      // Re-fetch saved jobs on error to restore correct state
      try {
        const data = await apiFetch('/api/jobs/saved');
        setSavedJobs(data.jobs || []);
      } catch (fetchErr) {
        setError(fetchErr.message || 'Failed to sync saved jobs');
      }
    }
  };

  const loadSavedJobs = async () => {
    try {
      const data = await apiFetch('/api/jobs/saved');
      setSavedJobs(data.jobs || []);
    } catch (err) {
      setError(err.message || 'Failed to load saved jobs');
    }
  };

  return { jobs, savedJobs, loading, error, fetchJobs, saveJob, removeJob, loadSavedJobs };
}
