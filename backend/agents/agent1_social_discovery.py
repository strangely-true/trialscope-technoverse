"""
Agent 1 Social Discovery
Collects disease-specific social leads for a trial and stores pharma-reviewable leads.
"""

from datetime import datetime
import os
from typing import Any, Dict, List, Optional

from db.database import SessionLocal
from models.models import SocialDiscoveryLead
from services.llm_social_checker import check_post_confidence
from services.llm_service import get_fallback_llm


def run_social_discovery(
    trial_id: int,
    disease: str,
    stage: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Runs when pharma creates a trial.
    Scrapes Reddit and Twitter for this
    specific disease and stage dynamically.
    Passes each post through LLM checker.
    Saves HIGH and MEDIUM confidence matches
    to social_discovery_leads table.
    """
    db = SessionLocal()
    try:
        llm = get_fallback_llm(model_type="fast", temperature=0)

        disease_lower = (disease or "").lower().strip()
        stage_lower = (stage or "").lower().strip()

        reddit_posts = scrape_reddit_dynamic(disease=disease_lower, stage=stage_lower)
        twitter_posts = scrape_twitter_dynamic(disease=disease_lower, stage=stage_lower)
        all_posts = reddit_posts + twitter_posts

        created = 0
        skipped_existing = 0
        skipped_low_confidence = 0

        for post in all_posts:
            already_exists = (
                db.query(SocialDiscoveryLead)
                .filter(
                    SocialDiscoveryLead.username == post.get("username", ""),
                    SocialDiscoveryLead.post_url == post.get("post_url", ""),
                    SocialDiscoveryLead.trial_id == trial_id,
                )
                .first()
            )
            if already_exists:
                skipped_existing += 1
                continue

            result = check_post_confidence(
                post_text=post.get("post_text", ""),
                username=post.get("username", ""),
                disease=disease,
                stage=stage or "",
                llm=llm,
            )

            if not result.get("recruit_worthy", False):
                skipped_low_confidence += 1
                continue

            if float(result.get("confidence", 0.0)) < 0.5:
                skipped_low_confidence += 1
                continue

            lead = SocialDiscoveryLead(
                trial_id=trial_id,
                platform=post.get("platform", "unknown"),
                username=post.get("username", ""),
                profile_url=post.get("profile_url", ""),
                post_text=(post.get("post_text", "") or "")[:500],
                post_url=post.get("post_url", ""),
                llm_confidence=float(result.get("confidence", 0.0)),
                llm_reasoning=str(result.get("reasoning", "")),
                relation=str(result.get("relation", "unknown")),
                pharma_action="pending",
                dm_sent=False,
            )
            db.add(lead)
            created += 1

        db.commit()
        return {
            "trial_id": trial_id,
            "total_posts_checked": len(all_posts),
            "leads_created": created,
            "skipped_existing": skipped_existing,
            "skipped_low_confidence": skipped_low_confidence,
        }
    except Exception as exc:
        db.rollback()
        print(f"[SocialDiscovery] failed for trial {trial_id}: {exc}")
        return {"trial_id": trial_id, "error": str(exc)}
    finally:
        db.close()


def scrape_reddit_dynamic(disease: str, stage: str) -> List[Dict[str, str]]:
    """
    Dynamically builds subreddit list and
    search query from disease name.
    No hardcoded disease lists.
    """
    try:
        import praw

        reddit = praw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            username=os.getenv("REDDIT_USERNAME"),
            password=os.getenv("REDDIT_PASSWORD"),
            user_agent=os.getenv("REDDIT_USER_AGENT", "TrialGoBot/1.0"),
            check_for_async=False,
        )

        try:
            subreddit_search = reddit.subreddits.search(disease, limit=5)
            dynamic_subs = [s.display_name for s in subreddit_search]
        except Exception:
            dynamic_subs = []

        base_subs = ["AskDocs", "medical", "health", "cancer", "ChronicIllness"]
        all_subs = list(dict.fromkeys(dynamic_subs + base_subs))

        posts: List[Dict[str, str]] = []
        search_query = f"{disease} {stage}".strip()

        for sub_name in all_subs[:8]:
            try:
                sub = reddit.subreddit(sub_name)
                results = sub.search(search_query, limit=50, sort="new", time_filter="year")
                for post in results:
                    if not post.author:
                        continue
                    author = str(post.author)
                    if author in ["AutoModerator", "[deleted]"]:
                        continue
                    post_text = f"{post.title} {post.selftext}".strip()
                    if len(post_text) < 30:
                        continue
                    posts.append(
                        {
                            "platform": "reddit",
                            "username": author,
                            "profile_url": f"https://reddit.com/u/{author}",
                            "post_text": post_text[:600],
                            "post_url": f"https://reddit.com{post.permalink}",
                        }
                    )
            except Exception:
                continue

        return posts
    except Exception as exc:
        print(f"[SocialDiscovery] Reddit scrape failed: {exc}")
        return []


def scrape_twitter_dynamic(disease: str, stage: str) -> List[Dict[str, str]]:
    posts: List[Dict[str, str]] = []
    try:
        import tweepy

        client = tweepy.Client(bearer_token=os.getenv("TWITTER_BEARER_TOKEN"))

        stage_part = f'"{stage}"' if stage else ""
        query = (
            f'"{disease}" {stage_part} '
            f'(diagnosed OR "living with" OR "fighting" OR "my diagnosis") '
            f'-is:retweet lang:en'
        )

        tweets = client.search_recent_tweets(
            query=query,
            max_results=100,
            tweet_fields=["author_id", "text", "created_at"],
            expansions=["author_id"],
            user_fields=["username", "created_at", "public_metrics"],
        )

        if not tweets or not tweets.data:
            return []

        users_map = {}
        if tweets.includes and "users" in tweets.includes:
            for user in tweets.includes["users"]:
                users_map[user.id] = user

        for tweet in tweets.data:
            author = users_map.get(tweet.author_id)
            if not author:
                continue
            username = author.username
            posts.append(
                {
                    "platform": "twitter",
                    "username": username,
                    "profile_url": f"https://twitter.com/{username}",
                    "post_text": tweet.text,
                    "post_url": f"https://twitter.com/i/web/status/{tweet.id}",
                }
            )
    except Exception as exc:
        print(f"[SocialDiscovery] Twitter scrape failed: {exc}")

    return posts
