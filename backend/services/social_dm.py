"""Social DM helpers for manual pharma outreach actions."""

import os


def send_reddit_dm(username: str, message: str) -> bool:
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
        reddit.redditor(username).message(
            subject="Clinical trial opportunity",
            message=message,
        )
        return True
    except Exception as exc:
        print(f"[SocialDM] Reddit DM failed for {username}: {exc}")
        return False


def send_twitter_dm(username: str, message: str) -> bool:
    """
    Twitter/X DM support depends on elevated app permissions and user auth.
    This function tries best-effort and returns False if unavailable.
    """
    try:
        import tweepy

        bearer = os.getenv("TWITTER_BEARER_TOKEN")
        access_token = os.getenv("TWITTER_ACCESS_TOKEN")
        access_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
        api_key = os.getenv("TWITTER_API_KEY")
        api_secret = os.getenv("TWITTER_API_SECRET")

        if not all([bearer, access_token, access_secret, api_key, api_secret]):
            return False

        client = tweepy.Client(
            bearer_token=bearer,
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_secret,
        )

        user = client.get_user(username=username)
        if not user or not user.data:
            return False

        recipient_id = user.data.id
        # API availability varies by account level; keep guarded.
        client.create_direct_message(participant_id=recipient_id, text=message)
        return True
    except Exception as exc:
        print(f"[SocialDM] Twitter DM failed for {username}: {exc}")
        return False
