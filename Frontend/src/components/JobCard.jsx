import ScoreBadge from './ScoreBadge';
import SourceBadge from './SourceBadge';

/**
 * JobCard — displays a single scored job listing.
 *
 * Props:
 *   job        {ScoredJob}  — the job object
 *   isSaved    {boolean}    — whether this job is already saved
 *   onSave     {function}   — called with (job) to save
 *   onRemove   {function}   — called with (job) to unsave/remove
 */
export default function JobCard({ job, isSaved = false, onSave, onRemove }) {
  const {
    title,
    company,
    location,
    job_type,
    apply_link,
    source_platform,
    skill_match,
    selection_probability,
    missing_skills = [],
    match_reason,
  } = job;

  const handleSaveToggle = () => {
    if (isSaved) {
      onRemove?.(job);
    } else {
      onSave?.(job);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-blue-900 truncate">{title}</h3>
          <p className="text-sm text-gray-700 mt-0.5">
            {company}
            {location && <span className="text-gray-400"> &bull; {location}</span>}
          </p>
        </div>
        <SourceBadge platform={source_platform} />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2">
        {job_type && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
            {job_type}
          </span>
        )}
        <ScoreBadge score={skill_match} label="Skill Match" />
        <ScoreBadge score={selection_probability} label="Selection" />
      </div>

      {/* Match reason */}
      {match_reason && (
        <p className="text-sm text-gray-600 leading-relaxed">{match_reason}</p>
      )}

      {/* Missing skills */}
      {missing_skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-gray-500 self-center">Missing:</span>
          {missing_skills.map((skill, i) => (
            <span
              key={i}
              className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        {apply_link ? (
          <a
            href={apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline"
          >
            Apply &rarr;
          </a>
        ) : (
          <span className="text-sm text-gray-400">No link</span>
        )}

        <button
          onClick={handleSaveToggle}
          className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
            isSaved
              ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          {isSaved ? 'Unsave' : 'Save'}
        </button>
      </div>
    </div>
  );
}
