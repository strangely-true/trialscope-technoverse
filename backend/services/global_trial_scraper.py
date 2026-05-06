"""
Global Trial Scraper — Multi-source trial search with resilient fallbacks.
"""
import asyncio
import httpx
from bs4 import BeautifulSoup
import re

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

GLOBAL_DATABASE_CATALOG = [
    {"name": "ClinicalTrials.gov", "url": "https://clinicaltrials.gov"},
    {"name": "WHO ICTRP", "url": "https://trialsearch.who.int"},
    {"name": "EU Clinical Trials Register", "url": "https://www.clinicaltrialsregister.eu"},
    {"name": "ISRCTN Registry", "url": "https://www.isrctn.com"},
    {"name": "ANZCTR Australia", "url": "https://www.anzctr.org.au"},
    {"name": "CTRI India", "url": "https://ctri.nic.in"},
    {"name": "ChiCTR China", "url": "https://www.chictr.org.cn"},
    {"name": "DRKS Germany", "url": "https://drks.de"},
    {"name": "Thai Clinical Trials", "url": "https://www.thaiclinicaltrials.org"},
    {"name": "Netherlands Trial Register", "url": "https://www.trialregister.nl"},
    {"name": "REBEC Brazil", "url": "https://ensaiosclinicos.gov.br"},
    {"name": "PACTR Africa", "url": "https://pactr.samrc.ac.za"},
    {"name": "IRCT Iran", "url": "https://en.irct.ir"},
    {"name": "Cochrane Library", "url": "https://www.cochranelibrary.com"},
    {"name": "SLCTR Sri Lanka", "url": "https://slctr.lk"},
    {"name": "Research Registry", "url": "https://www.researchregistry.com"},
    {"name": "Semantic Scholar", "url": "https://www.semanticscholar.org"},
    {"name": "PubMed Trial Publications", "url": "https://pubmed.ncbi.nlm.nih.gov"},
    {"name": "Europe PMC", "url": "https://europepmc.org"},
]


def get_global_database_catalog() -> list[dict]:
    return GLOBAL_DATABASE_CATALOG

def _site_headers(extra=None):
    headers = {
        "User-Agent": UA,
        "Accept-Language": "en-US,en;q=0.9",
    }
    if extra:
        headers.update(extra)
    return headers

def _safe_keyword(search_query):
    query = (search_query or "").strip()
    if not query:
        return "clinical trial"
    return query.split()[0]

def _normalize_text(value):
    return " ".join((value or "").split())

def _join_url(base_url, href):
    if not href:
        return base_url
    if href.startswith("http"):
        return href
    return base_url.rstrip("/") + "/" + href.lstrip("/")

def _trial_record(trial_name, external_trial_id, condition, location, phase, status, eligibility_summary, external_url):
    return {
        "trial_name": trial_name[:200],
        "external_trial_id": external_trial_id,
        "condition": condition,
        "location": location,
        "phase": phase,
        "status": status,
        "eligibility_summary": (eligibility_summary or "")[:500],
        "external_url": external_url,
    }

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

_NOISE_TERMS = (
    "privacy policy",
    "data privacy declaration",
    "go back to home page",
    "contact us",
    "list by",
    "search tips",
    "who.int/clinical-trials-registry-platform",
)


def _query_terms(search_query: str) -> set[str]:
    raw_terms = re.findall(r"[a-z0-9]+", (search_query or "").lower())
    terms = {t for t in raw_terms if len(t) >= 3 and t not in _STOP_WORDS}
    expanded = set(terms)
    for term in terms:
        expanded.update(_QUERY_SYNONYMS.get(term, set()))
    return expanded


def _is_query_relevant(trial: dict, query_terms: set[str]) -> bool:
    if not query_terms:
        return True
    haystack = " ".join(
        [
            (trial.get("trial_name") or ""),
            (trial.get("eligibility_summary") or ""),
            (trial.get("external_url") or ""),
        ]
    ).lower()
    return any(term in haystack for term in query_terms)


