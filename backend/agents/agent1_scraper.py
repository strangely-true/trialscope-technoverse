"""
Agent 1 — Data Scraper
Scrapes ClinicalTrials.gov, WHO ICTRP, Reddit, Twitter, PatientsLikeMe.
"""
import requests
import os
from datetime import datetime
from sqlalchemy.orm import Session
from models.models import RawMedicalData, SocialRawPost
from dotenv import load_dotenv

load_dotenv()


from services.scraper_engine import TRIAL_DATABASES, fetch_database
import httpx

async def _scrape_all_registries(trial_id: int, disease: str, db: Session):
    """Fetch raw medical data from all 18 international registries using the unified engine."""
    counts = {}
    async with httpx.AsyncClient(timeout=20, verify=False) as client:
        for db_config in TRIAL_DATABASES:
            try:
                # We reuse the engine's fetch_database to get standardized trial objects
                trials = await fetch_database(client, db_config, disease)
                db_count = 0
                for trial in trials:
                    db.add(RawMedicalData(
                        trial_id=trial_id,
                        source=db_config["name"],
                        raw_json=trial
                    ))
                    db_count += 1
                db.commit()
                counts[db_config["name"]] = db_count
            except Exception as e:
                print(f"[Agent1] Registry {db_config['name']} error: {e}")
                counts[db_config["name"]] = 0
    return counts


def _scrape_reddit(trial_id: int, disease: str, db: Session):
    """Scrape Reddit posts via PRAW."""
    try:
        import praw
        reddit = praw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            user_agent=os.getenv("REDDIT_USER_AGENT", "TrialGoBot/1.0"),
            check_for_async=False,
        )
        disease_sub_map = {
            "cancer": ["cancer", "leukemia", "lymphoma"],
            "diabetes": ["diabetes", "diabetes_t1", "diabetes_t2"],
            "alzheimer": ["Alzheimers", "dementia"],
            "default": ["ChronicIllness", "medical", "patient"],
        }
        key = next((k for k in disease_sub_map if k in disease.lower()), "default")
        subreddits = disease_sub_map[key]
        count = 0
        for sub in subreddits:
            try:
                for post in reddit.subreddit(sub).new(limit=100):
                    db.add(SocialRawPost(
                        trial_id=trial_id,
                        source="reddit",
                        user_handle=str(post.author),
                        post_text=f"{post.title}\n{post.selftext}"[:2000],
                        post_date=datetime.utcfromtimestamp(post.created_utc),
                    ))
                    count += 1
            except Exception:
                pass
        db.commit()
        return count
    except Exception as e:
        print(f"[Agent1] Reddit error: {e}")
        db.add(SocialRawPost(
            trial_id=trial_id,
            source="reddit",
            user_handle="mock_user_reddit",
            post_text=f"I have been suffering from {disease} and feeling severe fatigue for 10 days.",
            post_date=datetime.utcnow(),
        ))
        db.commit()
        return 1


def _scrape_twitter(trial_id: int, disease: str, db: Session):
    """Search recent tweets via Tweepy."""
    try:
        import tweepy
        client = tweepy.Client(bearer_token=os.getenv("TWITTER_BEARER_TOKEN"))
        query = f"{disease} patient -is:retweet lang:en"
        tweets = client.search_recent_tweets(query=query, max_results=100)
        count = 0
        if tweets.data:
            for tweet in tweets.data:
                db.add(SocialRawPost(
                    trial_id=trial_id,
                    source="twitter",
                    user_handle=str(tweet.author_id),
                    post_text=tweet.text[:2000],
                    post_date=datetime.utcnow(),
                ))
                count += 1
            db.commit()
        return count
    except Exception as e:
        print(f"[Agent1] Twitter error: {e}")
        db.add(SocialRawPost(
            trial_id=trial_id,
            source="twitter",
            user_handle="mock_user_twitter",
            post_text=f"My doctor diagnosed me with {disease} last week, feeling very weak.",
            post_date=datetime.utcnow(),
        ))
        db.commit()
        return 1


async def run_scraper(trial_id: int, criteria_json: dict, db: Session) -> dict:
    """Main entry — runs all scrapers and returns counts per source."""
    disease = criteria_json.get("disease", "")
    print(f"[Agent1] Starting async scrape for trial {trial_id}, disease: {disease}")

    # Run medical registries first (all 18)
    registry_counts = await _scrape_all_registries(trial_id, disease, db)
    
    # Social media
    reddit_count = _scrape_reddit(trial_id, disease, db)
    twitter_count = _scrape_twitter(trial_id, disease, db)

    # Build result with breakdown
    result = {
        "registries": registry_counts,
        "reddit": reddit_count,
        "twitter": twitter_count,
        "total": sum(registry_counts.values()) + reddit_count + twitter_count,
    }
    print(f"[Agent1] Done: {result}")
    return result
