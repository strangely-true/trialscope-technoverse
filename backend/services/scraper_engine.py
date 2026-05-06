import asyncio
import httpx
from bs4 import BeautifulSoup
import json
import os
import re

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

TRIAL_DATABASES = [
  {
    "name": "ClinicalTrials.gov", "url": "https://clinicaltrials.gov", "api_url": "https://clinicaltrials.gov/api/v2/studies", "method": "api", "params_builder": "build_clinicaltrials_params"
  },
  {
    "name": "WHO ICTRP", "url": "https://trialsearch.who.int", "api_url": "https://trialsearch.who.int/Trial2.aspx", "method": "scrape", "search_param": "query"
  },
  {
    "name": "EU Clinical Trials Register", "url": "https://www.clinicaltrialsregister.eu", "api_url": "https://www.clinicaltrialsregister.eu/ctr-search/search", "method": "scrape", "search_param": "query"
  },
  {
    "name": "ISRCTN Registry", "url": "https://www.isrctn.com", "api_url": "https://www.isrctn.com/api/query/format/json", "method": "api", "search_param": "q"
  },
  {
    "name": "ANZCTR Australia", "url": "https://www.anzctr.org.au", "api_url": "https://www.anzctr.org.au/TrialSearch.aspx", "method": "scrape", "search_param": "searchTxt"
  },
  {
    "name": "CTRI India", "url": "https://ctri.nic.in", "api_url": "https://ctri.nic.in/Clinicaltrials/advsearch.php", "method": "scrape", "search_param": "query"
  },
  {
    "name": "ChiCTR China", "url": "https://www.chictr.org.cn", "api_url": "https://www.chictr.org.cn/searchproj.aspx", "method": "scrape", "search_param": "kw"
  },
  {
    "name": "DRKS Germany", "url": "https://drks.de", "api_url": "https://drks.de/search/en", "method": "scrape", "search_param": "query"
  },
  {
    "name": "UMIN Japan", "url": "https://umin.ac.jp", "api_url": "https://upload.umin.ac.jp/cgi-open-bin/ctr_e/ctr_search.cgi", "method": "scrape", "search_param": "query"
  },
  {
    "name": "Netherlands Trial Register", "url": "https://www.trialregister.nl", "api_url": "https://api.trialregister.nl/trials", "method": "api", "search_param": "q"
  },
  {
    "name": "REBEC Brazil", "url": "https://ensaiosclinicos.gov.br", "api_url": "https://ensaiosclinicos.gov.br/rg/", "method": "scrape", "search_param": "q"
  },
  {
    "name": "PACTR Africa", "url": "https://pactr.samrc.ac.za", "api_url": "https://pactr.samrc.ac.za/TrialSearch.aspx", "method": "scrape", "search_param": "query"
  },
  {
    "name": "IRCT Iran", "url": "https://en.irct.ir", "api_url": "https://en.irct.ir/search/result", "method": "scrape", "search_param": "query"
  },
  {
    "name": "Thai Clinical Trials", "url": "https://www.thaiclinicaltrials.org", "api_url": "https://www.thaiclinicaltrials.org/", "method": "scrape", "search_param": "s"
  },
  {
    "name": "SLCTR Sri Lanka", "url": "https://slctr.lk", "api_url": "https://slctr.lk/trials", "method": "scrape", "search_param": "search"
  },
  {
    "name": "Cochrane Library", "url": "https://www.cochranelibrary.com", "api_url": "https://www.cochranelibrary.com/search", "method": "scrape", "search_param": "searchBy"
  },
  {
    "name": "Research Registry", "url": "https://www.researchregistry.com", "api_url": "https://www.researchregistry.com/browse-the-registry", "method": "scrape", "search_param": "search"
  },
  {
    "name": "PubMed Trial Publications", "url": "https://pubmed.ncbi.nlm.nih.gov", "api_url": "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", "method": "api", "search_param": "term"
  },
  {
    "name": "Europe PMC", "url": "https://europepmc.org", "api_url": "https://www.ebi.ac.uk/europepmc/webservices/rest/search", "method": "api", "search_param": "query"
  }
]

_STOP_WORDS = {
    "the", "and", "for", "with", "from", "into", "that", "this", "trial", "trials",
    "study", "studies", "patient", "patients", "disease", "condition", "clinical",
}

_QUERY_SYNONYMS = {
    "blood": {"hematology", "hematologic", "haematology", "haematologic"},
    "cancer": {"oncology", "tumor", "tumour", "neoplasm", "leukemia", "lymphoma", "myeloma"},
    "heart": {"cardiac", "cardio", "cardiovascular"},
    "diabetes": {"glycemic", "glycaemic", "glucose"},
}


def _query_terms(search_query: str):
    raw_terms = re.findall(r"[a-z0-9]+", (search_query or "").lower())
    terms = {t for t in raw_terms if len(t) >= 3 and t not in _STOP_WORDS}
    expanded = set(terms)
    for term in terms:
        expanded.update(_QUERY_SYNONYMS.get(term, set()))
    return expanded


def _is_query_relevant(text: str, query_terms: set[str]) -> bool:
    if not query_terms:
        return True
    haystack = (text or "").lower()
    return any(term in haystack for term in query_terms)

def build_clinicaltrials_params(patient_condition: str):
    return {
        "query.cond": patient_condition,
        "filter.overallStatus": "RECRUITING",
        "pageSize": 5,
        "format": "json"
    }