def _is_noise_trial(trial: dict) -> bool:
    title = (trial.get("trial_name") or "").strip().lower()
    if not title or len(title) < 12:
        return True
    return any(noise in title for noise in _NOISE_TERMS)


def _dedupe_trials(trials: list[dict]) -> list[dict]:
    unique = []
    seen = set()
    for trial in trials:
        key = (
            (trial.get("source_database") or "").strip().lower(),
            (trial.get("external_url") or "").strip().lower(),
            (trial.get("trial_name") or "").strip().lower(),
        )
        if key in seen:
            continue
        seen.add(key)
        unique.append(trial)
    return unique


def _generic_extract_trials(html, base_url, source_name, condition, location, summary, phase="Unknown", status="RECRUITING", limit=4, min_length=20):
    soup = BeautifulSoup(html, "html.parser")
    results = []
    seen_urls = set()
    for link in soup.find_all("a", href=True):
        title = _normalize_text(link.get_text(" ", strip=True))
        href = link.get("href", "")
        if len(title) < min_length or not href:
            continue
        if any(skip in href.lower() for skip in ("javascript:", "mailto:", "tel:")):
            continue
        url = _join_url(base_url, href)
        if url in seen_urls:
            continue
        seen_urls.add(url)
        results.append(
            _trial_record(
                trial_name=title,
                external_trial_id=href,
                condition=condition,
                location=location,
                phase=phase,
                status=status,
                eligibility_summary=f"Trial from {source_name}. {summary}",
                external_url=url,
            )
        )
        if len(results) >= limit:
            break
    return results

async def _ct_gov(client, api_params):
    results = []
    try:
        r = await client.get("https://clinicaltrials.gov/api/v2/studies", params={
            "query.cond": api_params.get("condition", ""),
            "filter.overallStatus": "RECRUITING",
            "pageSize": 10, "format": "json"
        }, headers=_site_headers(), timeout=20)
        if r.status_code == 200:
            for s in r.json().get("studies", [])[:8]:
                p = s.get("protocolSection", {})
                im = p.get("identificationModule", {})
                dm = p.get("descriptionModule", {})
                sm = p.get("statusModule", {})
                phases = p.get("designModule", {}).get("phases", [])
                nct = im.get("nctId", "")
                results.append(_trial_record(
                    trial_name=im.get("briefTitle", "Unknown"),
                    external_trial_id=nct,
                    condition=api_params.get("condition", ""),
                    location=api_params.get("country", ""),
                    phase=", ".join(phases) or "Unknown",
                    status=sm.get("overallStatus", "RECRUITING"),
                    eligibility_summary=dm.get("briefSummary", ""),
                    external_url=f"https://clinicaltrials.gov/study/{nct}",
                ))
    except Exception as e:
        print(f"[Scraper] ClinicalTrials.gov error: {e}")
    return results, "ClinicalTrials.gov", "https://clinicaltrials.gov"


async def _who(client, search_query):
    results = []
    try:
        r = await client.get("https://trialsearch.who.int/Trial2.aspx",
            params={"query": search_query}, headers=_site_headers(), timeout=20)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            rows = soup.find_all("tr", class_="odd") + soup.find_all("tr", class_="even")
            if not rows:
                rows = soup.find_all("tr")[1:6]
            for row in rows[:4]:
                cols = row.find_all("td")
                if not cols: continue
                a = cols[0].find("a", href=True)
                title = cols[0].get_text(strip=True)
                if len(title) > 10:
                    url = _join_url("https://trialsearch.who.int", a["href"] if a else "")
                    results.append(_trial_record(
                        trial_name=title,
                        external_trial_id=url,
                        condition=search_query,
                        location="",
                        phase="Unknown",
                        status="RECRUITING",
                        eligibility_summary="Trial from WHO ICTRP.",
                        external_url=url,
                    ))
            if not results:
                results = _generic_extract_trials(
                    r.text,
                    base_url="https://trialsearch.who.int",
                    source_name="WHO ICTRP",
                    condition=search_query,
                    location="",
                    summary="Fallback HTML extraction.",
                )
    except Exception as e:
        print(f"[Scraper] WHO error: {e}")
    return results, "WHO ICTRP", "https://trialsearch.who.int"


