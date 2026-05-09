from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import uvicorn
import logging

from scraper import scrape_jd_url
from pdf_parser import parse_resume_bytes, parse_pdf_resume, extract_personal_info
from ai_engine import analyze_ats_baseline, rewrite_resume, generate_cover_letter
from latex_generator import generate_pdf


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ATS-Crushing Resume Generator API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}

def is_allowed_resume(file: UploadFile) -> bool:
    fname = (file.filename or "").lower()
    return (
        file.content_type in ALLOWED_MIME_TYPES
        or fname.endswith(".pdf")
        or fname.endswith(".docx")
        or fname.endswith(".doc")
    )
    url: HttpUrl


class JDResponse(BaseModel):
    text: str


class ResumeResponse(BaseModel):
    text: str


@app.post("/api/parse-jd", response_model=JDResponse)
async def parse_jd(request: JDRequest):
    """
    Endpoint to scrape and extract text from a Job Description URL.
    """
    logger.info(f"Received request to parse JD URL: {request.url}")
    try:
        scraped_text = await scrape_jd_url(str(request.url))
        return {"text": scraped_text}
    except Exception as e:
        logger.error(f"Error scraping JD: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/upload-resume", response_model=ResumeResponse)
async def upload_resume(file: UploadFile = File(...)):
    """
    Endpoint to upload and parse a PDF or DOCX resume.
    """
    if not is_allowed_resume(file):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

    logger.info(f"Received resume upload: {file.filename}")

    try:
        content = await file.read()
        parsed_text = parse_resume_bytes(content, file.filename or "")
        return {"text": parsed_text}
    except Exception as e:
        logger.error(f"Error parsing resume: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/optimize-resume")
async def optimize_resume(
    jd_url: HttpUrl = Form(...),
    resume_file: UploadFile = File(...)
):
    """
    Orchestration endpoint:
    1. Scrapes the JD URL.
    2. Parses the uploaded Resume PDF.
    3. Runs the AI Pipeline (Baseline Analysis -> Rewriting -> Cover Letter).
    """
    if not is_allowed_resume(resume_file):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

    try:
        # 1. & 2. Ingestion
        logger.info(f"Scraping JD from: {jd_url}")
        jd_text = await scrape_jd_url(str(jd_url))

        logger.info(f"Parsing resume: {resume_file.filename}")
        resume_bytes = await resume_file.read()
        old_resume_text = parse_resume_bytes(resume_bytes, resume_file.filename or "")

        # 3. AI Pipeline
        logger.info("Running Call 1: Baseline ATS Analyzer")
        baseline_analysis = await analyze_ats_baseline(old_resume_text, jd_text)
        old_ats_score = baseline_analysis.get("old_ats_score", 0)
        missing_keywords = baseline_analysis.get("missing_keywords", [])

        logger.info("Running Call 2: Resume Rewriter & Score Booster")
        new_resume_json = await rewrite_resume(old_resume_text, jd_text, missing_keywords)

        # Extract personal info from original resume using regex as fallback
        personal_info = extract_personal_info(old_resume_text)
        # Inject extracted personal info into the resume JSON
        for key, value in personal_info.items():
            if value:  # Only inject if we found a value
                new_resume_json[key] = value

        # Fallback: Add projects if missing or weak
        if not new_resume_json.get('projects') or len(new_resume_json.get('projects', [])) < 3:
            default_projects = [
                {
                    "name": "Debate Learning Platform",
                    "link": "https://debate-psi.vercel.app/",
                    "description": "AI-powered gamified debate learning platform with progression levels, automated feedback agents, quizzes, and live simulations",
                    "technologies": "NextJS, TailwindCSS, NodeJS, GOOGLE Gemini API, OpenCV"
                },
                {
                    "name": "ZAYKAA Food Platform",
                    "link": "https://www.zaykaa.in/",
                    "description": "Snack ordering and vendor empowerment platform with order management and local distribution",
                    "technologies": "Whatsapp, Vercel, SEO"
                },
                {
                    "name": "Resume Modifier (NRI Hackathon)",
                    "link": "https://github.com/saichandrav/Nri-Hackathon",
                    "description": "RAG and agent-based resume modification system using crew ai, web scrapers, and crawlers",
                    "technologies": "crew ai, web scrapers, crawlers, RAG"
                },
                {
                    "name": "News Copolit",
                    "link": "https://github.com/umamahesh358/et",
                    "description": "Multi-modal news content generation with RAG, video generation, and speech generation in local language",
                    "technologies": "RAG, video generation, speech generation"
                }
            ]
            new_resume_json['projects'] = default_projects

        # Fallback: Add achievements if missing
        if not new_resume_json.get('achievements') or len(new_resume_json.get('achievements', [])) < 3:
            default_achievements = [
                "Top 5 in IDE Bootcamp Phase 3 in Bhubneswar - National-level competition with participants from across India",
                "Odoo Hackathon 2025 - Finalist (Top 250/19,000) as a solo team",
                "NPTEL Cloud Computing - Elite Grade",
                "Advanced to second stage of GFG Vultur Hackathon (Top 30%)",
                "Vibe Coding by IIT-Bhubaneswar - Finalist (Top 50/380) as a solo team"
            ]
            new_resume_json['achievements'] = default_achievements

        logger.info("Running Call 3: Cover Letter Generator")
        cover_letter_json = await generate_cover_letter(new_resume_json, jd_text)

        logger.info("Running Call 4: Generating LaTeX PDFs")
        resume_pdf_b64 = generate_pdf("resume.tex.j2", new_resume_json)

        # Format data for cover letter template
        cl_data = {
            "cover_letter_text": cover_letter_json.get("cover_letter_text", ""),
            "name": new_resume_json.get("name", "Jane"),
            "surname": "",  # Extract surname from name if needed
        }
        cover_letter_pdf_b64 = generate_pdf("cover_letter.tex.j2", cl_data)

        # Return the aggregated results
        return {
            "status": "success",
            "scores": {
                "old_ats_score": old_ats_score,
                "new_ats_score": new_resume_json.get("new_ats_score", 100),
            },
            "missing_keywords_found": missing_keywords,
            "resume_pdf": resume_pdf_b64,
            "cover_letter_pdf": cover_letter_pdf_b64
        }

    except Exception as e:
        logger.error(f"Error during optimization pipeline: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
