const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/optimize
 * Proxies the request to the AI Service's /api/optimize-resume endpoint.
 * Accepts multipart form data with:
 *   - jd_url: string (job description URL)
 *   - resume_file: PDF file (uploaded via multer)
 *
 * Returns the AI Service response directly to the client.
 */
const optimizeResume = async (req, res) => {
  // jd_url comes from the body (parsed by multer fields)
  const jdUrl = req.body?.jd_url;
  const resumeFile = req.file;

  if (!jdUrl) {
    return res.status(400).json({ error: 'jd_url is required.' });
  }

  if (!resumeFile) {
    return res.status(400).json({ error: 'resume_file is required.' });
  }

  // Build FormData to forward to AI service
  const formData = new FormData();
  formData.append('jd_url', jdUrl);
  formData.append(
    'resume_file',
    fs.createReadStream(resumeFile.path),
    {
      filename: resumeFile.originalname || 'resume.pdf',
      contentType: resumeFile.mimetype || 'application/pdf'
    }
  );

  let aiResponse;
  try {
    aiResponse = await fetch(`${AI_SERVICE_URL}/api/optimize-resume`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
  } catch (networkErr) {
    console.error('[OptimizerController] AI service unreachable:', networkErr.message);
    // Clean up temp file
    _deleteTempFile(resumeFile.path);
    return res.status(502).json({ error: 'AI service unavailable' });
  }

  // Clean up temp file after forwarding
  _deleteTempFile(resumeFile.path);

  if (!aiResponse.ok) {
    let errorBody;
    try {
      errorBody = await aiResponse.json();
    } catch {
      errorBody = { detail: `AI service returned HTTP ${aiResponse.status}` };
    }
    return res.status(aiResponse.status).json({ error: errorBody.detail || 'AI service error' });
  }

  let responseData;
  try {
    responseData = await aiResponse.json();
  } catch (parseErr) {
    console.error('[OptimizerController] Failed to parse AI service response:', parseErr.message);
    return res.status(502).json({ error: 'AI service returned invalid response' });
  }

  return res.json(responseData);
};

/**
 * Safely delete a temp file without throwing.
 * @param {string} filePath
 */
function _deleteTempFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('[OptimizerController] Failed to delete temp file:', filePath, err.message);
    }
  }
}

module.exports = { optimizeResume };