async def _eu_ctr(client, search_query):
    results = []
    try:
        r = await client.get("https://www.clinicaltrialsregister.eu/ctr-search/search",
            params={"query": search_query}, headers=_site_headers(), timeout=20)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for row in soup.find_all("table", class_="result")[:5]:
                td = row.find("td", class_="first") or row.find("td")
                a = row.find("a", href=True)
                if td:
                    title = td.get_text(strip=True)
                    href = a["href"] if a else ""
                    url = _join_url("https://www.clinicaltrialsregister.eu", href)
                    if len(title) > 5:
                        results.append(_trial_record(
                            trial_name=title,
                            external_trial_id=href or url,
                            condition=search_query,
                            location="",
                            phase="Unknown",
                            status="RECRUITING",
                            eligibility_summary="EU Clinical Trials Register.",
                            external_url=url,
                        ))
            if not results:
                results = _generic_extract_trials(
                    r.text,
                    base_url="https://www.clinicaltrialsregister.eu",
                    source_name="EU Clinical Trials Register",
                    condition=search_query,
                    location="",
                    summary="Fallback HTML extraction.",
                )
    except Exception as e:
        print(f"[Scraper] EU CTR error: {e}")
    return results, "EU Clinical Trials Register", "https://www.clinicaltrialsregister.eu"


async def _isrctn(client, search_query):
    results = []
    try:
        r = await client.get("https://www.isrctn.com/api/query",
            params={"q": search_query, "filters": "recruitmentStatusCode:Recruiting",
                    "page": 1, "pageSize": 5, "format": "json"}, timeout=20)
        if r.status_code == 200:
            for t in r.json().get("content", [])[:4]:
                num = t.get("isrctnNumber", "")
                results.append(_trial_record(
                    trial_name=t.get("title", "Unknown"),
                    external_trial_id=num,
                    condition=t.get("condition", ""),
                    location=t.get("recruitmentCountries", ""),
                    phase=t.get("phase", "Unknown"),
                    status="RECRUITING",
                    eligibility_summary=t.get("trialDescription", ""),
                    external_url=f"https://www.isrctn.com/{num}",
                ))
    except Exception as e:
        print(f"[Scraper] ISRCTN error: {e}")
    return results, "ISRCTN Registry", "https://www.isrctn.com"


async def _anzctr(client, search_query):
    results = []
    try:
        r = await client.get("https://www.anzctr.org.au/TrialSearch.aspx",
            params={"searchTxt": search_query, "isBasic": "True"},
            headers=_site_headers(), timeout=20)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", href=lambda h: h and "ACTRN" in str(h))[:4]:
                title = a.get_text(strip=True)
                href = a["href"]
                url = _join_url("https://www.anzctr.org.au", href)
                if len(title) > 5:
                    results.append(_trial_record(
                        trial_name=title,
                        external_trial_id=href,
                        condition=search_query,
                        location="Australia",
                        phase="Unknown",
                        status="RECRUITING",
                        eligibility_summary="ANZCTR Australia.",
                        external_url=url,
                    ))
            if not results:
                results = _generic_extract_trials(
                    r.text,
                    base_url="https://www.anzctr.org.au",
                    source_name="ANZCTR Australia",
                    condition=search_query,
                    location="Australia",
                    summary="Fallback HTML extraction.",
                )
    except Exception as e:
        print(f"[Scraper] ANZCTR error: {e}")
    return results, "ANZCTR Australia", "https://www.anzctr.org.au"


