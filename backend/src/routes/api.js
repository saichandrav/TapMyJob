const express = require('express');
const router = express.Router();
const multer = require('multer');
const requireAuth = require('../middleware/requireAuth');
const resumeController = require('../controllers/resumeController');
const jobController = require('../controllers/jobController');
const optimizerController = require('../controllers/optimizerController');

// Multer instance for optimizer (temp storage for PDF/DOCX proxy)
const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const optimizerUpload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowed =
      ALLOWED_MIMETYPES.has(file.mimetype) ||
      file.originalname?.toLowerCase().endsWith('.pdf') ||
      file.originalname?.toLowerCase().endsWith('.docx') ||
      file.originalname?.toLowerCase().endsWith('.doc');
    if (!allowed) {
      return cb(new Error('Only PDF and DOCX files are supported.'), false);
    }
    cb(null, true);
  }
});

// Apply requireAuth to all /api routes
router.use(requireAuth);

// ── Resume ──────────────────────────────────────────────────────────────────
// POST /api/resume/parse — upload and parse a PDF resume
router.post(
  '/resume/parse',
  resumeController.upload.single('resume'),
  resumeController.parseResume
);

// ── Jobs ─────────────────────────────────────────────────────────────────────
// POST /api/jobs/search — aggregate + score jobs from all scrapers
router.post('/jobs/search', jobController.searchJobs);

// GET /api/jobs/saved — return saved jobs from session
router.get('/jobs/saved', jobController.getSavedJobs);

// POST /api/jobs/save — save a job to session
router.post('/jobs/save', jobController.saveJob);

// DELETE /api/jobs/save/:id — remove a saved job by apply_link hash
router.delete('/jobs/save/:id', jobController.removeSavedJob);

// ── Optimizer ────────────────────────────────────────────────────────────────
// POST /api/optimize — proxy to AI Service for ATS resume optimization
router.post(
  '/optimize',
  optimizerUpload.single('resume_file'),
  optimizerController.optimizeResume
);

module.exports = router;
