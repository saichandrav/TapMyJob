const axios = require('axios');

/**
 * Helper to extract JSON from a response that may be wrapped in markdown code fences.
 * Strips ```json ... ``` or ``` ... ``` wrappers.
 */
const extractJSON = (text) => {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  return text.trim();
};

/**
 * Call the configured LLM with a prompt and optional system prompt.
 * Routing priority: Groq API → Ollama/local LLM → Mock fallback
 *
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - The system/context prompt
 * @returns {Promise<string>} JSON string response from the LLM
 */
const callLLM = async (prompt, systemPrompt) => {

  // Option A: Groq API
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const rawContent = response.data.choices[0].message.content;
      const jsonStr = extractJSON(rawContent);

      // Parse and re-stringify to validate; unwrap nested arrays if needed
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed) && typeof parsed === 'object') {
        const firstKey = Object.keys(parsed)[0];
        if (Array.isArray(parsed[firstKey])) {
          return JSON.stringify(parsed[firstKey]);
        }
      }
      return JSON.stringify(parsed);

    } catch (err) {
      console.error('Groq API error:', err.response?.data || err.message);
      throw new Error(`Groq API error: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  // Option B: Local LLM (Ollama / LM Studio)
  if (process.env.LOCAL_LLM_URL) {
    try {
      const response = await axios.post(process.env.LOCAL_LLM_URL, {
        model: process.env.LOCAL_LLM_MODEL || 'llama3:latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: false
      });
      return response.data.message?.content || response.data.choices?.[0]?.message?.content;
    } catch (err) {
      console.error('Local LLM error:', err.message);
      throw err;
    }
  }

  // Fallback: deterministic mock data for development
  console.warn('No LLM configured (GROQ_API_KEY or LOCAL_LLM_URL). Using mock data.');

  if (prompt.includes('Extract details from this resume')) {
    return JSON.stringify({
      experience_level: 'Entry Level',
      top_skills: ['JavaScript', 'React', 'Node.js'],
      target_roles: ['Frontend Developer', 'Full Stack Developer'],
      location_preference: 'Remote',
      work_preference: 'Full-time'
    });
  }

  if (prompt.includes('score the following jobs')) {
    return JSON.stringify([
      {
        title: 'Frontend Engineer',
        company: 'Tech Corp',
        skill_match: 85,
        competition_estimate: 50,
        match_reason: 'High skill overlap in React.',
        missing_skills: ['TypeScript']
      }
    ]);
  }

  return JSON.stringify({ error: 'Unknown prompt type' });
};

module.exports = { callLLM, extractJSON };