async def _ctri(client, api_params):
    results = []
    try:
        r = await client.post("https://ctri.nic.in/Clinicaltrials/advsearch.php",
            data={"EncHid": "", "companyname": "", "catchwords": api_params.get("condition",""),
                  "phase": "", "Patient_Beneficiary": "", "StudyType": "",
                  "Country": api_params.get("country","India"), "state": "", "district": "", "Search": "Search"},
            headers=_site_headers({"Content-Type": "application/x-www-form-urlencoded"}), timeout=25)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for table in soup.find_all("table"):
                for row in table.find_all("tr")[1:5]:
                    cols = row.find_all("td")
                    if len(cols) > 1:
                        title = cols[1].get_text(strip=True)
                        a = cols[1].find("a", href=True)
                        href = a["href"] if a else ""
                        url = _join_url("https://ctri.nic.in", href)
                        if len(title) > 10:
                            results.append(_trial_record(
                                trial_name=title,
                                external_trial_id=href,
                                condition=api_params.get("condition", ""),
                                location="India",
                                phase="Unknown",
                                status="RECRUITING",
                                eligibility_summary="CTRI India trial.",
                                external_url=url,
                            ))
            if not results:
                results = _generic_extract_trials(
                    r.text,
                    base_url="https://ctri.nic.in",
                    source_name="CTRI India",
                    condition=api_params.get("condition", ""),
                    location="India",
                    summary="Fallback HTML extraction.",
                )
    except Exception as e:
        print(f"[Scraper] CTRI error: {e}")
    return results, "CTRI India", "https://ctri.nic.in"


async def _chictr(client, search_query):
    results = []
    keywords = ["leukemia", "lymphoma"] if "blood cancer" in search_query.lower() else [_safe_keyword(search_query)]
    try:
        for kw in keywords[:1]:
            r = await client.get("https://www.chictr.org.cn/searchprojEN.aspx",
                params={"kw": kw, "State": "0"}, headers=_site_headers(), timeout=20)
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, "html.parser")
                for item in (soup.find_all("div", class_="item") or soup.find_all("tr")[1:4])[:3]:
                    a = item.find("a") if hasattr(item, "find") else None
                    title = a.get_text(strip=True) if a else item.get_text(strip=True)[:100]
                    href = a.get("href","") if a else ""
                    url = _join_url("https://www.chictr.org.cn", href)
                    if len(title) > 10:
                        results.append(_trial_record(
                            trial_name=title,
                            external_trial_id=href,
                            condition=kw,
                            location="China",
                            phase="Unknown",
                            status="RECRUITING",
                            eligibility_summary="ChiCTR China trial.",
                            external_url=url,
                        ))
                if not results:
                    results = _generic_extract_trials(
                        r.text,
                        base_url="https://www.chictr.org.cn",
                        source_name="ChiCTR China",
                        condition=kw,
                        location="China",
                        summary="Fallback HTML extraction.",
                    )
    except Exception as e:
        print(f"[Scraper] ChiCTR error: {e}")
    return results, "ChiCTR China", "https://www.chictr.org.cn"


async def _drks(client, search_query):
    results = []
    try:
        r = await client.get("https://drks.de/search/en",
            params={"text_search_query": search_query, "enrollment_status": "OPEN"},
            headers=_site_headers({"Accept": "text/html"}), timeout=20)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for div in (soup.find_all("div", class_="search-result") or soup.find_all("article"))[:3]:
                a = div.find("a", href=True)
                h = div.find("h3") or div.find("h2") or div.find("a")
                if h:
                    title = h.get_text(strip=True)
                    href = a["href"] if a else ""
                    url = _join_url("https://drks.de", href)
                    if len(title) > 10:
                        results.append(_trial_record(
                            trial_name=title,
                            external_trial_id=href,
                            condition=search_query,
                            location="Germany",
                            phase="Unknown",
                            status="RECRUITING",
                            eligibility_summary="DRKS Germany trial.",
                            external_url=url,
                        ))
            if not results:
                results = _generic_extract_trials(
                    r.text,
                    base_url="https://drks.de",
                    source_name="DRKS Germany",
                    condition=search_query,
                    location="Germany",
                    summary="Fallback HTML extraction.",
                )
    except Exception as e:
        print(f"[Scraper] DRKS error: {e}")
    return results, "DRKS Germany", "https://drks.de"


