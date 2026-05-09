import { useState } from 'react';
import { useOptimizer } from '../hooks/useOptimizer';
import LoadingButton from '../components/LoadingButton';
import Notification from '../components/Notification';

/**
 * OptimizerView — ATS resume optimizer.
 * Accepts a JD URL + PDF resume, shows scores and download links.
 */
export default function OptimizerView() {
  const { result, loading, error, optimize } = useOptimizer();
  const [jdUrl, setJdUrl] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [notification, setNotification] = useState(null);

  // Surface hook errors as notifications
  if (error && (!notification || notification.message !== error)) {
    setNotification({ message: error, type: 'error' });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification(null);
    if (!jdUrl || !resumeFile) return;
    await optimize(jdUrl, resumeFile);
  };

  /**
   * Decode a base64 string → Blob → object URL → trigger download.
   */
  const downloadBase64Pdf = (base64, filename) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fieldClass =
    'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Resume Optimizer</h2>
        <p className="text-sm text-gray-500">
          Paste a job description URL and upload your resume PDF. We'll rewrite your resume to
          maximize ATS score and generate a tailored cover letter.
        </p>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description URL
            </label>
            <input
              type="url"
              required
              className={fieldClass}
              placeholder="https://company.com/jobs/software-engineer"
              value={jdUrl}
              onChange={e => setJdUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resume (PDF or DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              required
              className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3
                file:rounded file:border-0 file:text-sm file:font-medium
                file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={e => setResumeFile(e.target.files[0] || null)}
            />
            <p className="text-xs text-gray-400 mt-1">Supports PDF and DOCX formats</p>
          </div>

          <LoadingButton type="submit" isLoading={loading} className="w-full">
            {loading ? 'Optimizing…' : 'Optimize Resume'}
          </LoadingButton>
        </form>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <h3 className="text-lg font-semibold text-gray-800">Optimization Results</h3>

            {/* ATS scores side-by-side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Original ATS Score</p>
                <p className={`text-4xl font-bold ${
                  (result.scores?.old_ats_score ?? 0) >= 70
                    ? 'text-green-600'
                    : (result.scores?.old_ats_score ?? 0) >= 40
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {result.scores?.old_ats_score ?? '—'}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-xs text-blue-600 mb-1">Optimized ATS Score</p>
                <p className={`text-4xl font-bold ${
                  (result.scores?.new_ats_score ?? 0) >= 70
                    ? 'text-green-600'
                    : (result.scores?.new_ats_score ?? 0) >= 40
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {result.scores?.new_ats_score ?? '—'}
                </p>
              </div>
            </div>

            {/* Missing keywords */}
            {result.missing_keywords_found?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Keywords Added</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing_keywords_found.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Download buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              {result.resume_pdf && (
                <button
                  onClick={() => downloadBase64Pdf(result.resume_pdf, 'optimized-resume.pdf')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 text-white
                    text-sm font-semibold rounded hover:bg-blue-900 transition-colors"
                >
                  ⬇ Download Resume PDF
                </button>
              )}
              {result.cover_letter_pdf && (
                <button
                  onClick={() => downloadBase64Pdf(result.cover_letter_pdf, 'cover-letter.pdf')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white
                    text-sm font-semibold rounded hover:bg-gray-800 transition-colors"
                >
                  ⬇ Download Cover Letter PDF
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
