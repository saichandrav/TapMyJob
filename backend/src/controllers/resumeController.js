const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFParser = require('pdf2json');
const llmService = require('../services/llmService');

// Configure multer for PDF uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are supported.'), false);
    }
    cb(null, true);
  }
});

/**
 * Safely delete a temp file, logging any errors but not throwing.
 */
const deleteTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Failed to delete temp file:', filePath, err.message);
    }
  }
};

/**
 * Parse a PDF file using pdf2json and return the extracted text.
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} Extracted text content
 */
const parsePDF = (filePath) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);

    pdfParser.on('pdfParser_dataError', (errData) => {
      reject(new Error(errData.parserError));
    });

    pdfParser.on('pdfParser_dataReady', () => {
      const rawText = pdfParser.getRawTextContent();
      // pdf2json URL-encodes spaces and special chars — decode them
      const text = decodeURIComponent(rawText.replace(/%(?![0-9A-Fa-f]{2})/g, '%25'));
      resolve(text);
    });

    pdfParser.loadPDF(filePath);
  });
};

/**
 * POST /api/resume/parse
 * Accepts a PDF resume via multipart upload, extracts text, calls LLM for profile extraction,
 * saves profile to session, and returns the profile.
 */
const parseResume = async (req, res) => {
  const filePath = req.file ? req.file.path : null;

  // Multer fileFilter error is surfaced via req.fileValidationError if we use a custom approach,
  // but with multer's cb(err) pattern the error is passed to Express error handler.
  // We handle the case where no file was uploaded.
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or file is not a PDF.' });
  }

  let resumeText;
  try {
    resumeText = await parsePDF(filePath);
  } catch (parseErr) {
    console.error('PDF parse error:', parseErr.message);
    deleteTempFile(filePath);
    return res.status(500).json({ error: 'Failed to parse resume' });
  }

  const systemPrompt =
    'You are a resume parser. Extract structured profile information from the provided resume text. ' +
    'Return ONLY valid JSON with no additional text or markdown.';

  const prompt =
    `Extract details from this resume and return a JSON object with exactly these fields:\n` +
    `- experience_level: string (e.g. "Entry Level", "Mid-Level", "Senior")\n` +
    `- top_skills: array of strings (non-empty, list all technical and soft skills)\n` +
    `- target_roles: array of strings (non-empty, infer from experience and skills)\n` +
    `- location_preference: string (extract city/country from resume, or "Remote" if not found)\n` +
    `- work_preference: string (e.g. "Full-time", "Internship", "Contract")\n\n` +
    `Resume text (first 5000 chars):\n${resumeText.substring(0, 5000)}`;

  let profile;
  try {
    const llmResponse = await llmService.callLLM(prompt, systemPrompt);
    profile = JSON.parse(llmResponse);
  } catch (llmErr) {
    console.error('LLM error:', llmErr.message);
    deleteTempFile(filePath);
    return res.status(500).json({ error: `LLM returned invalid JSON: ${llmErr.message}` });
  }

  // Cleanup temp file on success
  deleteTempFile(filePath);

  // Save profile to session
  req.session.userProfile = profile;

  return res.json({ user_summary: profile });
};

module.exports = {
  upload,
  parseResume
};