async def _thai(client, search_query):
    results = []
    try:
        r = await client.get(
            "https://www.thaiclinicaltrials.org/",
            params={"s": search_query},
            headers=_site_headers(),
            timeout=20,
        )
        if r.status_code == 200:
            results = _generic_extract_trials(
                r.text,
                base_url="https://www.thaiclinicaltrials.org",
                source_name="Thai Clinical Trials",
                condition=search_query,
                location="Thailand",
                summary="Thai Clinical Trials search result.",
            )
    except Exception as e:
        print(f"[Scraper] Thai Clinical Trials error: {e}")
    return results, "Thai Clinical Trials", "https://www.thaiclinicaltrials.org"


async def _netherlands(client, search_query):
    results = []
    try:
        r = await client.get("https://api.trialregister.nl/trials",
            params={"q": search_query, "status": "open"},
            headers=_site_headers({"Accept": "application/json"}), timeout=20)
        if r.status_code == 200:
            data = r.json()
            items = data.get("results", data if isinstance(data, list) else [])
            for t in items[:4]:
                title = t.get("scientific_title", t.get("public_title", "Unknown"))
                results.append(_trial_record(
                    trial_name=title,
                    external_trial_id=str(t.get("trialID", "")),
                    condition=t.get("condition", ""),
                    location="Netherlands",
                    phase=t.get("phase", "Unknown"),
                    status="RECRUITING",
                    eligibility_summary=t.get("primary_objective", ""),
                    external_url=t.get("url", f"https://www.trialregister.nl/trial/{t.get('trialID', '')}"),
                ))
    except Exception as e:
        print(f"[Scraper] Netherlands error: {e}")
    return results, "Netherlands Trial Register", "https://www.trialregister.nl"


async def _rebec(client, search_query):
    results = []
    kw = "leucemia" if "blood cancer" in search_query.lower() else _safe_keyword(search_query)
    try:
        r = await client.get("https://ensaiosclinicos.gov.br/rg/",
            params={"q": kw}, headers=_site_headers(), timeout=20)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for item in (soup.find_all("div", class_="search-result") or list(soup.find_all("tr"))[1:5])[:3]:
                a = item.find("a") if hasattr(item, "find") else None
                title = a.get_text(strip=True) if a else item.get_text(strip=True)[:100]
                href = a["href"] if a and a.get("href") else ""
                url = _join_url("https://ensaiosclinicos.gov.br", href)
                if len(title) > 10:
                    results.append(_trial_record(
                        trial_name=title,
                        external_trial_id=href,
                        condition=kw,
                        location="Brazil",
                        phase="Unknown",
                        status="RECRUITING",
                        eligibility_summary="REBEC Brazil trial.",
                        external_url=url,
                    ))
            if not results:
                results = _generic_extract_trials(
                    r.text,
                    base_url="https://ensaiosclinicos.gov.br",
                    source_name="REBEC Brazil",
                    condition=kw,
                    location="Brazil",
                    summary="Fallback HTML extraction.",
                )
    except Exception as e:
        print(f"[Scraper] REBEC error: {e}")
    return results, "REBEC Brazil", "https://ensaiosclinicos.gov.br"


async def _pactr(client, search_query):
    results = []
    try:
        r = await client.get("https://pactr.samrc.ac.za/TrialSearch.aspx",
            params={"query": search_query}, headers=_site_headers(), timeout=20)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            grid = soup.find("table", id="GridView1")
            rows_src = grid.find_all("tr")[1:5] if grid else soup.find_all("tr")[1:5]
            for row in rows_src:
                cols = row.find_all("td")
                if not cols: continue
                a = row.find("a", href=True)
                title = cols[0].get_text(strip=True)
                url = _join_url("https://pactr.samrc.ac.za", a["href"] if a else "")
                if len(title) > 10:
                    results.append(_trial_record(
                        trial_name=title,
                        external_trial_id=url,
                        condition=search_query,
                        location="Africa",
                        phase="Unknown",
                        status="RECRUITING",
                        eligibility_summary="PACTR Africa trial.",
                        external_url=url,
                    ))
            if not results:
                results = _generic_extract_trials(
                    r.text,
                    base_url="https://pactr.samrc.ac.za",
                    source_name="PACTR Africa",
                    condition=search_query,
                    location="Africa",
                    summary="Fallback HTML extraction.",
                )
    except Exception as e:
        print(f"[Scraper] PACTR error: {e}")
    return results, "PACTR Africa", "https://pactr.samrc.ac.za"


