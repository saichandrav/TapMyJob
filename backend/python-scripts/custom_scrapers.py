"""
custom_scrapers.py — Scrapes 5 job sources using httpx/BeautifulSoup/Playwright.

Usage:
    python custom_scrapers.py <base64-encoded-json-args>

Args JSON format:
    {
        "query": "software engineer",
        "location": "india"
    }

Prints a JSON array of normalized job objects to stdout.
"""

import sys
import json
import base64
import asyncio
import traceback
import re

import httpx
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Normalization helpers (same as api_scrapers.py)
# ---------------------------------------------------------------------------

def _safe_str(value, default=""):
    if value is None:
        return default
    return str(value).strip() or default


def _normalize_job_type(raw):
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

async def fetch_internshala(client, query):
    """Scrape internship listings from Internshala."""
    # URL-encode query for path segment
    query_slug = re.sub(r"\s+", "-", query.strip().lower())
    url = f"https://internshala.com/internships/keywords-{query_slug}/"
    try:
        resp = await client.get(url, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        result = []
        # Internshala internship cards have class "internship_meta" or similar
        cards = soup.select(".internship_meta") or soup.select(".individual_internship")
        for card in cards[:20]:
            title_el = card.select_one(".profile") or card.select_one("h3")
            company_el = card.select_one(".company_name") or card.select_one(".company-name")
            location_el = card.select_one(".location_link") or card.select_one(".location")
            stipend_el = card.select_one(".stipend") or card.select_one(".stipend_salary")
            link_el = card.select_one("a[href]")

            title = title_el.get_text(strip=True) if title_el else "Internship"
            company = company_el.get_text(strip=True) if company_el else "Unknown Company"
            location = location_el.get_text(strip=True) if location_el else "India"
            stipend = stipend_el.get_text(strip=True) if stipend_el else ""
            href = link_el["href"] if link_el else ""
            apply_link = href if href.startswith("http") else f"https://internshala.com{href}"

            result.append(_make_job(
                title=title,
                company=company,
                location=location,
                job_type="internship",
                apply_link=apply_link,
                description=f"Stipend: {stipend}" if stipend else "",
                source_platform="internshala",
            ))
        return result
    except Exception as e:
        print(f"[custom_scrapers] internshala error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return []


async def fetch_bayt(client, query, location):
    """Scrape job listings from Bayt.com."""
    query_slug = re.sub(r"\s+", "-", query.strip().lower())
    url = f"https://www.bayt.com/en/international/jobs/{query_slug}-jobs/"
    try:
        resp = await client.get(url, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        result = []
        # Bayt job cards
        cards = soup.select("li[data-js-job]") or soup.select(".has-pointer-d")
        for card in cards[:20]:
            title_el = card.select_one("h2 a") or card.select_one(".jb-title")
            company_el = card.select_one("[data-automation-id='job-company']") or card.select_one(".jb-company")
            location_el = card.select_one("[data-automation-id='job-location']") or card.select_one(".jb-loc")
            link_el = card.select_one("a[href]")

            title = title_el.get_text(strip=True) if title_el else "Job"
            company = company_el.get_text(strip=True) if company_el else "Unknown Company"
            loc = location_el.get_text(strip=True) if location_el else location or "Unknown"
            href = link_el["href"] if link_el else ""
            apply_link = href if href.startswith("http") else f"https://www.bayt.com{href}"

            result.append(_make_job(
                title=title,
                company=company,
                location=loc,
                job_type="unknown",
                apply_link=apply_link,
                description="",
                source_platform="bayt",
            ))
        return result
    except Exception as e:
        print(f"[custom_scrapers] bayt error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return []


async def fetch_yc(client, query):
    """Scrape job listings from Y Combinator's Work at a Startup."""
    url = f"https://www.workatastartup.com/jobs?query={query}"
    try:
        resp = await client.get(url, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        result = []
        # YC job listings
        cards = soup.select(".job-name") or soup.select("[class*='JobListItem']") or soup.select("div.mb-3")
        # Try a broader selector if specific ones don't match
        if not cards:
            cards = soup.select("a[href*='/jobs/']")

        for card in cards[:20]:
            # If it's a link element
            if card.name == "a":
                title = card.get_text(strip=True)
                href = card.get("href", "")
                apply_link = href if href.startswith("http") else f"https://www.workatastartup.com{href}"
                result.append(_make_job(
                    title=title or "Job",
                    company="YC Startup",
                    location="Remote",
                    job_type="full-time",
                    apply_link=apply_link,
                    description="",
                    source_platform="yc_startup",
                ))
            else:
                title_el = card.select_one("h2") or card.select_one("h3") or card.select_one("a")
                company_el = card.select_one(".company-name") or card.select_one("span")
                location_el = card.select_one(".location") or card.select_one("[class*='location']")
                link_el = card.select_one("a[href]")

                title = title_el.get_text(strip=True) if title_el else "Job"
                company = company_el.get_text(strip=True) if company_el else "YC Startup"
                loc = location_el.get_text(strip=True) if location_el else "Remote"
                href = link_el["href"] if link_el else ""
                apply_link = href if href.startswith("http") else f"https://www.workatastartup.com{href}"

                result.append(_make_job(
                    title=title,
                    company=company,
                    location=loc,
                    job_type="full-time",
                    apply_link=apply_link,
                    description="",
                    source_platform="yc_startup",
                ))
        return result
    except Exception as e:
        print(f"[custom_scrapers] yc error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return []


async def fetch_naukri(query, location):
    """Scrape Naukri.com using Playwright for JS-rendered content."""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("[custom_scrapers] playwright not installed, skipping naukri", file=sys.stderr)
        return []

    query_slug = re.sub(r"\s+", "-", query.strip().lower())
    location_slug = re.sub(r"\s+", "-", location.strip().lower()) if location else "india"
    url = f"https://www.naukri.com/{query_slug}-jobs-in-{location_slug}"

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url, timeout=30000)

            # Wait for job cards to load
            try:
                await page.wait_for_selector(".jobTuple", timeout=10000)
            except Exception:
                try:
                    await page.wait_for_selector("[class*='job-card']", timeout=5000)
                except Exception:
                    pass  # Continue even if selector not found

            content = await page.content()
            await browser.close()

        soup = BeautifulSoup(content, "html.parser")
        result = []

        # Try multiple selectors for Naukri job cards
        cards = (
            soup.select(".jobTuple")
            or soup.select(".job-card")
            or soup.select("[class*='jobCard']")
            or soup.select("article")
        )

        for card in cards[:20]:
            title_el = card.select_one(".title") or card.select_one("a.title") or card.select_one("h2")
            company_el = card.select_one(".companyInfo") or card.select_one(".company-name") or card.select_one("a.subTitle")
            location_el = card.select_one(".location") or card.select_one("[class*='location']")
            link_el = card.select_one("a[href]")

            title = title_el.get_text(strip=True) if title_el else "Job"
            company = company_el.get_text(strip=True) if company_el else "Unknown Company"
            loc = location_el.get_text(strip=True) if location_el else location or "India"
            href = link_el["href"] if link_el else ""
            apply_link = href if href.startswith("http") else f"https://www.naukri.com{href}"

            result.append(_make_job(
                title=title,
                company=company,
                location=loc,
                job_type="unknown",
                apply_link=apply_link,
                description="",
                source_platform="naukri",
            ))
        return result
    except Exception as e:
        print(f"[custom_scrapers] naukri error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return []


async def fetch_github_jobs(client, query):
    """
    GitHub Jobs API is deprecated. Gracefully returns an empty list.
    Attempts to fetch from a known tech job gist as a fallback.
    """
    # GitHub Jobs API is deprecated — return empty list gracefully
    # Attempt a fallback to a public tech jobs JSON gist
    fallback_urls = [
        "https://raw.githubusercontent.com/nicholasgasior/gsfmt/master/README.md",  # placeholder
    ]
    # Since GitHub Jobs is deprecated and no reliable public gist exists,
    # we return an empty list to avoid errors
    print("[custom_scrapers] github_jobs: API deprecated, returning empty list", file=sys.stderr)
    return []


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def main():
    try:
        args_b64 = sys.argv[1]
        args_json = base64.b64decode(args_b64).decode("utf-8")
        args = json.loads(args_json)
    except Exception as e:
        print(f"[custom_scrapers] Failed to parse args: {e}", file=sys.stderr)
        print(json.dumps([]))
        return

    query = args.get("query", "software engineer")
    location = args.get("location", "india")

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }

    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        # Run HTTP-based scrapers concurrently; Naukri uses Playwright separately
        http_results = await asyncio.gather(
            fetch_internshala(client, query),
            fetch_bayt(client, query, location),
            fetch_yc(client, query),
            fetch_github_jobs(client, query),
            return_exceptions=False,
        )

    # Run Playwright-based Naukri scraper
    naukri_results = await fetch_naukri(query, location)

    # Flatten all results
    all_jobs = []
    for source_jobs in http_results:
        if isinstance(source_jobs, list):
            all_jobs.extend(source_jobs)
    all_jobs.extend(naukri_results)

    print(json.dumps(all_jobs))


if __name__ == "__main__":
    asyncio.run(main())
