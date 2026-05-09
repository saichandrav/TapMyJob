import os
import json
from groq import Groq
from typing import Dict, Any
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logger = logging.getLogger(__name__)

# Configure the API client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize Groq client
groq_client = None
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
else:
    logger.warning("GROQ_API_KEY not found in environment variables.")

# Model name
GROQ_MODEL = 'llama-3.3-70b-versatile'


def safe_json_parse(text: str) -> Dict[str, Any]:
    """Safely parse JSON, stripping markdown code blocks if present."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    return json.loads(text.strip())


async def analyze_ats_baseline(old_resume_text: str, scraped_jd_text: str) -> Dict[str, Any]:
    """
    Call 1: The Baseline ATS Analyzer
    Analyzes the old resume against the JD to calculate a strict ATS match score and identify missing keywords.
    """
    system_instruction = (
        "You are an expert Applicant Tracking System (ATS). Analyze the provided resume against the provided job description. "
        "Calculate a strict ATS match score out of 100 based on keyword density, skills alignment, and experience. "
        "Identify the exact critical keywords and skills missing from the resume. "
        "Return ONLY a JSON object with the keys: old_ats_score (integer) and missing_keywords (array of strings)."
    )

    prompt = f"### Resume Text:\n{old_resume_text}\n\n### Job Description:\n{scraped_jd_text}\n\n"

    if not groq_client:
        raise ValueError("Groq API client not available. Please set GROQ_API_KEY in .env file.")

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        raise Exception(f"Groq API failed: {e}")


async def rewrite_resume(old_resume_text: str, scraped_jd_text: str, missing_keywords: list) -> Dict[str, Any]:
    """
    Call 2: The Resume Rewriter & Score Booster
    Rewrites the resume to target the JD, integrating missing keywords.
    """
    system_instruction = (
        "You are an elite executive resume writer. Your task is to OPTIMIZE the resume for the job description while "
        "STRICTLY preserving ALL personal information. "
        "CRITICAL RULES: "
        "1. EXTRACT the EXACT email address from the original resume text. Do NOT make up or use placeholder emails. "
        "2. EXTRACT the EXACT phone number from the original resume text. Do NOT make up or use placeholder numbers. "
        "3. EXTRACT the EXACT full name from the original resume text. Do NOT use placeholders like 'Professional Candidate'. "
        "4. EXTRACT the EXACT LinkedIn, GitHub, CodeChef, LeetCode, and other URLs from the original resume text. "
        "5. DO NOT rewrite project descriptions, titles, or URLs. Keep them EXACTLY as in the original resume. "
        "6. ACTIVELY integrate the provided missing keywords into experience bullet points, professional summary, and skills section. "
        "7. Keep ALL achievements, awards, hackathon results, and competitive rankings EXACTLY as written. "
        "8. Extract and preserve ALL project links from the original resume. "
        "9. The new_ats_score should be significantly higher (90+) than the original score after keyword integration. "
        "Return ONLY a JSON object with these keys: "
        "name (string - EXACT from original), email (string - EXACT from original), phone (string - EXACT from original), "
        "linkedin (string - EXACT from original), github (string - EXACT from original), codechef (string - EXACT from original), "
        "leetcode (string - EXACT from original), portfolio (string - EXACT from original), "
        "professional_summary (string), skills (array of strings), "
        "experience (array of objects with company, title, dates, bullet_points), "
        "projects (array of objects with name, link, description), "
        "achievements (array of strings), "
        "and new_ats_score (integer, should be 90+)."
    )

    keywords_str = ", ".join(missing_keywords)

    # Additional project information for reference
    additional_projects = """
ADDITIONAL PROJECT INFORMATION (use these to enhance projects section if needed):
- Debate Learning Platform: https://debate-psi.vercel.app/ - NextJS, TailwindCSS, NodeJS, GOOGLE Gemini API, Frontend, Backend framework, OpenCV - AI-powered gamified debate learning platform with progression levels, automated feedback agents, quizzes, live simulations
- Logistics Price Recommendation System: HTML, CSS, JavaScript - Model to analyze historical shipments and market signals for optimal logistics pricing
- ZAYKAA Food Platform: https://www.zaykaa.in/ - Whatsapp, Vercel, SEO - Snack ordering and vendor empowerment platform with order management and local distribution
- Inlightn Blueprint Revamp (IIT-Bhubaneswar Hackathon): NextJS, Tailwind CSS, ReactJS, JavaScript/TypeScript, Vercel, AI-based design assistance, Vibe Coding - UI/UX revamp using AI-assisted tools
- Resume Modifier (NRI Hackathon): https://github.com/saichandrav/Nri-Hackathon - crew ai, web scrapers, crawlers - RAG and agent-based resume modification system
- News Copolit: https://github.com/umamahesh358/et - RAG, video generation, speech generation in local language, article summarization in persona-wise - Multi-modal news content generation
"""

    prompt = (
        f"### Original Resume:\n{old_resume_text}\n\n"
        f"### Job Description:\n{scraped_jd_text}\n\n"
        f"### Missing Keywords to Integrate:\n{keywords_str}\n\n"
        f"{additional_projects}\n"
    )

    if not groq_client:
        raise ValueError("Groq API client not available. Please set GROQ_API_KEY in .env file.")

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        raise Exception(f"Groq API failed: {e}")


async def generate_cover_letter(new_resume_json: Dict[str, Any], scraped_jd_text: str) -> Dict[str, Any]:
    """
    Call 3: The Cover Letter Generator
    Generates a cover letter using the newly optimized resume and the JD.
    """
    system_instruction = (
        "Write a highly persuasive, professional cover letter for the provided job description, "
        "using the candidate's newly optimized resume as the source of truth. "
        "Keep it under 300 words, highly tailored to the company, and engaging. "
        "Return ONLY a JSON object with the key cover_letter_text (string broken by newline characters)."
    )

    prompt = (
        f"### Optimized Resume JSON:\n{json.dumps(new_resume_json, indent=2)}\n\n"
        f"### Job Description:\n{scraped_jd_text}\n\n"
    )

    if not groq_client:
        raise ValueError("Groq API client not available. Please set GROQ_API_KEY in .env file.")

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        raise Exception(f"Groq API failed: {e}")