async def _irct(client, search_query):
    results = []
    try:
        r = await client.get("https://en.irct.ir/search/result",
            params={"query": search_query, "page": 1},
            headers=_site_headers(), timeout=20)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for item in (soup.find_all("div", class_="search-item") or soup.find_all("article"))[:4]:
                h = item.find("h3") or item.find("h2") or item.find("a")
                a = item.find("a", href=True)
                if h:
                    title = h.get_text(strip=True)
                    href = a["href"] if a else ""
                    url = _join_url("https://en.irct.ir", href)
                    if len(title) > 10:
                        results.append(_trial_record(
                            trial_name=title,
                            external_trial_id=href,
                            condition=search_query,
                            location="Iran",
                            phase="Unknown",
                            status="RECRUITING",
                            eligibility_summary="IRCT Iran trial.",
                            external_url=url,
                        ))
            if not results:
                results = _generic_extract_trials(
                    r.text,
                    base_url="https://en.irct.ir",
                    source_name="IRCT Iran",
                    condition=search_query,
                    location="Iran",
                    summary="Fallback HTML extraction.",
                )
    except Exception as e:
        print(f"[Scraper] IRCT error: {e}")
    return results, "IRCT Iran", "https://en.irct.ir"


async def _cochrane(client, search_query):
    results = []
    try:
        r = await client.get("https://www.cochranelibrary.com/search",
            params={"searchBy": "1", "searchText": search_query, "searchType": "basic",
                    "isWordVariations": "1", "resultPerPage": "10"},
            headers=_site_headers(), timeout=20)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for item in (soup.find_all("div", class_="search-results-item") or soup.find_all("li", class_="search-results-item"))[:4]:
                h = item.find("h3") or item.find("a")
                a = item.find("a", href=True)
                if h:
                    title = h.get_text(strip=True)
                    href = a["href"] if a else ""
                    url = _join_url("https://www.cochranelibrary.com", href)
                    if len(title) > 10:
                        results.append(_trial_record(
                            trial_name=title,
                            external_trial_id=href,
                            condition=search_query,
                            location="Global",
                            phase="Unknown",
                            status="RECRUITING",
                            eligibility_summary="Cochrane Library review.",
                            external_url=url,
                        ))
            if not results:
                results = _generic_extract_trials(
                    r.text,
                    base_url="https://www.cochranelibrary.com",
                    source_name="Cochrane Library",
                    condition=search_query,
                    location="Global",
                    summary="Fallback HTML extraction.",
                )
    except Exception as e:
        print(f"[Scraper] Cochrane error: {e}")
    return results, "Cochrane Library", "https://www.cochranelibrary.com"


async def _slctr(client, search_query):
    results = []
    try:
        r = await client.get("https://slctr.lk/trials",
            params={"search": search_query}, headers=_site_headers(), timeout=20)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for item in (soup.find_all("div", class_="trial-item") or list(soup.find_all("tbody"))[:1])[:3]:
                a = item.find("a") if hasattr(item, "find") else None
                title = a.get_text(strip=True) if a else item.get_text(strip=True)[:80]
                if len(title) > 10:
                    url = _join_url("https://slctr.lk", a["href"] if a and a.get("href") else "")
                    results.append(_trial_record(
                        trial_name=title,
                        external_trial_id=url,
                        condition=search_query,
                        location="Sri Lanka",
                        phase="Unknown",
                        status="RECRUITING",
                        eligibility_summary="SLCTR Sri Lanka trial.",
                        external_url=url,
                    ))
            if not results:
                results = _generic_extract_trials(
                    r.text,
                    base_url="https://slctr.lk",
                    source_name="SLCTR Sri Lanka",
                    condition=search_query,
                    location="Sri Lanka",
                    summary="Fallback HTML extraction.",
                )
    except Exception as e:
        print(f"[Scraper] SLCTR error: {e}")
    return results, "SLCTR Sri Lanka", "https://slctr.lk"


