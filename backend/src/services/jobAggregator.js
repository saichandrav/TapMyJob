const { PythonShell } = require('python-shell');
const path = require('path');

const SCRIPTS_DIR = path.join(__dirname, '../../python-scripts');

/**
 * Run a Python scraper script with base64-encoded JSON args.
 * Resolves with the array of job objects returned by the script.
 * Never rejects — errors are logged and an empty array is returned.
 *
 * @param {string} scriptName - Python script filename (e.g. 'api_scrapers.py')
 * @param {object} args - Arguments object to pass to the script
 * @returns {Promise<object[]>}
 */
function runPythonScript(scriptName, args) {
  return new Promise((resolve) => {
    const base64Args = Buffer.from(JSON.stringify(args)).toString('base64');
    const options = {
      mode: 'json',
      pythonPath: 'python',
      scriptPath: SCRIPTS_DIR,
      args: [base64Args]
    };
    PythonShell.run(scriptName, options)
      .then(messages => {
        // python-shell in json mode returns an array of parsed objects.
        // Our scripts print a single JSON array, so messages[0] is the array.
        const result = Array.isArray(messages[0]) ? messages[0] : [];
        resolve(result);
      })
      .catch(err => {
        console.error(`[JobAggregator] ${scriptName} failed:`, err.message);
        resolve([]);
      });
  });
}

/**
 * Remove duplicate jobs based on the (title, company, location) triple.
 * Comparison is case-insensitive and whitespace-trimmed.
 *
 * @param {object[]} jobs
 * @returns {object[]}
 */
function deduplicateJobs(jobs) {
  const seen = new Set();
  return jobs.filter(job => {
    const key = `${job.title?.toLowerCase().trim()}|${job.company?.toLowerCase().trim()}|${job.location?.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Aggregate jobs from all three Python scrapers in parallel.
 * Deduplicates results and returns up to 200 jobs.
 *
 * @param {object} profile - User profile from session
 * @param {object} [extraArgs={}] - Optional extra arguments
 * @returns {Promise<object[]>} Deduplicated, normalized job array (max 200)
 */
async function aggregateJobs(profile, extraArgs = {}) {
  const query = profile.target_roles?.[0] || 'software engineer';
  const location = profile.location_preference || 'remote';

  const jobspyArgs = {
    search_term: query,
    location,
    results_wanted: 20,
    sites: ['linkedin', 'indeed', 'glassdoor', 'zip_recruiter']
  };

  const apiArgs = {
    query,
    location,
    adzuna_app_id: process.env.ADZUNA_APP_ID || '',
    adzuna_app_key: process.env.ADZUNA_APP_KEY || '',
    the_muse_api_key: process.env.THE_MUSE_API_KEY || ''
  };

  const customArgs = {
    query,
    location
  };

  const results = await Promise.allSettled([
    runPythonScript('jobspy_runner.py', jobspyArgs),
    runPythonScript('api_scrapers.py', apiArgs),
    runPythonScript('custom_scrapers.py', customArgs)
  ]);

  // Collect results from all settled promises (fulfilled or rejected)
  const allJobs = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

  // Filter out malformed entries and jobs with no apply link
  const normalized = allJobs.filter(j => j && j.title && j.company && j.apply_link);

  // Deduplicate and cap at 200
  const deduped = deduplicateJobs(normalized);
  return deduped.slice(0, 200);
}

module.exports = { aggregateJobs, deduplicateJobs, runPythonScript };
