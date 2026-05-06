import asyncio
from backend.services.scraper_engine import search_all_databases_unified

async def test():
    results = await search_all_databases_unified('Heart Failure', {})
    print(f"Found {len(results)} matches.")
    sources = set([r['source_database'] for r in results])
    print(f"Sources: {sources}")

if __name__ == '__main__':
    asyncio.run(test())