async def _research_registry(client, search_query):
    results = []
    try:
        r = await client.get("https://www.researchregistry.com/api/registries",
            params={"search": search_query, "page": 1},
            headers=_site_headers({"Accept": "application/json"}), timeout=20)
        if r.status_code == 200:
            for item in r.json().get("data", [])[:4]:
                uid = item.get("uniqueIdentifyingNumber","")
                results.append(_trial_record(
                    trial_name=item.get("title", "Unknown"),
                    external_trial_id=uid,
                    condition=item.get("condition", ""),
                    location=item.get("country", "Global"),
                    phase=item.get("phase", "Unknown"),
                    status="RECRUITING",
                    eligibility_summary=item.get("description", ""),
                    external_url=f"https://www.researchregistry.com/registry/{uid}",
                ))
    except Exception as e:
        print(f"[Scraper] Research Registry error: {e}")
    return results, "Research Registry", "https://www.researchregistry.com"


async def _semantic_scholar(client, search_query):
    results = []
    try:
        r = await client.get("https://api.semanticscholar.org/graph/v1/paper/search",
            params={"query": f"{search_query} clinical trial recruiting",
                    "fields": "title,abstract,year,externalIds", "limit": 5}, timeout=20)
        if r.status_code == 200:
            for paper in r.json().get("data", [])[:5]:
                pid = paper.get("paperId","")
                results.append(_trial_record(
                    trial_name=paper.get("title", "Unknown"),
                    external_trial_id=pid,
                    condition=search_query,
                    location="Global",
                    phase="Unknown",
                    status="RECRUITING",
                    eligibility_summary=(paper.get("abstract", "") or ""),
                    external_url=f"https://www.semanticscholar.org/paper/{pid}",
                ))
    except Exception as e:
        print(f"[Scraper] Semantic Scholar error: {e}")
    return results, "Semantic Scholar", "https://www.semanticscholar.org"


async def _pubmed_trials(client, search_query):
    results = []
    try:
        search_response = await client.get(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
            params={
                "db": "pubmed",
                "term": f"{search_query} clinical trial recruiting",
                "retmode": "json",
                "retmax": 5,
            },
            headers=_site_headers({"Accept": "application/json"}),
            timeout=20,
        )
        if search_response.status_code != 200:
            return results, "PubMed Trial Publications", "https://pubmed.ncbi.nlm.nih.gov"

        pmids = search_response.json().get("esearchresult", {}).get("idlist", [])[:4]
        if not pmids:
            return results, "PubMed Trial Publications", "https://pubmed.ncbi.nlm.nih.gov"

        summary_response = await client.get(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
            params={
                "db": "pubmed",
                "id": ",".join(pmids),
                "retmode": "json",
            },
            headers=_site_headers({"Accept": "application/json"}),
            timeout=20,
        )
        if summary_response.status_code != 200:
            return results, "PubMed Trial Publications", "https://pubmed.ncbi.nlm.nih.gov"

        summaries = summary_response.json().get("result", {})
        for pmid in pmids:
            record = summaries.get(pmid, {})
            title = record.get("title") or "Unknown"
            source = record.get("source") or "PubMed"
            pubdate = record.get("pubdate") or ""
            results.append(_trial_record(
                trial_name=title,
                external_trial_id=pmid,
                condition=search_query,
                location="Global",
                phase="Unknown",
                status="RECRUITING",
                eligibility_summary=f"PubMed record from {source}. {pubdate}".strip(),
                external_url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            ))
    except Exception as e:
        print(f"[Scraper] PubMed error: {e}")
    return results, "PubMed Trial Publications", "https://pubmed.ncbi.nlm.nih.gov"


