/**
 * SourceBadge — small label pill showing the source_platform of a job listing.
 *
 * Props:
 *   platform  {string}  — e.g. "linkedin", "indeed", "remotive", "yc"
 */

const PLATFORM_COLORS = {
  linkedin:     'bg-blue-100 text-blue-800',
  indeed:       'bg-indigo-100 text-indigo-800',
  glassdoor:    'bg-green-100 text-green-800',
  ziprecruiter: 'bg-purple-100 text-purple-800',
  remotive:     'bg-teal-100 text-teal-800',
  arbeitnow:    'bg-orange-100 text-orange-800',
  adzuna:       'bg-pink-100 text-pink-800',
  themuse:      'bg-rose-100 text-rose-800',
  internshala:  'bg-cyan-100 text-cyan-800',
  bayt:         'bg-amber-100 text-amber-800',
  yc:           'bg-yellow-100 text-yellow-800',
  naukri:       'bg-lime-100 text-lime-800',
  github:       'bg-gray-100 text-gray-800',
};

export default function SourceBadge({ platform }) {
  const key = (platform || '').toLowerCase().replace(/\s+/g, '');
  const colorClass = PLATFORM_COLORS[key] ?? 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {platform || 'Unknown'}
    </span>
  );
}