async def fetch_database(client, db, patient_condition: str):
    results = []
    query_terms = _query_terms(patient_condition)
    try:
        if db.get("params_builder") == "build_clinicaltrials_params":
            params = build_clinicaltrials_params(patient_condition)
        else:
            params = {db["search_param"]: patient_condition}
            if db["name"] == "ISRCTN Registry":
                params["format"] = "json"
            elif db["name"] == "PubMed Trial Publications":
                params.update({"db": "pubmed", "retmode": "json", "retmax": 5})
            elif db["name"] == "Europe PMC":
                params.update({"format": "json", "pageSize": 5, "resultType": "core"})

        response = await client.get(db["api_url"], params=params, timeout=20)
        
        if response.status_code != 200:
            return results

        if db["method"] == "api":
            data = response.json()
            if db["name"] == "ClinicalTrials.gov":
                for s in data.get("studies", []):
                    p = s.get("protocolSection", {})
                    im = p.get("identificationModule", {})
                    nct = im.get("nctId", "")
                    results.append({
                        "trial_name": im.get("briefTitle", "Unknown"),
                        "external_trial_id": nct,
                        "condition": patient_condition,
                        "location": "",
                        "phase": ", ".join(p.get("designModule", {}).get("phases", [])) or "Unknown",
                        "status": "RECRUITING",
                        "eligibility_summary": p.get("descriptionModule", {}).get("briefSummary", "")[:500],
                        "external_url": f"https://clinicaltrials.gov/study/{nct}"
                    })
            elif db["name"] == "ISRCTN Registry":
                for t in data.get("content", []):
                    num = t.get("isrctnNumber", "")
                    results.append({
                        "trial_name": t.get("title", "Unknown"),
                        "external_trial_id": num,
                        "condition": t.get("condition", ""),
                        "location": t.get("recruitmentCountries", ""),
                        "phase": t.get("phase", "Unknown"),
                        "status": "RECRUITING",
                        "eligibility_summary": t.get("trialDescription", "")[:500],
                        "external_url": f"https://www.isrctn.com/{num}"
                    })
            elif "Semantic Scholar" in db["name"]:
                for paper in data.get("data", []):
                    pid = paper.get("paperId", "")
                    title = paper.get("title", "Unknown")
                    abstract = (paper.get("abstract", "") or "")
                    if not _is_query_relevant(f"{title} {abstract}", query_terms):
                        continue
                    results.append({
                        "trial_name": title,
                        "external_trial_id": pid,
                        "condition": patient_condition,
                        "location": "Global",
                        "phase": "Unknown",
                        "status": "RECRUITING",
                        "eligibility_summary": abstract[:500],
                        "external_url": f"https://www.semanticscholar.org/paper/{pid}"
                    })
            elif db["name"] == "PubMed Trial Publications":
                ids = data.get("esearchresult", {}).get("idlist", [])
                for pmid in ids:
                    results.append({
                        "trial_name": f"PubMed trial publication {pmid}",
                        "external_trial_id": pmid,
                        "condition": patient_condition,
                        "location": "Global",
                        "phase": "Unknown",
                        "status": "RECRUITING",
                        "eligibility_summary": f"PubMed publication related to {patient_condition}.",
                        "external_url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
                    })
            elif db["name"] == "Europe PMC":
                for item in data.get("resultList", {}).get("result", []):
                    title = item.get("title", "Unknown")
                    summary = f"{item.get('journalTitle', '')} {item.get('pubYear', '')}".strip()
                    if not _is_query_relevant(f"{title} {summary}", query_terms):
                        continue
                    pmcid = item.get("pmcid", "")
                    external_id = pmcid or item.get("id", "")
                    external_url = (
                        f"https://europepmc.org/article/PMC/{pmcid.replace('PMC', '')}"
                        if pmcid
                        else f"https://europepmc.org/article/MED/{item.get('id', '')}"
                    )
                    results.append({
                        "trial_name": title,
                        "external_trial_id": external_id,
                        "condition": patient_condition,
                        "location": "Global",
                        "phase": "Unknown",
                        "status": "RECRUITING",
                        "eligibility_summary": summary[:500],
                        "external_url": external_url
                    })
            elif db["name"] == "Netherlands Trial Register":
                items = data.get("results", data if isinstance(data, list) else [])
                for item in items:
                    title = item.get("scientific_title", item.get("public_title", "Unknown"))
                    summary = item.get("primary_objective", "")
                    if not _is_query_relevant(f"{title} {summary}", query_terms):
                        continue
                    trial_id = str(item.get("trialID", ""))
                    results.append({
                        "trial_name": title,
                        "external_trial_id": trial_id,
                        "condition": patient_condition,
                        "location": "Netherlands",
                        "phase": item.get("phase", "Unknown"),
                        "status": "RECRUITING",
                        "eligibility_summary": summary[:500],
                        "external_url": item.get("url", f"https://www.trialregister.nl/trial/{trial_id}")
                    })

        elif db["method"] == "scrape":
            soup = BeautifulSoup(response.text, "html.parser")
            # Fallback scraper logic
            links = soup.find_all("a", href=True)
            found = 0
            for link in links:
                if found >= 5: break
                text = link.get_text(strip=True)
                if len(text) > 30:
                    if not _is_query_relevant(text, query_terms):
                        continue
                    href = link["href"]
                    full_url = href if href.startswith("http") else db["url"] + href
                    results.append({
                        "trial_name": text[:200],
                        "external_trial_id": href,
                        "condition": patient_condition,
                        "location": "",
                        "phase": "Unknown",
                        "status": "RECRUITING",
                        "eligibility_summary": f"Trial from {db['name']}",
                        "external_url": full_url
                    })
                    found += 1
                    
    except Exception as e:
        print(f"[ScraperEngine] {db['name']} error: {e}")
    
    for r in results:
        r["source_database"] = db["name"]
        r["source_database_url"] = db["url"]
    
    return results

async def search_all_databases_unified(search_query: str, api_params: dict):
    from services.global_trial_scraper import search_all_databases

    return await search_all_databases(search_query, api_params)
