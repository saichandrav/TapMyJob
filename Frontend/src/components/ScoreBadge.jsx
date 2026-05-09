/**
 * ScoreBadge — colored pill showing a numeric score (0–100).
 *
 * Color rules:
 *   green  ≥ 70
 *   yellow 40–69
 *   red    < 40
 *
 * Props:
 *   score  {number}  — 0–100
 *   label  {string}  — descriptive label shown before the number
 */
export default function ScoreBadge({ score, label }) {
  const numericScore = Number(score) || 0;

  let colorClass;
  if (numericScore >= 70) {
    colorClass = 'bg-green-100 text-green-800';
  } else if (numericScore >= 40) {
    colorClass = 'bg-yellow-100 text-yellow-800';
  } else {
    colorClass = 'bg-red-100 text-red-800';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}
    >
      {label && <span>{label}:</span>}
      <span>{numericScore}%</span>
    </span>
  );
}
