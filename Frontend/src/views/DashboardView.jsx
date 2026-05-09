import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import { useJobs } from '../hooks/useJobs';
import ProfileEditor from '../components/ProfileEditor';
import JobCard from '../components/JobCard';
import LoadingButton from '../components/LoadingButton';
import Notification from '../components/Notification';

/**
 * DashboardView — profile editor + job search + saved jobs.
 *
 * Props:
 *   user  {object}  — authenticated user from useAuth
 */
export default function DashboardView({ user }) {
  const [activeTab, setActiveTab] = useState('find');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [notification, setNotification] = useState(null);

  const { jobs, savedJobs, loading, error, fetchJobs, saveJob, removeJob, loadSavedJobs } = useJobs();

  // Load saved jobs on mount
  useEffect(() => {
    loadSavedJobs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Surface hook errors as notifications
  useEffect(() => {
    if (error) {
      setNotification({ message: error, type: 'error' });
    }
  }, [error]);

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;
    setProfileLoading(true);
    setNotification(null);
    const formData = new FormData();
    formData.append('resume', resumeFile);
    try {
      const data = await fetch('http://localhost:3000/api/resume/parse', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!data.ok) {
        const err = await data.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${data.status}`);
      }
      const result = await data.json();
      setProfile(result.user_summary || result.profile || result);
      setNotification({ message: 'Resume parsed successfully!', type: 'success' });
    } catch (err) {
      setNotification({ message: err.message || 'Failed to parse resume', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const isSaved = (job) =>
    savedJobs.some(s => s.apply_link === job.apply_link);

  const sortedJobs = [...jobs].sort(
    (a, b) => (b.selection_probability ?? 0) - (a.selection_probability ?? 0)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Profile section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Profile</h2>

          {/* Resume upload */}
          <form onSubmit={handleResumeUpload} className="flex flex-wrap items-center gap-3 mb-5">
            <input
              type="file"
              accept="application/pdf"
              className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3
                file:rounded file:border-0 file:text-sm file:font-medium
                file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={e => setResumeFile(e.target.files[0] || null)}
            />
            <LoadingButton type="submit" isLoading={profileLoading} disabled={!resumeFile}>
              Parse Resume
            </LoadingButton>
            {profile && (
              <span className="text-xs text-green-600 font-medium">✓ Profile loaded</span>
            )}
          </form>

          <ProfileEditor
            profile={profile}
            onUpdate={setProfile}
          />
        </section>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {['find', 'saved'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-800 text-blue-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'find' ? 'Find Jobs' : `Saved Jobs (${savedJobs.length})`}
            </button>
          ))}
        </div>

        {/* Find Jobs tab */}
        {activeTab === 'find' && (
          <section className="space-y-4">
            <div className="flex items-center gap-4">
              <LoadingButton
                isLoading={loading}
                onClick={fetchJobs}
                disabled={!profile}
              >
                {loading ? 'Searching…' : 'Find Jobs'}
              </LoadingButton>
              {!profile && (
                <p className="text-sm text-gray-400">Parse your resume first to enable job search.</p>
              )}
            </div>

            {loading && (
              <div className="flex justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </div>
            )}

            {!loading && sortedJobs.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">No jobs yet.</p>
                <p className="text-sm mt-1">Click "Find Jobs" to search across 13 sources.</p>
              </div>
            )}

            {!loading && sortedJobs.length > 0 && (
              <div className="grid gap-4">
                {sortedJobs.map((job, i) => (
                  <JobCard
                    key={job.apply_link || i}
                    job={job}
                    isSaved={isSaved(job)}
                    onSave={saveJob}
                    onRemove={removeJob}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Saved Jobs tab */}
        {activeTab === 'saved' && (
          <section className="space-y-4">
            {savedJobs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">No saved jobs.</p>
                <p className="text-sm mt-1">Save jobs from the "Find Jobs" tab.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {savedJobs.map((job, i) => (
                  <JobCard
                    key={job.apply_link || i}
                    job={job}
                    isSaved={true}
                    onRemove={removeJob}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