async def _europe_pmc_trials(client, search_query):
    results = []
    try:
        response = await client.get(
            "https://www.ebi.ac.uk/europepmc/webservices/rest/search",
            params={
                "query": f'{search_query} AND "clinical trial"',
                "format": "json",
                "pageSize": 6,
                "resultType": "core",
            },
            headers=_site_headers({"Accept": "application/json"}),
            timeout=20,
        )
        if response.status_code != 200:
            return results, "Europe PMC", "https://europepmc.org"

        items = response.json().get("resultList", {}).get("result", [])
        for item in items[:5]:
            pmcid = item.get("pmcid", "")
            ext_id = pmcid or item.get("id", "")
            title = item.get("title", "Unknown")
            journal = item.get("journalTitle", "")
            pub_year = item.get("pubYear", "")
            if pmcid:
                external_url = f"https://europepmc.org/article/PMC/{pmcid.replace('PMC', '')}"
            else:
                external_url = f"https://europepmc.org/article/MED/{item.get('id', '')}"
            results.append(
                _trial_record(
                    trial_name=title,
                    external_trial_id=ext_id,
                    condition=search_query,
                    location="Global",
                    phase="Unknown",
                    status="RECRUITING",
                    eligibility_summary=f"Europe PMC record from {journal}. {pub_year}".strip(),
                    external_url=external_url,
                )
            )
    except Exception as e:
        print(f"[Scraper] Europe PMC error: {e}")
    return results, "Europe PMC", "https://europepmc.org"


# ─── Main parallel search ─────────────────────────────────────────────────────

async def search_all_databases(search_query: str, api_params: dict) -> list:
    all_results = []
    primary_condition_query = (api_params or {}).get("condition") or search_query or ""
    source_query = " ".join(str(primary_condition_query).split()) or "clinical trial"
    query_terms = _query_terms(source_query)
    async with httpx.AsyncClient(
        follow_redirects=True,
        verify=False,
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
    ) as client:
        tasks = [
            _ct_gov(client, api_params),
            _who(client, source_query),
            _eu_ctr(client, source_query),
            _isrctn(client, source_query),
            _anzctr(client, source_query),
            _ctri(client, api_params),
            _chictr(client, source_query),
            _drks(client, source_query),
            _umin(client, source_query),
            _thai(client, source_query),
            _netherlands(client, source_query),
            _rebec(client, source_query),
            _pactr(client, source_query),
            _irct(client, source_query),
            _cochrane(client, source_query),
            _slctr(client, source_query),
            _research_registry(client, source_query),
            _semantic_scholar(client, source_query),
            _pubmed_trials(client, source_query),
            _europe_pmc_trials(client, source_query),
        ]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

    for response in responses:
        if isinstance(response, Exception):
            continue
        trials, db_name, db_url = response
        clean_trials = [t for t in trials if not _is_noise_trial(t)]
        relevant_trials = [t for t in clean_trials if _is_query_relevant(t, query_terms)]
        selected_trials = relevant_trials if relevant_trials else clean_trials[:2]
        print(
            f"[Scraper] {db_name}: fetched={len(trials)} clean={len(clean_trials)} "
            f"relevant={len(relevant_trials)} selected={len(selected_trials)}"
        )
        for trial in selected_trials:
            trial["source_database"] = db_name
            trial["source_database_url"] = db_url
            all_results.append(trial)

    all_results = _dedupe_trials(all_results)
    print(f"[Scraper] Total raw results: {len(all_results)}")
    return all_results


# Keep old helpers for any remaining imports
def score_external_match(trial, questionnaire):
    return 0.75

def assign_tier(score):
    return "HIGH" if score >= 0.75 else "MEDIUM" if score >= 0.5 else "LOW"
