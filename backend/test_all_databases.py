"""
Standalone audit script — tests all 20 clinical trial databases.
Run: python test_all_databases.py
"""
import httpx
import asyncio
from bs4 import BeautifulSoup

CONDITION = "blood cancer"
COUNTRY = "India"
AGE = 34
BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"


async def test_db(name, coro):
    try:
        result = await coro
        count = len(result)
        sample = result[0]["trial_name"][:80] if result else "(none)"
        status = "WORKING" if count > 0 else "EMPTY"
        print(f"  STATUS : {status}")
        print(f"  COUNT  : {count}")
        print(f"  SAMPLE : {sample}")
        return count
    except Exception as e:
        print(f"  STATUS : BROKEN")
        print(f"  ERROR  : {str(e)[:120]}")
        return 0


# ── 1. ClinicalTrials.gov ─────────────────────────────────────────────────────
async def test_clinicaltrials(client):
    r = await client.get(
        "https://clinicaltrials.gov/api/v2/studies",
        params={
            "query.cond": CONDITION,
            "query.locn": COUNTRY,
            "filter.overallStatus": "RECRUITING",
            "pageSize": 10,
            "format": "json",
        },
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        for s in r.json().get("studies", [])[:5]:
            proto = s.get("protocolSection", {})
            id_m = proto.get("identificationModule", {})
            nct = id_m.get("nctId", "")
            results.append({
                "trial_name": id_m.get("briefTitle", "Unknown"),
                "external_url": f"https://clinicaltrials.gov/study/{nct}",
            })
    return results


# ── 2. WHO ICTRP ──────────────────────────────────────────────────────────────
async def test_who(client):
    r = await client.get(
        "https://trialsearch.who.int/Trial2.aspx",
        params={"query": CONDITION},
        headers={"User-Agent": BROWSER_UA},
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        rows = soup.find_all("tr", class_="odd") + soup.find_all("tr", class_="even")
        for row in rows[:3]:
            cols = row.find_all("td")
            if cols:
                title = cols[0].get_text(strip=True)
                link = cols[0].find("a")
                url = "https://trialsearch.who.int" + link["href"] if link and link.get("href") else "https://trialsearch.who.int"
                if len(title) > 10:
                    results.append({"trial_name": title[:200], "external_url": url})
    return results


# ── 3. EU Clinical Trials Register ────────────────────────────────────────────
async def test_eu_ctr(client):
    r = await client.get(
        "https://www.clinicaltrialsregister.eu/ctr-search/search",
        params={"query": CONDITION},
        headers={"User-Agent": BROWSER_UA},
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        for row in soup.find_all("table", class_="result")[:3]:
            td = row.find("td", class_="first") or row.find("td")
            a = row.find("a", href=True)
            if td:
                title = td.get_text(strip=True)
                url = "https://www.clinicaltrialsregister.eu" + a["href"] if a else "https://www.clinicaltrialsregister.eu"
                if len(title) > 10:
                    results.append({"trial_name": title[:200], "external_url": url})
    return results


# ── 4. ISRCTN Registry ────────────────────────────────────────────────────────
async def test_isrctn(client):
    r = await client.get(
        "https://www.isrctn.com/api/query",
        params={
            "q": CONDITION,
            "filters": "recruitmentStatusCode:Recruiting",
            "page": 1,
            "pageSize": 5,
            "format": "json",
        },
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        try:
            data = r.json()
            trials = data.get("content", [])
            for t in trials[:3]:
                results.append({
                    "trial_name": t.get("title", "Unknown"),
                    "external_url": f"https://www.isrctn.com/{t.get('isrctnNumber', '')}",
                })
        except Exception:
            pass
    return results


# ── 5. ANZCTR Australia ───────────────────────────────────────────────────────
async def test_anzctr(client):
    r = await client.get(
        "https://www.anzctr.org.au/TrialSearch.aspx",
        params={"searchTxt": CONDITION, "isBasic": "True"},
        headers={"User-Agent": BROWSER_UA},
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        for div in soup.find_all("div", class_="searchresult")[:3]:
            a = div.find("a")
            if a:
                title = a.get_text(strip=True)
                href = a["href"]
                url = ("https://www.anzctr.org.au" + href) if not href.startswith("http") else href
                if len(title) > 10:
                    results.append({"trial_name": title[:200], "external_url": url})
        if not results:
            for a in soup.find_all("a", href=lambda h: h and "ACTRN" in str(h))[:3]:
                title = a.get_text(strip=True)
                if len(title) > 5:
                    results.append({"trial_name": title[:200], "external_url": "https://www.anzctr.org.au" + a["href"]})
    return results


# ── 6. CTRI India ─────────────────────────────────────────────────────────────
async def test_ctri(client):
    r = await client.get(
        "https://ctri.nic.in/Clinicaltrials/advsearch.php",
        params={
            "EncHid": "", "companyname": "",
            "catchwords": CONDITION, "phase": "",
            "Patient_Beneficiary": "", "StudyType": "",
            "Country": COUNTRY, "state": "", "district": "",
            "Search": "Search",
        },
        headers={"User-Agent": BROWSER_UA},
        timeout=25.0,
    )
    results = []
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:4]:
                cols = row.find_all("td")
                if len(cols) > 1:
                    title = cols[1].get_text(strip=True)
                    a = cols[1].find("a", href=True)
                    url = "https://ctri.nic.in" + a["href"] if a and not a["href"].startswith("http") else (a["href"] if a else "https://ctri.nic.in")
                    if len(title) > 10:
                        results.append({"trial_name": title[:200], "external_url": url})
    return results


# ── 7. ChiCTR China ───────────────────────────────────────────────────────────
async def test_chictr(client):
    r = await client.get(
        "https://www.chictr.org.cn/searchprojEN.aspx",
        params={"kw": "leukemia", "State": "0"},
        headers={"User-Agent": BROWSER_UA},
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        for item in soup.find_all("div", class_="item")[:3]:
            a = item.find("a")
            if a:
                title = a.get_text(strip=True)
                href = a.get("href", "")
                url = ("https://www.chictr.org.cn" + href) if not href.startswith("http") else href
                if len(title) > 10:
                    results.append({"trial_name": title[:200], "external_url": url})
    return results


# ── 8. DRKS Germany ───────────────────────────────────────────────────────────
async def test_drks(client):
    r = await client.get(
        "https://drks.de/search/en",
        params={"text_search_query": CONDITION, "enrollment_status": "OPEN"},
        headers={"User-Agent": BROWSER_UA, "Accept": "application/json, text/html"},
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        try:
            data = r.json()
            items = data if isinstance(data, list) else data.get("results", data.get("data", []))
            for item in items[:3]:
                if isinstance(item, dict):
                    results.append({
                        "trial_name": item.get("title", item.get("scientific_title", "Unknown"))[:200],
                        "external_url": item.get("url", "https://drks.de"),
                    })
        except Exception:
            soup = BeautifulSoup(r.text, "html.parser")
            for div in (soup.find_all("div", class_="search-result") or soup.find_all("div", class_="result"))[:3]:
                a = div.find("a")
                h = div.find("h3") or div.find("h2")
                title = (h or a).get_text(strip=True) if (h or a) else ""
                if len(title) > 10:
                    results.append({"trial_name": title[:200], "external_url": "https://drks.de"})
    return results


# ── 9. UMIN Japan ─────────────────────────────────────────────────────────────
async def test_umin(client):
    r = await client.get(
        "https://upload.umin.ac.jp/cgi-open-bin/ctr_e/ctr_search.cgi",
        params={"language": "E", "basic_01": "leukemia", "basic_09": "1"},
        headers={"User-Agent": BROWSER_UA},
        timeout=25.0,
    )
    results = []
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        for a in soup.find_all("a", href=lambda h: h and "recptno" in str(h))[:3]:
            title = a.get_text(strip=True)
            href = a["href"]
            url = ("https://upload.umin.ac.jp" + href) if not href.startswith("http") else href
            if len(title) > 5:
                results.append({"trial_name": title[:200], "external_url": url})
    return results


# ── 10. Netherlands Trial Register ────────────────────────────────────────────
async def test_netherlands(client):
    r = await client.get(
        "https://api.trialregister.nl/trials",
        params={"q": CONDITION, "status": "open"},
        headers={"Accept": "application/json", "User-Agent": BROWSER_UA},
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        try:
            data = r.json()
            for trial in data.get("results", data if isinstance(data, list) else [])[:3]:
                results.append({
                    "trial_name": trial.get("scientific_title", trial.get("public_title", "Unknown"))[:200],
                    "external_url": trial.get("url", "https://www.trialregister.nl"),
                })
        except Exception:
            pass
    return results


# ── 11. REBEC Brazil ──────────────────────────────────────────────────────────
async def test_rebec(client):
    r = await client.get(
        "https://ensaiosclinicos.gov.br/rg/",
        params={"q": "leukemia"},
        headers={"User-Agent": BROWSER_UA},
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        items = soup.find_all("div", class_="search-result") or list(soup.find_all("tr"))[1:4]
        for item in items[:3]:
            a = item.find("a") if hasattr(item, "find") else None
            title = (a.get_text(strip=True) if a else item.get_text(strip=True)[:100]) if item else ""
            if len(title) > 10:
                href = a["href"] if a and a.get("href") else ""
                url = ("https://ensaiosclinicos.gov.br" + href) if href and not href.startswith("http") else "https://ensaiosclinicos.gov.br"
                results.append({"trial_name": title[:200], "external_url": url})
    return results


# ── 12. PACTR Africa ──────────────────────────────────────────────────────────
async def test_pactr(client):
    r = await client.get(
        "https://pactr.samrc.ac.za/TrialSearch.aspx",
        params={"query": CONDITION},
        headers={"User-Agent": BROWSER_UA},
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        grid = soup.find("table", id="GridView1")
        if grid:
            for row in grid.find_all("tr")[1:4]:
                cols = row.find_all("td")
                if cols:
                    title = cols[0].get_text(strip=True)
                    a = row.find("a", href=lambda h: h and "PACTR" in str(h))
                    url = a["href"] if a else "https://pactr.samrc.ac.za"
                    if len(title) > 10:
                        results.append({"trial_name": title[:200], "external_url": url})
        if not results:
            for a in soup.find_all("a", href=lambda h: h and "PACTR" in str(h))[:3]:
                title = a.get_text(strip=True)
                if len(title) > 5:
                    results.append({"trial_name": title[:200], "external_url": a["href"]})
    return results


# ── 13. IRCT Iran ─────────────────────────────────────────────────────────────
async def test_irct(client):
    r = await client.get(
        "https://en.irct.ir/search/result",
        params={"query": CONDITION, "page": 1},
        headers={"User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9"},
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        items = soup.find_all("div", class_="search-item") or soup.find_all("article")
        for item in items[:3]:
            title_tag = item.find("h3") or item.find("h2") or item.find("a")
            a = item.find("a", href=True)
            if title_tag:
                title = title_tag.get_text(strip=True)
                href = a["href"] if a else ""
                url = ("https://en.irct.ir" + href) if href and not href.startswith("http") else "https://en.irct.ir"
                if len(title) > 10:
                    results.append({"trial_name": title[:200], "external_url": url})
    return results


# ── 14. Thai Clinical Trials ──────────────────────────────────────────────────
async def test_thai(client):
    r = await client.get(
        "https://www.thaiclinicaltrials.org/",
        params={"s": CONDITION},
        headers={"User-Agent": BROWSER_UA},
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        items = soup.find_all("article") or soup.find_all("div", class_="search-results")
        for item in items[:3]:
            h = item.find("h2") or item.find("h3") or item.find("a")
            a = item.find("a", href=True)
            if h:
                title = h.get_text(strip=True)
                url = a["href"] if a else "https://www.thaiclinicaltrials.org"
                if len(title) > 10:
                    results.append({"trial_name": title[:200], "external_url": url})
    return results


# ── 15. SLCTR Sri Lanka ───────────────────────────────────────────────────────
async def test_slctr(client):
    r = await client.get(
        "https://slctr.lk/trials",
        params={"search": CONDITION},
        headers={"User-Agent": BROWSER_UA},
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        items = soup.find_all("div", class_="trial-item") or list(soup.find_all("tbody"))[:1]
        for item in items[:3]:
            a = item.find("a") if hasattr(item, "find") else None
            title = a.get_text(strip=True) if a else item.get_text(strip=True)[:80]
            if len(title) > 10:
                url = a["href"] if a and a.get("href") else "https://slctr.lk"
                results.append({"trial_name": title[:200], "external_url": url})
    return results


# ── 16. Cochrane Library ──────────────────────────────────────────────────────
async def test_cochrane(client):
    r = await client.get(
        "https://www.cochranelibrary.com/search",
        params={
            "searchBy": "1",
            "searchText": CONDITION,
            "searchType": "basic",
            "isWordVariations": "1",
            "resultPerPage": "10",
        },
        headers={"User-Agent": BROWSER_UA},
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        for item in soup.find_all("div", class_="search-results-item")[:3]:
            h = item.find("h3") or item.find("a")
            a = item.find("a", href=True)
            if h:
                title = h.get_text(strip=True)
                href = a["href"] if a else ""
                url = ("https://www.cochranelibrary.com" + href) if href and not href.startswith("http") else "https://www.cochranelibrary.com"
                if len(title) > 10:
                    results.append({"trial_name": title[:200], "external_url": url})
    return results


# ── 17. Research Registry ─────────────────────────────────────────────────────
async def test_research_registry(client):
    r = await client.get(
        "https://www.researchregistry.com/api/registries",
        params={"search": CONDITION, "page": 1},
        headers={"User-Agent": BROWSER_UA, "Accept": "application/json"},
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        try:
            data = r.json()
            for item in data.get("data", [])[:3]:
                results.append({
                    "trial_name": item.get("title", "Unknown")[:200],
                    "external_url": f"https://www.researchregistry.com/registry/{item.get('uniqueIdentifyingNumber', '')}",
                })
        except Exception:
            pass
    return results


# ── 18. Semantic Scholar ──────────────────────────────────────────────────────
async def test_semantic_scholar(client):
    r = await client.get(
        "https://api.semanticscholar.org/graph/v1/paper/search",
        params={
            "query": f"{CONDITION} clinical trial recruiting",
            "fields": "title,abstract,year,externalIds",
            "limit": 5,
        },
        timeout=20.0,
    )
    results = []
    if r.status_code == 200:
        data = r.json()
        for paper in data.get("data", [])[:5]:
            title = paper.get("title", "")
            paper_id = paper.get("paperId", "")
            results.append({
                "trial_name": title[:200],
                "external_url": f"https://www.semanticscholar.org/paper/{paper_id}",
            })
    return results


# ── MAIN ──────────────────────────────────────────────────────────────────────
async def main():
    print("\n" + "=" * 65)
    print("TRIALGO — GLOBAL DATABASE AUDIT")
    print(f"Query: condition='{CONDITION}', country='{COUNTRY}', age={AGE}")
    print("=" * 65 + "\n")

    tests = [
        ("ClinicalTrials.gov",      test_clinicaltrials),
        ("WHO ICTRP",               test_who),
        ("EU Clinical Trials Reg.", test_eu_ctr),
        ("ISRCTN Registry (UK)",    test_isrctn),
        ("ANZCTR Australia",        test_anzctr),
        ("CTRI India",              test_ctri),
        ("ChiCTR China",            test_chictr),
        ("DRKS Germany",            test_drks),
        ("UMIN Japan",              test_umin),
        ("Netherlands Register",    test_netherlands),
        ("REBEC Brazil",            test_rebec),
        ("PACTR Africa",            test_pactr),
        ("IRCT Iran",               test_irct),
        ("Thai Clinical Trials",    test_thai),
        ("SLCTR Sri Lanka",         test_slctr),
        ("Cochrane Library",        test_cochrane),
        ("Research Registry",       test_research_registry),
        ("Semantic Scholar",        test_semantic_scholar),
    ]

    grand_total = 0
    async with httpx.AsyncClient(
        follow_redirects=True,
        limits=httpx.Limits(max_connections=20),
        verify=False,
    ) as client:
        for i, (name, fn) in enumerate(tests, 1):
            print(f"DATABASE {i:2d} — {name}")
            count = await test_db(name, fn(client))
            grand_total += count
            print()

    print("=" * 65)
    print(f"TOTAL RAW RESULTS: {grand_total}")
    print("=" * 65)


if __name__ == "__main__":
    asyncio.run(main())
