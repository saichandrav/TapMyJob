/**
 * ProfileEditor — editable form for all five Profile fields.
 *
 * Props:
 *   profile   {Profile}   — current profile object (may be null/undefined)
 *   onUpdate  {function}  — called with the updated profile object on any change
 */
export default function ProfileEditor({ profile, onUpdate }) {
  const p = profile || {};

  const handleChange = (field, value) => {
    onUpdate?.({ ...p, [field]: value });
  };

  const handleArrayChange = (field, value) => {
    // Comma-separated string → trimmed array
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    onUpdate?.({ ...p, [field]: arr });
  };

  const fieldClass =
    'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Experience Level */}
      <div>
        <label className={labelClass}>Experience Level</label>
        <select
          className={fieldClass}
          value={p.experience_level || ''}
          onChange={e => handleChange('experience_level', e.target.value)}
        >
          <option value="">Select level…</option>
          <option value="Entry Level">Entry Level</option>
          <option value="Mid-Level">Mid-Level</option>
          <option value="Senior">Senior</option>
          <option value="Lead">Lead</option>
          <option value="Manager">Manager</option>
        </select>
      </div>

      {/* Work Preference */}
      <div>
        <label className={labelClass}>Work Preference</label>
        <select
          className={fieldClass}
          value={p.work_preference || ''}
          onChange={e => handleChange('work_preference', e.target.value)}
        >
          <option value="">Select preference…</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Internship">Internship</option>
          <option value="Contract">Contract</option>
          <option value="Freelance">Freelance</option>
        </select>
      </div>

      {/* Location Preference */}
      <div>
        <label className={labelClass}>Location Preference</label>
        <input
          type="text"
          className={fieldClass}
          placeholder="e.g. Remote, Bangalore, New York"
          value={p.location_preference || ''}
          onChange={e => handleChange('location_preference', e.target.value)}
        />
      </div>

      {/* Top Skills */}
      <div>
        <label className={labelClass}>Top Skills (comma-separated)</label>
        <input
          type="text"
          className={fieldClass}
          placeholder="e.g. React, Node.js, Python"
          value={Array.isArray(p.top_skills) ? p.top_skills.join(', ') : (p.top_skills || '')}
          onChange={e => handleArrayChange('top_skills', e.target.value)}
        />
      </div>

      {/* Target Roles */}
      <div className="sm:col-span-2">
        <label className={labelClass}>Target Roles (comma-separated)</label>
        <input
          type="text"
          className={fieldClass}
          placeholder="e.g. Frontend Developer, Full Stack Engineer"
          value={Array.isArray(p.target_roles) ? p.target_roles.join(', ') : (p.target_roles || '')}
          onChange={e => handleArrayChange('target_roles', e.target.value)}
        />
      </div>
    </div>
  );
}
