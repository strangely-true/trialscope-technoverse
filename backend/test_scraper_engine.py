import asyncio
from services.scraper_engine import search_all_databases_unified

async def test():
    print("Testing ScraperEngine...")
    results = await search_all_databases_unified("Lung Cancer", {"condition": "Lung Cancer"})
    print(f"Found {len(results)} results")
    for r in results[:3]:
        print(f"- {r['trial_name']} ({r['source_database']})")

if __name__ == "__main__":
    asyncio.run(test())
