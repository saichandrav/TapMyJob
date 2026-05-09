"""
api_scrapers.py — Fetches jobs from 4 free/key-based APIs.

Usage:
    python api_scrapers.py <base64-encoded-json-args>

Args JSON format:
    {
        "query": "software engineer",
        "location": "remote",
        "adzuna_app_id": "...",
        "adzuna_app_key": "...",
        "the_muse_api_key": "..."
    }

Prints a JSON array of normalized job objects to stdout.
"""

import sys
import json
import base64
import asyncio
import traceback
import httpx


# ---------------------------------------------------------------------------
# Normalization helpers
# ---------------------------------------------------------------------------

def _safe_str(value, default=""):
    """Return value as a stripped string, or default if None/empty."""
    if value is None:
        return default
    return str(value).strip() or default


def _normalize_job_type(raw):
    """Map raw job-type strings to canonical values."""
    if not raw:
        return "unknown"
    raw_lower = raw.lower()
    if "full" in raw_lower:
        return "full-time"
    if "part" in raw_lower:
        return "part-time"
    if "intern" in raw_lower:
        return "internship"
    if "contract" in raw_lower or "freelance" in raw_lower:
        return "contract"
    return "unknown"


def _make_job(title, company, location, job_type, apply_link, description, source_platform):
    """Return a normalized 7-field job dict."""
    return {
        "title": _safe_str(title, "Unknown Title"),
        "company": _safe_str(company, "Unknown Company"),
        "location": _safe_str(location, "Unknown Location"),
        "job_type": _normalize_job_type(job_type),
        "apply_link": _safe_str(apply_link),
        "description": _safe_str(description)[:500],
        "source_platform": source_platform,
    }


# ---------------------------------------------------------------------------
# Scraper functions
# ---------------------------------------------------------------------------

async def fetch_remotive(client, query):
    """Fetch remote jobs from Remotive API (no key required)."""
    url = f"https://remotive.com/api/remote-jobs?search={query}&limit=20"
    try:
        resp = await client.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        jobs = data.get("jobs", [])
        result = []
        for job in jobs:
            result.append(_make_job(
                title=job.get("title"),
                company=job.get("company_name"),
                location=job.get("candidate_required_location") or "Remote",
                job_type=job.get("job_type"),
                apply_link=job.get("url"),
                description=job.get("description"),
                source_platform="remotive",
            ))
        return result
    except Exception as e:
        print(f"[api_scrapers] remotive error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return []


async def fetch_arbeitnow(client, query):
    """Fetch jobs from Arbeitnow API (no key required)."""
    url = f"https://www.arbeitnow.com/api/job-board-api?search={query}"
    try:
        resp = await client.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        jobs = data.get("data", [])
        result = []
        for job in jobs:
            # Arbeitnow uses tags for job type
            tags = job.get("tags", [])
            job_type_raw = tags[0] if tags else ""
            result.append(_make_job(
                title=job.get("title"),
                company=job.get("company_name"),
                location=job.get("location") or "Remote",
                job_type=job_type_raw,
                apply_link=job.get("url"),
                description=job.get("description"),
                source_platform="arbeitnow",
            ))
        return result
    except Exception as e:
        print(f"[api_scrapers] arbeitnow error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return []


async def fetch_adzuna(client, query, location, app_id, app_key):
    """Fetch jobs from Adzuna API (requires app_id and app_key)."""
    if not app_id or not app_key:
        print("[api_scrapers] adzuna: missing app_id or app_key, skipping", file=sys.stderr)
        return []
    url = (
        f"https://api.adzuna.com/v1/api/jobs/us/search/1"
        f"?app_id={app_id}&app_key={app_key}"
        f"&what={query}&where={location}&results_per_page=20"
    )
    try:
        resp = await client.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        jobs = data.get("results", [])
        result = []
        for job in jobs:
            result.append(_make_job(
                title=job.get("title"),
                company=job.get("company", {}).get("display_name"),
                location=job.get("location", {}).get("display_name"),
                job_type=job.get("contract_time"),
                apply_link=job.get("redirect_url"),
                description=job.get("description"),
                source_platform="adzuna",
            ))
        return result
    except Exception as e:
        print(f"[api_scrapers] adzuna error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return []


async def fetch_the_muse(client, query, api_key):
    """Fetch jobs from The Muse API (optional key)."""
    url = f"https://www.themuse.com/api/public/jobs?category={query}&page=1&descending=true"
    if api_key:
        url += f"&api_key={api_key}"
    try:
        resp = await client.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        jobs = data.get("results", [])
        result = []
        for job in jobs:
            # Location: list of location objects
            locations = job.get("locations", [])
            location_str = locations[0].get("name", "Unknown") if locations else "Unknown"

            # Company name
            company = job.get("company", {}).get("name", "Unknown Company")

            # Job type from levels
            levels = job.get("levels", [])
            job_type_raw = levels[0].get("name", "") if levels else ""

            # Apply link
            refs = job.get("refs", {})
            apply_link = refs.get("landing_page", "")

            # Description from contents
            description = job.get("contents", "")

            result.append(_make_job(
                title=job.get("name"),
                company=company,
                location=location_str,
                job_type=job_type_raw,
                apply_link=apply_link,
                description=description,
                source_platform="the_muse",
            ))
        return result
    except Exception as e:
        print(f"[api_scrapers] the_muse error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return []


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def main():
    # Decode base64 args from argv
    try:
        args_b64 = sys.argv[1]
        args_json = base64.b64decode(args_b64).decode("utf-8")
        args = json.loads(args_json)
    except Exception as e:
        print(f"[api_scrapers] Failed to parse args: {e}", file=sys.stderr)
        print(json.dumps([]))
        return

    query = args.get("query", "software engineer")
    location = args.get("location", "remote")
    adzuna_app_id = args.get("adzuna_app_id", "")
    adzuna_app_key = args.get("adzuna_app_key", "")
    the_muse_api_key = args.get("the_muse_api_key", "")

    async with httpx.AsyncClient(
        headers={"User-Agent": "TapMyJob/1.0 (job aggregator)"},
        follow_redirects=True,
    ) as client:
        results = await asyncio.gather(
            fetch_remotive(client, query),
            fetch_arbeitnow(client, query),
            fetch_adzuna(client, query, location, adzuna_app_id, adzuna_app_key),
            fetch_the_muse(client, query, the_muse_api_key),
            return_exceptions=False,
        )

    # Flatten all results
    all_jobs = []
    for source_jobs in results:
        if isinstance(source_jobs, list):
            all_jobs.extend(source_jobs)

    print(json.dumps(all_jobs))


if __name__ == "__main__":
    asyncio.run(main())
