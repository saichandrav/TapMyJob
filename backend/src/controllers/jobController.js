const jobAggregator = require('../services/jobAggregator');
const scorerService = require('../services/scorerService');
const crypto = require('crypto');

/**
 * POST /api/jobs/search
 * Reads the user profile from session, aggregates jobs from all scrapers,
 * scores them with the LLM, and returns the sorted scored list.
 */
const searchJobs = async (req, res) => {
  const profile = req.session.userProfile;
  if (!profile) {
    return res.status(400).json({ error: 'Please parse your resume first.' });
  }

  try {
    const jobs = await jobAggregator.aggregateJobs(profile);
    const scoredJobs = await scorerService.scoreJobs(jobs, profile);
    return res.json({ jobs: scoredJobs });
  } catch (err) {
    console.error('[JobController] searchJobs error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch and score jobs.' });
  }
};

/**
 * GET /api/jobs/saved
 * Returns the list of saved jobs from the session.
 */
const getSavedJobs = (req, res) => {
  const savedJobs = req.session.savedJobs || [];
  return res.json({ jobs: savedJobs });
};

/**
 * POST /api/jobs/save
 * Saves a job to the session's savedJobs list.
 * Body: { job: <job object> }
 */
const saveJob = (req, res) => {
  const { job } = req.body;
  if (!job || !job.title || !job.company) {
    return res.status(400).json({ error: 'Invalid job object.' });
  }

  if (!req.session.savedJobs) {
    req.session.savedJobs = [];
  }

  // Avoid saving duplicates by apply_link
  const alreadySaved = req.session.savedJobs.some(
    j => j.apply_link === job.apply_link
  );
  if (alreadySaved) {
    return res.status(409).json({ error: 'Job already saved.' });
  }

  req.session.savedJobs.push(job);
  return res.json({ message: 'Job saved.', jobs: req.session.savedJobs });
};

/**
 * DELETE /api/jobs/save/:id
 * Removes a saved job by the MD5 hash of its apply_link.
 * The :id param is the MD5 hash of the job's apply_link.
 */
const removeSavedJob = (req, res) => {
  const { id } = req.params;

  if (!req.session.savedJobs) {
    req.session.savedJobs = [];
  }

  const before = req.session.savedJobs.length;
  req.session.savedJobs = req.session.savedJobs.filter(job => {
    const hash = crypto
      .createHash('md5')
      .update(job.apply_link || '')
      .digest('hex');
    return hash !== id;
  });

  const after = req.session.savedJobs.length;
  if (before === after) {
    return res.status(404).json({ error: 'Job not found in saved list.' });
  }

  return res.json({ message: 'Job removed.', jobs: req.session.savedJobs });
};

module.exports = { searchJobs, getSavedJobs, saveJob, removeSavedJob };
