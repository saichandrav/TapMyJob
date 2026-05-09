import sys
import json
import base64
from jobspy import scrape_jobs

def normalize_job(row):
    """Normalize a JobSpy row dict to the standard 7-field schema."""
    return {
        "title": str(row.get("title") or "Unknown Title").strip(),
        "company": str(row.get("company") or "Unknown Company").strip(),
        "location": str(row.get("location") or "Unknown Location").strip(),
        "job_type": str(row.get("job_type") or "unknown").strip().lower(),
        "apply_link": str(row.get("job_url") or row.get("apply_link") or "").strip(),
        "description": str(row.get("description") or "")[:500].strip(),
        "source_platform": str(row.get("site") or "jobspy").strip().lower(),
    }

def main():
    try:
        args_b64 = sys.argv[1]
        args_json = base64.b64decode(args_b64).decode('utf-8')
        options = json.loads(args_json)

        jobs_df = scrape_jobs(
            site_name=options.get("sites", ["linkedin", "indeed"]),
            search_term=options.get("search_term", "software engineer"),
            location=options.get("location", "remote"),
            results_wanted=options.get("results_wanted", 20),
            country_linkedin=options.get("country", "usa"),
            job_type=options.get("job_type", None)
        )

        # Convert dataframe to list of normalized dicts
        records = jobs_df.to_dict(orient="records")
        normalized = [normalize_job(r) for r in records if r.get("title")]

        print(json.dumps(normalized))
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps([]))

if __name__ == "__main__":
    main()
