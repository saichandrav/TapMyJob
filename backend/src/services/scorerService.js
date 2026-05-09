const llmService = require('./llmService');

/**
 * Competition estimate heuristics per source platform.
 * Higher value = less competition = better score contribution.
 * Lower value = more competition = worse score contribution.
 */
const COMPETITION_HEURISTICS = {
  linkedin: (job) => {
    if (job.date_posted) {
      const daysOld = (Date.now() - new Date(job.date_posted).getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld > 3) return 30; // old LinkedIn post = high competition = low score
    }
    return 45;
  },
  yc_startup: () => 75,
  adzuna: () => 70,
  the_muse: () => 65,
  internshala: () => 60,
  remotive: () => 65,
  arbeitnow: () => 65,
  bayt: () => 60,
  naukri: () => 50,
  github_jobs: () => 70,
  default: () => 50
};

/**
 * Get competition estimate for a job based on its source platform.
 *
 * @param {object} job - Normalized job object
 * @returns {number} Competition estimate (0–100)
 */
function getCompetitionEstimate(job) {
  const platform = job.source_platform?.toLowerCase() || 'default';
  const heuristic = COMPETITION_HEURISTICS[platform] || COMPETITION_HEURISTICS.default;
  return heuristic(job);
}

/**
 * Compute selection probability from skill match and competition estimate.
 * Formula: Math.round(skill_match * 0.6 + competition_estimate * 0.4)
 *
 * @param {number} skillMatch - Skill match score (0–100)
 * @param {number} competitionEstimate - Competition estimate (0–100)
 * @returns {number} Selection probability (0–100)
 */
function computeSelectionProbability(skillMatch, competitionEstimate) {
  return Math.round(skillMatch * 0.6 + competitionEstimate * 0.4);
}

/**
 * Score a list of jobs against a user profile using the LLM.
 * Batches jobs (max 20 per LLM call), applies competition heuristics,
 * computes selection_probability, and sorts descending.
 *
 * @param {object[]} jobs - Array of normalized job objects
 * @param {object} profile - User profile from session
 * @returns {Promise<object[]>} Scored and sorted job array
 */
async function scoreJobs(jobs, profile) {
  if (!jobs || jobs.length === 0) return [];

  const BATCH_SIZE = 20;
  const batches = [];
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    batches.push(jobs.slice(i, i + BATCH_SIZE));
  }

  const systemPrompt =
    'You are a job matching AI. Score each job against the user profile. ' +
    'Return ONLY a JSON array with no additional text or markdown.';

  const scoredBatches = await Promise.all(
    batches.map(async (batch) => {
      const jobsForLLM = batch.map(j => ({
        title: j.title,
        company: j.company,
        description: j.description ? j.description.substring(0, 300) : ''
      }));

      const prompt =
        `Score these jobs for this user profile.\n` +
        `Profile: ${JSON.stringify(profile)}\n` +
        `Jobs: ${JSON.stringify(jobsForLLM)}\n\n` +
        `Return a JSON array where each element has:\n` +
        `- title (string)\n` +
        `- company (string)\n` +
        `- skill_match (integer 0-100)\n` +
        `- match_reason (string)\n` +
        `- missing_skills (array of strings)`;

      let llmResults;
      try {
        const raw = await llmService.callLLM(prompt, systemPrompt);
        llmResults = JSON.parse(raw);
        if (!Array.isArray(llmResults)) {
          throw new Error('LLM response is not an array');
        }
      } catch (err) {
        console.error('[Scorer] LLM error:', err.message);
        // Fallback: return batch with default scores
        return batch.map(j => ({
          ...j,
          skill_match: 50,
          competition_estimate: getCompetitionEstimate(j),
          selection_probability: computeSelectionProbability(50, getCompetitionEstimate(j)),
          match_reason: 'Score unavailable',
          missing_skills: []
        }));
      }

      return batch.map((job, idx) => {
        const llmData = llmResults[idx] || {};
        const skillMatch = Math.min(100, Math.max(0, Number(llmData.skill_match) || 50));
        const competitionEstimate = getCompetitionEstimate(job);
        const selectionProbability = computeSelectionProbability(skillMatch, competitionEstimate);
        return {
          ...job,
          skill_match: skillMatch,
          competition_estimate: competitionEstimate,
          selection_probability: selectionProbability,
          match_reason: llmData.match_reason || '',
          missing_skills: Array.isArray(llmData.missing_skills) ? llmData.missing_skills : []
        };
      });
    })
  );

  const allScored = scoredBatches.flat();

  // Sort descending by selection_probability
  allScored.sort((a, b) => b.selection_probability - a.selection_probability);

  return allScored;
}

module.exports = { scoreJobs, computeSelectionProbability, getCompetitionEstimate };
